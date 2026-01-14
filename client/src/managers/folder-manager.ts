import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Singleton } from '@shared';
import { LanguageManager } from './language-manager';
import { StorageDataManager, StorageKey } from '@shared';
import { CONFIG } from '../../../shared/src/config';

export class FolderManager extends Singleton {
    private context!: vscode.ExtensionContext;
    private languageManager: LanguageManager = LanguageManager.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerFolderCommand();

        if (!this.storageDataManager.hasStorageData(StorageKey.Sb4FolderPath)) {
            this.handleFolderSelection();
        }
    }

    async handleFolderSelection() {
        const action = await vscode.window.showErrorMessage(
            'Please select the SB4 folder first.',
            CONFIG.SELECT_FOLDER_LABEL
        );

        if (action === CONFIG.SELECT_FOLDER_LABEL) {
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
            openLabel: CONFIG.SELECT_FOLDER_LABEL
        });

        if (!folderUri?.[0]) {
            return;
        }

        const folderPath = folderUri[0].fsPath;
        if (!this.validateFolder(folderPath)) {
            return;
        }

        await this.storageDataManager.updateStorageData(StorageKey.Sb4FolderPath, folderPath);
        await this.languageManager.exportPatterns();
        await vscode.window.showInformationMessage('The path to the SB4 folder was selected.');
    }

    private validateFolder(folderPath: string): boolean {
        const exePath = path.join(folderPath, CONFIG.SANNY_EXE);
        if (!fs.existsSync(exePath)) {
            vscode.window.showErrorMessage(`${CONFIG.SANNY_EXE} was not found in this folder.`);
            return false;
        }
        return true;
    }
}