import * as vscode from 'vscode';
import { GtaVersionManager } from '../managers/gta-version-manager';
import { StorageDataManager, StorageKey } from 'managers/storage-data-manager';
import { Singleton } from 'singleton';
import { LanguageManager } from 'managers/language-manager';

export class GtaVersionButton extends Singleton {
    private static readonly BUTTON_ID = "sb4.openSettings";
    private static readonly BUTTON_TOOLTIP = "Open SB4 Settings";
    private static readonly BUTTON_TEXT_DEFAULT = "SB4";
    private static readonly BUTTON_TEXT_FORMAT = (version: string) =>
        `${GtaVersionButton.BUTTON_TEXT_DEFAULT} (${version})`;

    private context!: vscode.ExtensionContext;
    private button!: vscode.StatusBarItem;
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();
    private languageManager: LanguageManager = LanguageManager.getInstance();

    public init(context: vscode.ExtensionContext) {
        const selectedVersion = this.storageDataManager.getStorageData(StorageKey.GtaVersion) as string;

        this.context = context;
        this.button = this.createStatusBarItem();

        this.updateButtonText(selectedVersion);
        this.registerCommand();
        this.setupEditorChangeHandler();
    }

    private createStatusBarItem(): vscode.StatusBarItem {
        const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        button.tooltip = GtaVersionButton.BUTTON_TOOLTIP;
        button.command = GtaVersionButton.BUTTON_ID;
        this.context.subscriptions.push(button);
        return button;
    }

    private updateButtonText(version: string): void {
        this.button.text = version
            ? GtaVersionButton.BUTTON_TEXT_FORMAT(version)
            : GtaVersionButton.BUTTON_TEXT_DEFAULT;
    }

    private registerCommand(): void {
        const disposable = vscode.commands.registerCommand(
            GtaVersionButton.BUTTON_ID,
            async () => this.handleVersionSelection()
        );
        
        this.context.subscriptions.push(disposable);
    }

    private async handleVersionSelection(): Promise<void> {
        const selected = await vscode.window.showQuickPick(this.gtaVersionManager.getGtaVersion());
        if (!selected) {
            return;
        }

        const gtaVersion = this.storageDataManager.getStorageData(StorageKey.GtaVersion) as string;

        if (selected.label === gtaVersion) {
            return;
        }

        await this.storageDataManager.updateStorageData(StorageKey.GtaVersion, selected.label);
        await this.languageManager.importPatterns();
        await this.updateButtonText(selected.label);
    }

    private setupEditorChangeHandler(): void {
        const updateVisibility = (editor: vscode.TextEditor | undefined) => {
            const isSbFile = editor?.document && vscode.languages.match({ language: "sb" }, editor.document);
            this.button[isSbFile ? 'show' : 'hide']();
        };

        this.context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(updateVisibility),
            vscode.workspace.onDidOpenTextDocument(doc => {
                if (vscode.window.activeTextEditor?.document === doc) {
                    updateVisibility(vscode.window.activeTextEditor);
                }
            })
        );

        updateVisibility(vscode.window.activeTextEditor);
    }
}