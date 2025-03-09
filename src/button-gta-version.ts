import * as vscode from 'vscode';

interface GtaVersion {
    label: string;
    description: string;
}

const GTA_VERSIONS: GtaVersion[] = [
    { label: "GTA III", description: "Grand Theft Auto III" },
    { label: "GTA VC", description: "Grand Theft Auto Vice City" },
    { label: "GTA SA", description: "Grand Theft Auto San Andreas" }
];

const BUTTON_ID = "sb4.openSettings";
const BUTTON_TOOLTIP = "Open SB4 Settings";
const BUTTON_TEXT_DEFAULT = "$(gear) SB4";
const BUTTON_TEXT_FORMAT = (version: string) => `$(gear) SB4 (${version})`;

const updateButtonText = (button: vscode.StatusBarItem, selectedVersion?: string): void => {
    button.text = selectedVersion ? BUTTON_TEXT_FORMAT(selectedVersion) : BUTTON_TEXT_DEFAULT;
};

const createStatusBarButton = (): vscode.StatusBarItem => {
    const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    button.tooltip = BUTTON_TOOLTIP;
    button.command = BUTTON_ID;
    return button;
};

const registerCommand = (context: vscode.ExtensionContext, button: vscode.StatusBarItem): vscode.Disposable => {
    return vscode.commands.registerCommand(BUTTON_ID, async () => {
        const selected = await vscode.window.showQuickPick(GTA_VERSIONS);
        if (selected) {
            context.globalState.update('selectedGtaVersion', selected.label);
            updateButtonText(button, selected.label);
        }
    });
};

export const ButtonGTAVersion = {
    createButtonSelectGtaVersion(context: vscode.ExtensionContext) {
        const selectedGtaVersion = context.globalState.get('selectedGtaVersion') as string | undefined;
        const button = createStatusBarButton();
    
        updateButtonText(button, selectedGtaVersion);
        button.show();
    
        const disposable = registerCommand(context, button);
        context.subscriptions.push(button, disposable);
    }
};