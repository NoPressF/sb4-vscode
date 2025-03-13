import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Folder } from 'folder';
import { GtaVersion } from 'gta-version';

type CommandInfo = {
    id: string;
    name: string;
    // short_desc: string;
    // class: string | undefined;
    // member: string | undefined;
};

export class OpcodesSearch {
    create(context: vscode.ExtensionContext) {
        const disposable = vscode.commands.registerCommand('sb4.showOpcodesWindow', () => {
            const sbFolderPath = context.globalState.get('selectedSB4FolderPath') as string;
    
            if (sbFolderPath === undefined) {
                Folder.showSB4FolderSelectionPrompt();
                return;
            }
    
            const panel = vscode.window.createWebviewPanel(
                'opcodesView',
                'Opcodes',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
    
            const htmlPath = path.join(context.extensionPath, 'src', 'views', 'opcodes-view.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');

            panel.webview.html = htmlContent;

            const functionsFilePath = path.join(
                sbFolderPath, 
                'data', 
                GtaVersion.getIdentifier(context), 
                GtaVersion.getFunctionsFile(context)
            );

            const functionsJson = fs.readFileSync(functionsFilePath, 'utf8');
            const functionsList = JSON.parse(functionsJson);
            const functionsContent: string[] = [];

            for (const extension of functionsList.extensions) {
                for (const command of extension.commands) {
                    const commandInfo: CommandInfo = { 
                        id: command.id, 
                        name: command.name.toLowerCase()
                    };

                    functionsContent.push(`${commandInfo.id}: ${commandInfo.name}`);
                }
            }
            
            const joinedContent = functionsContent.join('\n');
            const highlightedOpcodes = joinedContent
                .split('\n')
                .map(line => this.highlightOpcodes(line))
                .map(line => `<div class="opcode-item">${line}</div>`)
                .join('');

            panel.webview.postMessage({ command: 'setOpcodes', opcodes: highlightedOpcodes });
        });
    
        context.subscriptions.push(disposable);
    }
    
    private highlightOpcodes(line: string): string {
        return line.replace(/^([0-9A-F]{4}):\s*([\w_]+)/, 
            '<span class="opcode-address">$1:</span> <span class="opcode-name">$2</span>');
    }
}