import * as vscode from 'vscode';
import { Language } from 'language';
import { Folder } from './folder';
import { CompileScript } from './compile-script';
import { ButtonGTAVersion } from 'button-gta-version';
import { RegisterSearchProviders, Search } from 'search/search';

export function activate(context: vscode.ExtensionContext) {
    Language.importPatterns(context);
    Language.applyColors(context);
    ButtonGTAVersion.createButtonSelectGtaVersion(context);
    CompileScript.registerCommandCompileScript(context);
    Folder.registerCommandSelectFolder(context);
    RegisterSearchProviders.register(context);
}

export function deactivate() {}