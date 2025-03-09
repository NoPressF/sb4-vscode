import * as vscode from 'vscode';

export const GTA_MODE: vscode.DocumentFilter = { language: 'SB', scheme: 'file' };

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