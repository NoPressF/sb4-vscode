import { Singleton, StorageGetMethod, StorageGetParams, StorageGetResult, StorageKey, StorageSetMethod, StorageSetParams } from '@shared';
import { Connection } from 'vscode-languageserver';

export class StorageDataBridge extends Singleton {

	private connection!: Connection;

	public init(connection: Connection) {
		this.connection = connection;
	}

	async get<T>(key: StorageKey): Promise<T | undefined> {
		const result = await this.connection.sendRequest<StorageGetResult<T>>(
			StorageGetMethod,
			{ key } satisfies StorageGetParams
		);
		return result;
	}

	async set<T>(key: StorageKey, value: T): Promise<void> {
		await this.connection.sendRequest<void>(
			StorageSetMethod,
			{ key, value } satisfies StorageSetParams<T>
		);
	}

	async has(key: StorageKey): Promise<boolean> {
		const val = await this.get<unknown>(key);
		return val !== undefined;
	}

}