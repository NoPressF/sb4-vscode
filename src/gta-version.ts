import * as vscode from 'vscode';

interface GtaVersion {
    label: string;
    description: string;
    identifier: string;
    functionsFile: string;
}

export const GTA_VERSIONS: GtaVersion[] = [
    { label: 'GTA III', description: 'Grand Theft Auto III', identifier: 'gta3_sbl', functionsFile: 'gta3.json' },
    { label: 'GTA VC', description: 'Grand Theft Auto Vice City', identifier: 'vc_sbl', functionsFile: 'vc.json' },
    { label: 'GTA SA', description: 'Grand Theft Auto San Andreas', identifier: 'sa_sbl', functionsFile: 'sa.json'}
];

export const GtaVersion = {
    getIdentifier(context: vscode.ExtensionContext): string {
        const gtaVersion = context.globalState.get('selectedGtaVersion');
        const gtaIdentifier = GTA_VERSIONS.find(version => version.label === gtaVersion)?.identifier as string;
        return gtaIdentifier;
    },

    getFunctionsFile(context: vscode.ExtensionContext) {
        const gtaVersion = context.globalState.get('selectedGtaVersion');
        const gtaFunctionsFile = GTA_VERSIONS.find(version => version.label === gtaVersion)?.functionsFile as string;
        return gtaFunctionsFile;
    }
};