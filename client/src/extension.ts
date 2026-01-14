import * as vscode from 'vscode';
import { GtaVersionManager, StorageDataManager } from '@shared';
import { FolderManager } from './managers/folder-manager';
import { LanguageManager } from './managers/language-manager';
import { CompileCommand } from './compiler-tools/compile-command';
import { DecompileCommand } from './compiler-tools/decompile-command';
import { registerSearchProviders } from './providers/search/search';
import { GtaVersionButton } from './components/gta-version-button.component';
import { clientActivate, clientDeactivate } from './client';

export async function activate(context: vscode.ExtensionContext) {
    const storageDataManager = StorageDataManager.getInstance();
    const gtaVersionManager = GtaVersionManager.getInstance();
    const folderManager = FolderManager.getInstance();
    const languageManager = LanguageManager.getInstance();
    const gtaVersionButton = GtaVersionButton.getInstance();
    const compileCommand = CompileCommand.getInstance();
    const decompileCommand = DecompileCommand.getInstance();

    storageDataManager.init(context);
    await gtaVersionManager.init();
    folderManager.init(context);
    gtaVersionButton.init(context);
    languageManager.init(context);
    compileCommand.init(context);
    decompileCommand.init(context);

    registerSearchProviders(context);

    clientActivate(context);
}

export function deactivate() {
    clientDeactivate();
}