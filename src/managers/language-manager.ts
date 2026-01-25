import { CONFIG, DETECT_LANG_FILE_PATTERNS, Singleton, readJsonFile } from '@utils';
import * as path from 'path';
import * as vscode from 'vscode';
import { TextDocument } from 'vscode';

export class LanguageManager extends Singleton {
    private readonly SYNTAX_FOLDER = 'syntax';
    private context!: vscode.ExtensionContext;

    public init(context: vscode.ExtensionContext) {
        this.context = context;

        this.applyColors();
        this.detectFileLanguage();
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

    private detectFileLanguage() {
        const detect = function (doc: TextDocument) {
            if (doc.languageId !== 'plaintext' && doc.languageId !== 'unknown') {
                return;
            }

            const text = doc.getText();

            for (const regex of DETECT_LANG_FILE_PATTERNS) {
                if (!regex.test(text)) {
                    continue;
                }

                vscode.languages.setTextDocumentLanguage(doc, CONFIG.LANGUAGE_SELECTOR.language);
                break;
            };

        };

        vscode.workspace.onDidOpenTextDocument(doc => detect(doc));
        vscode.workspace.onDidChangeTextDocument(e => detect(e.document));

        vscode.workspace.textDocuments.forEach(doc => detect(doc));
    }
}