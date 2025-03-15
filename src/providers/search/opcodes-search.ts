import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FolderManager } from 'managers/folder-manager';
import { GtaVersionManager } from 'managers/gta-version-manager';
import { Singleton } from 'singleton';
import { StorageDataManager, StorageKey } from 'managers/storage-data-manager';

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
    id?: string;
    name?: string;
    class?: string;
    member?: string;
    isUnsupported?: boolean;
};

enum SearchType {
    OPCODES,
    CLASSES_AND_MEMBERS
};

const VAR_NOTATIONS: Record<string, string> = {
    'var_any': 'var',
    'var_global': 'global var',
    'var_local': 'local var'
};

const SEARCH_TYPE: Record<string, SearchType> = {
    'Opcodes': SearchType.OPCODES,
    'Classes & members': SearchType.CLASSES_AND_MEMBERS
};

export class OpcodesSearch extends Singleton {

    private searchType: SearchType = SearchType.OPCODES;
    private context!: vscode.ExtensionContext;
    private folderManager: FolderManager = FolderManager.getInstance();
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;
        this.create();
    }

    private create() {
        const disposable = vscode.commands.registerCommand('sb4.searchOpcodes', () => {
            if (!this.storageDataManager.hasStorageDataEmpty(StorageKey.Sb4FolderPath)) {
                this.folderManager.handleFolderSelection();
                return;
            }

            const panel = this.createWebviewPanel();
            const htmlContent = this.getHTMLContent(panel);

            this.setupPanel(panel, htmlContent);
        });

        this.context.subscriptions.push(disposable);
    }

    private getHTMLContent(panel: vscode.WebviewPanel): string {
        const htmlPath = this.getWebviewPath('index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        const cssUri = this.getWebviewUri(panel, 'styles.css');
        const jsUri = this.getWebviewUri(panel, 'script.js');

        return htmlContent
            .replace(/{{cssUri}}/g, cssUri.toString())
            .replace(/{{jsUri}}/g, jsUri.toString());
    }

    private getWebviewPath(fileName: string): string {
        return path.join(this.context.extensionPath, 'src', 'views', fileName);
    }

    private getWebviewUri(panel: vscode.WebviewPanel, fileName: string): vscode.Uri {
        return panel.webview.asWebviewUri(this.getFileUri(this.getWebviewPath(fileName)));
    }

    private getFileUri(path: string): vscode.Uri {
        return vscode.Uri.file(path);
    }

    private getOpcodesContent(): string {
        const sb4FolderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;
        const functionsFilePath = path.join(
            sb4FolderPath,
            'data',
            this.gtaVersionManager.getIdentifier(),
            this.gtaVersionManager.getFunctionsFile()
        );

        const functionsList = this.readJsonFile(functionsFilePath);
        const functionsContent = this.processCommands(functionsList);

        return functionsContent
            .map(({ commandInfo, commandString }) => {
                const highlightedLine = this.getHighlightOpcode(commandString, commandInfo);
                return `<div class="opcode-item">${highlightedLine}</div>`;
            })
            .join('');
    }

    private readJsonFile = (filePath: string): any => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    };

    private getNormalizedVar(source: string): string {
        return VAR_NOTATIONS[source] || source;
    }

    private getNormalizedSearchType(source: string): SearchType {
        return SEARCH_TYPE[source];
    }

    private processCommands(functionsList: any): { commandInfo: CommandInfo, commandString: string }[] {
        const functionsContent: { commandInfo: CommandInfo, commandString: string }[] = [];

        for (const extension of functionsList.extensions) {
            for (const command of extension.commands) {

                let commandInfo: CommandInfo = {};

                if (this.searchType === SearchType.OPCODES) {
                    commandInfo = {
                        id: command.id,
                        name: command.name.toLowerCase()
                    };
                }
                else {
                    if (!command.class && !command.member) {
                        continue;
                    }

                    commandInfo = {
                        class: command.class,
                        member: command.member
                    };
                }

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
        let commandString = '';
        let space = ' ';

        if (this.searchType === SearchType.OPCODES) {
            commandString = `${commandInfo.id}: `;
        }

        commandString += commandIO.output || '';

        if (this.searchType === SearchType.OPCODES) {
            commandString += `${commandInfo.name}`;
        }
        else {
            commandString += `${commandInfo.class}.${commandInfo.member}`;
            space = '';
        }

        commandString += `${space}${commandIO.input || ''}`;

        return commandString;
    }

    private processCommandArgs(input?: CommandArgs[], output?: CommandArgs[]): CommandIO {
        const io: CommandIO = {};
        const inputSeparator = this.searchType === SearchType.OPCODES ? ' ' : ', ';

        if (input) {
            const inputMap = input.map(this.formatInputArg).join(inputSeparator);

            if (this.searchType === SearchType.OPCODES) {
                io.input = inputMap;
            }
            else {
                io.input = `(${inputMap})`;
            }
        } else {
            if (this.searchType === SearchType.CLASSES_AND_MEMBERS) {
                io.input = '()';
            }
        }

        if (output) {
            io.output = output.map(this.formatOutputArg).join(', ').concat(' = ');
        }

        return io;
    }

    private formatInputArg = (args: CommandArgs): string => {
        let { name, type, source } = args;

        if (this.searchType === SearchType.OPCODES) {
            name = name ? `{${name}}` : '';
            type = type ? `[${type}]` : '';
            source = source || '';

            return [name, type, source].join(' ');
        }
        else {
            name = `${name}`;

            return name;
        }
    };

    private formatOutputArg = (args: CommandArgs): string => {
        let { name = '', type = '', source = '' } = args;

        if (this.searchType === SearchType.OPCODES) {
            name = name.trim() !== '' ? `{${name}}: ` : '';
            source = `${this.getNormalizedVar(source)} `;
            return `[${source}${name}${type}]`;
        }
        else {
            name = name.trim() !== '' ? `${name}` : '';
            type = type ? `[${type}]` : '';
            return [name, type].join(' ');
        }
    };

    private getHighlightOpcode(line: string, commandInfo: CommandInfo): string {
        let newLine: string = line;

        const isLineThrough: boolean = commandInfo.isUnsupported || false;

        if (this.searchType === SearchType.OPCODES) {
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
        }
        else {
            newLine = newLine.replace(/(?<=\b)[\w]+(?=\.)/g, (match: string) => {
                return `<span class="opcode-class">${match}</span>`;
            });

            newLine = newLine.replace(/(?<=\.)[\w]+/g, (match: string) => {
                return `<span class="opcode-member">${match}</span>`;
            });

            newLine = newLine.replace(/\b\w+\b(?=\s*\[)/g, (match: string) => {
                return `<span class="opcode-param-name">${match}</span>`;
            });

            newLine = newLine.replace(/\[\w+\]/g, (match: string) => {
                return `<span class="opcode-return-type">${match}</span>`;
            });

            newLine = newLine.replace(/\(([^)]+)\)/g, (_, inside) => {
                return `(${inside.replace(/\b\w+\b/g, (match: string) => {
                    return `<span class="opcode-params">${match}</span>`;
                })})`;
            });
        }

        if (isLineThrough) {
            newLine = '<s>' + newLine + '</s>';
        }

        return newLine;
    }

    private createWebviewPanel(): vscode.WebviewPanel {
        return vscode.window.createWebviewPanel(
            'Search Opcodes View',
            'Search Opcodes',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this.getFileUri(path.join(this.context.extensionPath, 'src', 'views'))]
            }
        );
    }

    private setupPanel(panel: vscode.WebviewPanel, htmlContent: string): void {

        const iconPath = this.getFileUri(this.context.asAbsolutePath('images/logo.jpg'));

        panel.webview.html = htmlContent;

        panel.iconPath = {
            light: iconPath,
            dark: iconPath
        };

        const updateOpcodesToWebview = () => {
            const content = this.getOpcodesContent();
            panel.webview.postMessage({ command: 'updateOpcodes', content });
        };

        panel.onDidChangeViewState(e => {
            if (e.webviewPanel.visible) {
                updateOpcodesToWebview();
            }
        });

        panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'updateSearchType':
                    this.searchType = this.getNormalizedSearchType(message.type);
                    updateOpcodesToWebview();
                    break;
            }
        });

        updateOpcodesToWebview();
    }
}