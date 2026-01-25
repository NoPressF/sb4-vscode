import { isFileExists, Singleton, StorageKey } from '@shared';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { GtaVersionBridge } from '../../bridges/gta-version-bridge';
import { StorageDataBridge } from '../../bridges/storage-data-bridge';
import { EnumHoverProvider } from './hover';

export class EnumProvider extends Singleton {
	private gtaVersionBridge: GtaVersionBridge = GtaVersionBridge.getInstance();
	private storageDataBridge: StorageDataBridge = StorageDataBridge.getInstance();
	private enums = new Map<string, { name: string; value: string | number }[]>();

	public async init() {
		await this.load();

		EnumHoverProvider.getInstance().init();
	}

	public getElement(element: string) {
		return this.enums.get(element);
	}

	public get() {
		return this.enums;
	}

	private async load() {
		const folderPath = await this.storageDataBridge.get(StorageKey.Sb4FolderPath) as string;
		if (!folderPath) {
			return;
		}

		const indentifier = await this.gtaVersionBridge.getIdentifier();

		if (!indentifier) {
			return;
		}

		const enumsPath = path.join(folderPath, 'data', indentifier, 'enums.txt');

		if (!await isFileExists(enumsPath)) {
			return;

		}
		const content = await fsp.readFile(enumsPath, 'utf-8');

		this.parse(content);
	}

	private parse(content: string) {
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

			this.enums.set(enumName, elements);
		}
	}
}