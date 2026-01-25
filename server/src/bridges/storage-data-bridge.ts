import { Singleton, StorageGetMethod, StorageGetParams, StorageGetResult, StorageKey, StorageSetMethod, StorageSetParams } from '@shared';
import { BaseProvider } from '../providers/base';

export class StorageDataBridge extends Singleton {
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public async get<T>(key: StorageKey): Promise<T | undefined> {
		const result = await this.baseProvider.connection.sendRequest<StorageGetResult<T>>(
			StorageGetMethod,
			{ key } satisfies StorageGetParams
		);
		return result;
	}

	public async set<T>(key: StorageKey, value: T): Promise<void> {
		await this.baseProvider.connection.sendRequest<void>(
			StorageSetMethod,
			{ key, value } satisfies StorageSetParams<T>
		);
	}

	public async has(key: StorageKey): Promise<boolean> {
		const val = await this.get<unknown>(key);
		return val !== undefined;
	}

}