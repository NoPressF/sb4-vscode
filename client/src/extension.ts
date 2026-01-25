import * as vscode from 'vscode';
import { clientActivate, clientDeactivate } from './client';
import { CompileCommand } from './compiler-tools/compile-command';
import { DecompileCommand } from './compiler-tools/decompile-command';
import { GtaVersionButton } from './components/gta-version-button.component';
import { CommandManager } from './managers/command-manager';
import { FolderManager } from './managers/folder-manager';
import { GtaVersionManager } from './managers/gta-version-manager';
import { LanguageManager } from './managers/language-manager';
import { StorageDataManager } from './managers/storage-data-manager';
import { CommandFormatterProvider } from './providers/command/command-formatter-provider';
import { registerSearchProviders } from './providers/search/search';

export async function activate(context: vscode.ExtensionContext) {
    StorageDataManager.getInstance().init(context);
    await GtaVersionManager.getInstance().init();
    await CommandManager.getInstance().init();
    CommandFormatterProvider.getInstance().init();
    FolderManager.getInstance().init(context);
    GtaVersionButton.getInstance().init(context);
    LanguageManager.getInstance().init(context);
    CompileCommand.getInstance().init(context);
    DecompileCommand.getInstance().init(context);

    registerSearchProviders(context);
    LanguageManager.getInstance().detectFileLanguage();

    await clientActivate(context);
}

export function deactivate() {
    clientDeactivate();
}