import * as path from 'path';
import * as fs from 'fs';
import { GtaVersionManager } from '@shared';
import { Singleton } from '@shared';
import { StorageDataManager, StorageKey } from '@shared';

export type EnumInfo = {
    name: string;
    elements: { name: string; value: string | number }[];
};

export class Enum extends Singleton {

    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();

    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

    private enums = new Map<string, EnumInfo>();

    public init() {
        this.loadEnums();
    }

    public getEnumElement(enumElement: string): EnumInfo {
        return this.enums.get(enumElement) as EnumInfo;
    }

    public loadEnums() {
        const folderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;
        if (!folderPath) {
            throw new Error("Couldn't find the SB4 folder");
        }

        const enumsPath = path.join(folderPath, 'data', this.gtaVersionManager.getIdentifier(), 'enums.txt');
        const content = fs.readFileSync(enumsPath, 'utf-8');

        if (!fs.existsSync(enumsPath)) {
            return;
        }

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

export const initEnum = () => {
    console.log("try init");
    Enum.getInstance().init();
};
