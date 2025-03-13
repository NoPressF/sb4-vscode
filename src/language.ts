import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Folder } from './folder';
import { GTA_VERSIONS } from 'gta-version';

export const Language = {
    async applyColors(context: vscode.ExtensionContext): Promise<void> {
        const colorsPath = path.join(context.extensionPath, 'syntaxes', 'sb4.tm-colors.json');

        const colorData = fs.readFileSync(colorsPath, 'utf8');
        const colors = JSON.parse(colorData);

        if (!colors || !colors.textMateRules) {
            return;
        }

        const config = vscode.workspace.getConfiguration();
        await config.update('editor.tokenColorCustomizations', colors, vscode.ConfigurationTarget.Global);
    },

    async importPatterns(context: vscode.ExtensionContext) {
        const grammarPath = path.join(context.extensionPath, 'syntaxes', 'sb4.tm-language-functions.json');

        if (!fs.existsSync(grammarPath)) {
            const baseStructure = {
                scopeName: "source.sb4.functions",
                name: "SB",
                patterns: []
            };

            fs.writeFileSync(grammarPath, JSON.stringify(baseStructure, null, 4), 'utf8');
        }

        const grammarData = fs.readFileSync(grammarPath, 'utf8');
        const grammarJson = JSON.parse(grammarData);

        const sbFolderPath = context.globalState.get('selectedSB4FolderPath') as string;

        if (sbFolderPath === undefined) {
            Folder.showSB4FolderSelectionPrompt();
            return;
        }

        grammarJson.patterns = [];

        let selectedGtaVersion = context.globalState.get('selectedGtaVersion') || 'GTA SA';

        if (!context.globalState.get('selectedGtaVersion')) {
            context.globalState.update('selectedGtaVersion', selectedGtaVersion);
        }

        const gtaVersionData = GTA_VERSIONS.find(version => version.label === selectedGtaVersion);

        if (!gtaVersionData) {
            throw new Error(`GTA version data not found for: ${selectedGtaVersion}`);
        }

        const functionNamesFilePath = path.join(
            sbFolderPath,
            'data',
            gtaVersionData.identifier,
            gtaVersionData.functionsFile
        );

        const functionNamesJson = fs.readFileSync(functionNamesFilePath, 'utf8');
        const functionNamesList = JSON.parse(functionNamesJson);

        const enumsFilePath = path.join(
            sbFolderPath,
            'data',
            gtaVersionData.identifier,
            'enums.txt'
        );

        const enumNames = fs.readFileSync(enumsFilePath, 'utf8');
        const enumRegex = /(?<=enum\s)(\w+)/g;

        const functions = [];
        const classes = [];
        const methods = [];
        const enums = [...enumNames.matchAll(enumRegex)].map(match => match[1]);

        for (const extension of functionNamesList.extensions) {
            for (const command of extension.commands) {
                const commandClass = command.class;
                const commandMember = command.member;

                if (commandClass === undefined && commandMember === undefined) {
                    functions.push(command.name.toLowerCase());
                    continue;
                }

                if (commandClass !== undefined && commandMember !== undefined) {
                    classes.push(commandClass);
                    methods.push(commandMember);
                }
            }
        }

        if (functions.length > 0) {
            const functionPattern = {
                match: `(?i)\\b(${functions.join('|')})\\b`,
                name: 'function.sb'
            };
            grammarJson.patterns.push(functionPattern);
        }

        if (classes.length > 0) {
            const classPattern = {
                match: `\\b(${classes.join('|')})\\b`,
                name: 'class.sb'
            };
            grammarJson.patterns.push(classPattern);
        }

        if (methods.length > 0) {
            const methodPattern = {
                match: `\\b(${methods.join('|')})\\b`,
                name: 'method.sb'
            };
            grammarJson.patterns.push(methodPattern);
        }

        if (enums.length > 0) {
            const enumPattern = {
                match: `\\b(${enums.join('|')})\\b`,
                name: 'enum.sb'
            };
            grammarJson.patterns.push(enumPattern);
        }

        fs.writeFileSync(grammarPath, JSON.stringify(grammarJson, null, 4), 'utf8');
    }
};