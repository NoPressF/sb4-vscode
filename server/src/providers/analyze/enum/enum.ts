import * as path from 'path';
import { promises as fsp } from 'fs';
import { isFileExists, Singleton, StorageKey } from '@shared';
import { StorageDataBridge } from '../../../bridges/storage-data-bridge';
import { GtaVersionBridge } from '../../../bridges/gta-version-bridge';
import { Connection, TextDocuments } from 'vscode-languageserver';
import { EnumCompletionProvider } from './completion';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { EnumHoverProvider } from './hover';

export class Enum extends Singleton {
	private gtaVersionBridge: GtaVersionBridge = GtaVersionBridge.getInstance();
	private storageDataBridge: StorageDataBridge = StorageDataBridge.getInstance();
	private enums = new Map<string, { name: string; value: string | number }[]>();
	public connection!: Connection;
	public documents!: TextDocuments<TextDocument>;

	public async init(connection: Connection, documents: TextDocuments<TextDocument>) {
		this.connection = connection;
		this.documents = documents;

		await this.loadEnums();

		EnumCompletionProvider.getInstance().init();
		EnumHoverProvider.getInstance().init();
	}

	public getEnumElement(enumElement: string) {
		return this.enums.get(enumElement);
	}

	public getEnums() {
		return this.enums;
	}

	public async loadEnums() {
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

			this.enums.set(enumName, elements);
		}
	}
}