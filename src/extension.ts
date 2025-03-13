import * as vscode from 'vscode';
import { Language } from 'language';
import { Folder } from './folder';
import { CompileScript } from './compile-script';
import { ButtonGTAVersion } from 'button-gta-version';
import { RegisterSearchProviders } from 'providers/search/search';
import { RegisterEnumProviders } from 'providers/enum/enum';

export function activate(context: vscode.ExtensionContext) {
    Language.importPatterns(context);
    Language.applyColors(context);
    ButtonGTAVersion.createButtonSelectGtaVersion(context);
    CompileScript.registerCommandCompileScript(context);
    Folder.registerCommandSelectFolder(context);
    RegisterSearchProviders.register(context);
    RegisterEnumProviders.register(context);
}

export function deactivate() {}