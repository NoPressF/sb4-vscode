import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('sb4.selectFolder', async () => {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select SB4 Folder'
        });

        if (folderUri && folderUri[0]) {
            const folderPath = folderUri[0].fsPath;

            context.globalState.update('selectedFolderPath', folderPath);

            vscode.window.showInformationMessage(`Path to SB4 folder was successfully selected.`);
        }
    });

    context.subscriptions.push(disposable);

    const savedFolderPath = context.globalState.get('selectedFolderPath');
    if (savedFolderPath) {
        vscode.window.showInformationMessage(`Previously selected folder: ${savedFolderPath}`);
    }
}

export function deactivate() {}