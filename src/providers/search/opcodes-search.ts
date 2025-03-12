import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Folder } from 'folder';
import { GtaVersion } from 'gta-version';

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

            const opcodesPath = path.join(sbFolderPath, 'data', GtaVersion.getIdentifier(context), 'opcodes.txt');
            const opcodesContent = fs.readFileSync(opcodesPath, 'utf8');
            const highlightedOpcodes = opcodesContent
                .split('\n')
                .map(line => this.highlightOpcodes(line))
                .map(line => `<div class="opcode-item">${line}</div>`)
                .join('');

            panel.webview.postMessage({ command: 'setOpcodes', opcodes: highlightedOpcodes });
        });
    
        context.subscriptions.push(disposable);
    }
    
    highlightOpcodes(line: string): string {
        return line
            .replace(/\{[0-9A-F]{4}:\}/g, '<span class="opcode-address">$&</span>')
            .replace(/ [a-zA-Z_]+(?= )/g, '<span class="opcode-name">$&</span>')
            .replace(/\[[^\]]+\]/g, '<span class="opcode-bracket">$&</span>')
            .replace(/\{[^}]+\}/g, '<span class="opcode-curly">$&</span>');
    }
}