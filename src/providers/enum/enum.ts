import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { EnumCompletionProvider } from 'providers/enum/completion/completion';
import { EnumHoverProvider } from 'providers/enum/hover/hover';
import { GtaVersion } from 'gta-version';

export const LANGUAGE_SELECTOR = { language: 'sb', scheme: 'file' };

export type EnumInfo = {
    name: string;
    elements: { name: string; value: string | number }[];
};

export class Enum {
    enums = new Map<string, EnumInfo>();

    loadEnums(context: vscode.ExtensionContext) {
        const sbFolderPath = context.globalState.get('selectedSB4FolderPath') as string;
        if (!sbFolderPath) {
            return;
        }

        const enumsPath = path.join(sbFolderPath, 'data', GtaVersion.getIdentifier(context), 'enums.txt');
        const content = fs.readFileSync(enumsPath, 'utf-8');
        this.parseEnums(content);
    }

    private parseEnums(content: string) {
        const enumBlocks = [...content.matchAll(/enum\s+(\w+)(.*?)end/gs)];
        for (const block of enumBlocks) {
            const enumName = block[1];
            const lines = block[2].trim().split('\n').map(l => l.trim()).filter(Boolean);
            let currentValue = 0;
            const elements: { name: string; value: string | number }[] = [];

            for (const line of lines) {
                const [namePart, valuePart] = line.split('=').map(p => p.trim());
                let value: string | number = currentValue;

                if (valuePart) {
                    if (/^["']/.test(valuePart)) {
                        value = valuePart.slice(1, -1);
                    } else {
                        value = Number(valuePart) || valuePart;
                    }
                    currentValue = typeof value === 'number' ? value + 1 : 0;
                } else {
                    value = currentValue++;
                }
                elements.push({ name: namePart, value });
            }

            this.enums.set(enumName, { name: enumName, elements });
        }
    }
}

export const RegisterEnumProviders = {
    register(context: vscode.ExtensionContext) {
        const enumInstance = new Enum();
        const enumCompletionProvider = new EnumCompletionProvider(enumInstance, context);
        const enumHoverProvider = new EnumHoverProvider(enumInstance);

        enumCompletionProvider.registerProvider(context);
        enumHoverProvider.registerProvider(context);
    }
};