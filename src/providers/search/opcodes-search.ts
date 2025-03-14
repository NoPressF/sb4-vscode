import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Folder } from 'folder';
import { GtaVersion } from 'gta-version';

type CommandArgs = {
    name?: string;
    type?: string;
    source?: string;
};

type CommandIO = {
    input?: string;
    output?: string;
};

type CommandInfo = {
    id: string;
    name: string;
    isUnsupported?: boolean;
};

const VAR_NOTATIONS: Record<string, string> = {
    'var_any': 'var',
    'var_global': 'global var',
    'var_local': 'local var'
};

const LINE_THROUGH_REGEX = /<\/?s>/g;

export class OpcodesSearch {
    create(context: vscode.ExtensionContext) {
        const disposable = vscode.commands.registerCommand('sb4.showOpcodesWindow', () => {
            const sbFolderPath = this.getSB4FolderPath(context);

            if (!sbFolderPath) {
                Folder.showSB4FolderSelectionPrompt();
                return;
            }

            const panel = this.createWebviewPanel();
            const htmlContent = this.getHTMLContent(panel, context);

            const highlightedOpcodes = this.getHighlightedOpcodes(sbFolderPath, context);

            this.setupPanel(context, panel, htmlContent, highlightedOpcodes);
        });

        context.subscriptions.push(disposable);
    }

    private getSB4FolderPath(context: vscode.ExtensionContext): string | undefined {
        return context.globalState.get('selectedSB4FolderPath') as string;
    }

    private getHTMLContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): string {
        const htmlPath = this.getWebviewPath(context, 'index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        const cssUri = this.getWebviewUri(panel, context, 'styles.css');
        const jsUri = this.getWebviewUri(panel, context, 'script.js');

        return htmlContent
            .replace(/{{cssUri}}/g, cssUri.toString())
            .replace(/{{jsUri}}/g, jsUri.toString());
    }

    private getWebviewPath(context: vscode.ExtensionContext, fileName: string): string {
        return path.join(context.extensionPath, 'src', 'views', fileName);
    }

    private getWebviewUri(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, fileName: string): vscode.Uri {
        return panel.webview.asWebviewUri(vscode.Uri.file(this.getWebviewPath(context, fileName)));
    }

    private getHighlightedOpcodes(sbFolderPath: string, context: vscode.ExtensionContext): string {
        const functionsFilePath = path.join(
            sbFolderPath,
            'data',
            GtaVersion.getIdentifier(context),
            GtaVersion.getFunctionsFile(context)
        );
    
        const functionsList = this.readJsonFile(functionsFilePath);
        const functionsContent = this.processCommands(functionsList);
    
        return functionsContent
            .map(({ commandInfo, commandString }) => {
                const highlightedLine = this.highlightOpcodes(commandString, commandInfo);
                return `<div class="opcode-item">${highlightedLine}</div>`;
            })
            .join('');
    }

    private readJsonFile(filePath: string): any {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    }

    private getNormalizedVar(source: string): string {
        return VAR_NOTATIONS[source] || source;
    }

    private processCommands(functionsList: any): { commandInfo: CommandInfo, commandString: string }[] {
        const functionsContent: { commandInfo: CommandInfo, commandString: string }[] = [];
    
        for (const extension of functionsList.extensions) {
            for (const command of extension.commands) {
                const commandInfo: CommandInfo = {
                    id: command.id,
                    name: command.name.toLowerCase()
                };
    
                if (command.attrs && command.attrs.is_unsupported) {
                    commandInfo.isUnsupported = command.attrs.is_unsupported;
                }
    
                const commandIO = this.processCommandArgs(command.input, command.output);
                const commandString = this.formatCommandString(commandInfo, commandIO);
    
                functionsContent.push({ commandInfo, commandString });
            }
        }
    
        return functionsContent;
    }
    
    private formatCommandString(commandInfo: CommandInfo, commandIO: CommandIO): string {
        let commandString = `${commandInfo.id}: `;

        commandString += commandIO.output || '';
        commandString += `${commandInfo.name} ${commandIO.input || ''}`;

        return commandString;
    }

    private processCommandArgs(input?: CommandArgs[], output?: CommandArgs[]): CommandIO {
        const io: CommandIO = {};

        if (input) {
            io.input = input.map(this.formatInputArg).join(' ');
        }

        if (output) {
            io.output = output.map(this.formatOutputArg).join(', ').concat(' = ');
        }

        return io;
    }

    private formatInputArg(args: CommandArgs): string {
        const { name, type, source } = args;

        const namePart = name ? `{${name}}` : '';
        const typePart = type ? `[${type}]` : '';
        const sourcePart = source || '';

        return [namePart, typePart, sourcePart].filter(part => part !== '').join(' ');
    }

    private formatOutputArg = (args: CommandArgs): string => {
        const { name = '', type = '', source = '' } = args;

        const sourcePart = `${this.getNormalizedVar(source)} `;
        const namePart = name.trim() !== "" ? `{${name}}: ` : '';

        return `[${sourcePart}${namePart}${type}]`;
    };

    private highlightOpcodes(line: string, commandInfo: CommandInfo): string {
        let newLine: string = line;
    
        const isLineThrough: boolean = commandInfo.isUnsupported || false;
    
        newLine = newLine.replace(/^[0-9A-F]{4}:/g, (match: string) => {
            return `<span class="opcode-address">${match}</span>`;
        });
    
        newLine = newLine.replace(/^<span class="opcode-address">[0-9A-F]{4}:<\/span>\s*([\w_]+)/g, (match: string, name: string) => {
            return match.replace(name, `<span class="opcode-name">${name}</span>`);
        });
    
        newLine = newLine.replace(/\[([A-Za-z\s]+)\s(?:\{(\w+)\}:)?\s*([A-Za-z\s]+)\]/g, (fullMatch: string, type: string, _, variableType: string) => {
            return fullMatch
                .replace(variableType, `<span class="opcode-param-type">${variableType}</span>`)
                .replace(type, `<span class="opcode-type">${type}</span>`);
        });
    
        newLine = newLine.replace(/=\s*([\w_]+)/g, (match: string, name: string) => {
            return match.replace(name, `<span class="opcode-name">${name}</span>`);
        });
    
        newLine = newLine.replace(/(\{\w+\})/g, (match: string) => {
            return `<span class="opcode-param-name">${match}</span>`;
        });
    
        newLine = newLine.replace(/(\[\w+\])/g, (match: string) => {
            return `<span class="opcode-param-type">${match}</span>`;
        });
    
        if (isLineThrough) {
            newLine = '<s>' + newLine + '</s>';
        }
    
        return newLine;
    }

    private createWebviewPanel(): vscode.WebviewPanel {
        return vscode.window.createWebviewPanel(
            'opcodesView',
            'Opcodes',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
    }

    private setupPanel(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, htmlContent: string, highlightedOpcodes: string): void {

        const iconPath = vscode.Uri.file(context.asAbsolutePath('logo.jpg'));

        panel.webview.html = htmlContent;

        panel.iconPath = {
            light: iconPath,
            dark: iconPath
        };

        const sendOpcodesToWebview = (opcodes: string) => {
            panel.webview.postMessage({ command: 'setOpcodes', opcodes });
        };

        panel.onDidChangeViewState(e => {
            if (e.webviewPanel.visible) {
                sendOpcodesToWebview(highlightedOpcodes);
            }
        });

        sendOpcodesToWebview(highlightedOpcodes);
    }
}