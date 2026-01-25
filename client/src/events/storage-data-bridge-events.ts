import { StorageGetMethod, StorageGetParams, StorageKey, StorageSetMethod, StorageSetParams } from '@shared';
import { LanguageClient } from 'vscode-languageclient/node';
import { StorageDataManager } from '../managers/storage-data-manager';

export class StorageDataBridgeEvents {
	private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

	constructor(private client: LanguageClient) {
		this.connect();
	}

	private connect() {
		this.client.onRequest(StorageGetMethod, async (params: StorageGetParams) => {
			return this.storageDataManager.get(params.key as StorageKey);
		});

		this.client.onRequest(StorageSetMethod, async (params: StorageSetParams) => {
			await this.storageDataManager.set(params.key as StorageKey, params.value);
		});
	}
}