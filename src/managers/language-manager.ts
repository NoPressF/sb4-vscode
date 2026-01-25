import { CONFIG, DETECT_LANG_FILE_PATTERN, DETECT_LANG_MAIN_FILE_PATTERN, Singleton, readJsonFile } from '@utils';
import * as path from 'path';
import * as vscode from 'vscode';
import { TextDocument } from 'vscode';

export class LanguageManager extends Singleton {
    private readonly SYNTAX_FOLDER = 'syntax';
    private context!: vscode.ExtensionContext;

    public init(context: vscode.ExtensionContext) {
        this.context = context;

        this.applyColors();
    }

    private async applyColors() {
        const colorsPath = path.join(this.context.extensionPath, this.SYNTAX_FOLDER, 'sb4.tm-colors.json');
        const colors = await readJsonFile(colorsPath);

        if (colors?.textMateRules) {
            await vscode.workspace.getConfiguration().update(
                'editor.tokenColorCustomizations',
                colors,
                vscode.ConfigurationTarget.Global
            );
        }
    }

    public detectFileLanguage() {
        const detect = function (doc: TextDocument) {
            if (doc.languageId !== 'plaintext' && doc.languageId !== 'unknown') {
                return;
            }

            const text = doc.getText();

            const regexList: RegExp[] = [DETECT_LANG_FILE_PATTERN, DETECT_LANG_MAIN_FILE_PATTERN];

            for (const regex of regexList) {
                if (!regex.test(text)) {
                    return;
                }

                vscode.languages.setTextDocumentLanguage(doc, CONFIG.LANGUAGE_SELECTOR.language);
            };

            vscode.workspace.onDidOpenTextDocument(doc => detect(doc));
            vscode.workspace.onDidChangeTextDocument(e => detect(e.document));

            vscode.workspace.textDocuments.forEach(doc => detect(doc));
        };
    }
}