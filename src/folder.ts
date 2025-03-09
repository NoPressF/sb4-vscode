import * as vscode from 'vscode';
import * as fs from 'fs';
import { Language } from 'language';

export const Folder = {
    async showSB4FolderSelectionPrompt() {
        const action = await vscode.window.showErrorMessage('Please select the SB4 folder first.', 'Select SB4 Folder');

        if (action === 'Select SB4 Folder') {
            vscode.commands.executeCommand('sb4.selectFolder');
        }
    },

    registerCommandSelectFolder(context: vscode.ExtensionContext) {
        let disposable = vscode.commands.registerCommand('sb4.selectFolder', async () => {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select SB4 Folder'
            });

            if (folderUri && folderUri[0]) {
                const folderPath = folderUri[0].fsPath;

                if (!fs.existsSync(`${folderPath}\\sanny.exe`)) {
                    vscode.window.showErrorMessage('File sanny.exe was not found in this folder.');
                    return;
                }

                context.globalState.update('selectedSB4FolderPath', folderPath);

                Language.importPatterns(context);
                vscode.window.showInformationMessage('Path to SB4 folder was selected.');
            }
        });

        context.subscriptions.push(disposable);
    }
};