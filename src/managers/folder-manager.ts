import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Singleton } from 'singleton';
import { LanguageManager } from './language-manager';
import { StorageDataManager, StorageKey } from './storage-data-manager';
import { Config } from 'config';

export class FolderManager extends Singleton {
    private context!: vscode.ExtensionContext;
    private languageManager: LanguageManager = LanguageManager.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerFolderCommand();
    }

    async handleFolderSelection() {
        const action = await vscode.window.showErrorMessage(
            'Please select the SB4 folder first.', 
            'Select SB4 Folder'
        );

        if (action === 'Select SB4 Folder') {
            await vscode.commands.executeCommand('sb4.selectFolder');
        }
    }

    private registerFolderCommand(): void {
        const disposable = vscode.commands.registerCommand(
            'sb4.selectFolder', 
            async () => this.selectFolderHandler()
        );

        this.context.subscriptions.push(disposable);
    }

    private async selectFolderHandler(): Promise<void> {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select SB4 Folder'
        });

        if (!folderUri?.[0]) {
            return;
        }

        const folderPath = folderUri[0].fsPath;
        if (!this.validateSbFolder(folderPath)) {
            return;
        }

        await this.storageDataManager.updateStorageData(StorageKey.Sb4FolderPath, folderPath);
        await this.languageManager.importPatterns();
        await vscode.window.showInformationMessage('Path to SB4 folder was selected.');
    }

    private validateSbFolder(folderPath: string): boolean {
        const exePath = path.join(folderPath, Config.SANNY_EXE);
        if (!fs.existsSync(exePath)) {
            vscode.window.showErrorMessage(`${Config.SANNY_EXE} was not found in this folder.`);
            return false;
        }
        return true;
    }
}