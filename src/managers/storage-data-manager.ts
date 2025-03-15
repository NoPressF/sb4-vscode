import * as vscode from 'vscode';
import { Singleton } from 'singleton';

export enum StorageKey {
    GtaVersion = 'gtaVersion',
    Sb4FolderPath = 'sb4FolderPath',
}

export class StorageDataManager extends Singleton {
    private context!: vscode.ExtensionContext;

    public init(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public hasStorageDataEmpty(key: StorageKey): boolean | undefined {
        return this.getStorageData(key);
    }

    public getStorageData<T>(key: StorageKey): T | undefined {
        return this.context.globalState.get<T>(key);
    }

    public async updateStorageData<T>(key: StorageKey, value: T): Promise<void> {
        await this.context.globalState.update(key, value);
    }
}