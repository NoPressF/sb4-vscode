import { Singleton, StorageKey } from '@shared';
import * as vscode from 'vscode';

export class StorageDataManager extends Singleton {
    private context!: vscode.ExtensionContext;

    public init(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public has(key: StorageKey): boolean | undefined {
        return this.get(key);
    }

    public get<T>(key: StorageKey): T | undefined {
        return this.context.globalState.get<T>(key);
    }

    public async set<T>(key: StorageKey, value: T): Promise<void> {
        await this.context.globalState.update(key, value);
    }
}