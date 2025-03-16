import * as vscode from 'vscode';
import { StorageDataManager } from 'managers/storage-data-manager';
import { FolderManager } from 'managers/folder-manager';
import { LanguageManager } from 'managers/language-manager';
import { CompileCommand } from 'compiler-tools/compile-command';
import { DecompileCommand } from 'compiler-tools/decompile-command';
import { registerSearchProviders } from 'providers/search/search';
import { RegisterEnumProviders } from 'providers/analyze/enum/enum';
import { GtaVersionButton } from 'components/gta-version-button.component';

export function activate(context: vscode.ExtensionContext) {
    const storageDataManager = StorageDataManager.getInstance();
    const folderManager = FolderManager.getInstance();
    const languageManager = LanguageManager.getInstance();
    const gtaVersionButton = GtaVersionButton.getInstance();
    const compileCommand = CompileCommand.getInstance();
    const decompileCommand = DecompileCommand.getInstance();
    
    storageDataManager.init(context);
    folderManager.init(context);
    gtaVersionButton.init(context);
    languageManager.init(context);
    compileCommand.init(context);
    decompileCommand.init(context);
    
    registerSearchProviders(context);
    RegisterEnumProviders.register(context);
}

export function deactivate() { }