import * as vscode from 'vscode';
import { GTA_MODE, GTA_VERSIONS } from 'gta-version';

const BUTTON_ID = "sb4.openSettings";
const BUTTON_TOOLTIP = "Open SB4 Settings";
const BUTTON_TEXT_DEFAULT = "SB4";
const BUTTON_TEXT_FORMAT = (version: string) => `${BUTTON_TEXT_DEFAULT} (${version})`;

const updateButtonText = (button: vscode.StatusBarItem, selectedVersion?: string): void => {
    button.text = selectedVersion ? BUTTON_TEXT_FORMAT(selectedVersion) : BUTTON_TEXT_DEFAULT;
};

const createStatusBarButton = (context: vscode.ExtensionContext): vscode.StatusBarItem => {
    const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    button.tooltip = BUTTON_TOOLTIP;
    button.command = BUTTON_ID;
    context.subscriptions.push(button);
    return button;
};

const handleActiveEditorChange = (context: vscode.ExtensionContext, button: vscode.StatusBarItem) => {
    const updateButtonVisibility = (editor: vscode.TextEditor | undefined) => {
        if (editor && vscode.languages.match({ language: "sb" }, editor.document)) {
            button.show();
        } else {
            button.hide();
        }
    };

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateButtonVisibility));

    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(doc => {
        if (vscode.window.activeTextEditor?.document === doc) {
            updateButtonVisibility(vscode.window.activeTextEditor);
        }
    }));

    updateButtonVisibility(vscode.window.activeTextEditor);
};

const registerCommand = (context: vscode.ExtensionContext, button: vscode.StatusBarItem) => {
    let disposable = vscode.commands.registerCommand(BUTTON_ID, async () => {
        const selected = await vscode.window.showQuickPick(GTA_VERSIONS);
        if (selected) {
            context.globalState.update('selectedGtaVersion', selected.label);
            updateButtonText(button, selected.label);
        }
    });

    context.subscriptions.push(disposable);
};

export const ButtonGTAVersion = {
    createButtonSelectGtaVersion(context: vscode.ExtensionContext) {
        const selectedGtaVersion = context.globalState.get('selectedGtaVersion') as string | undefined;
        const button = createStatusBarButton(context);
        updateButtonText(button, selectedGtaVersion);
        registerCommand(context, button);
        handleActiveEditorChange(context, button);
    }
};