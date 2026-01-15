import { StorageKey } from '../types';

export const StorageGetMethod = 'sb4/storage/get' as const;
export const StorageSetMethod = 'sb4/storage/set' as const;

export interface StorageGetParams {
	key: StorageKey;
}

export type StorageGetResult<T = unknown> = T | undefined;

export interface StorageSetParams<T = unknown> {
	key: StorageKey;
	value: T;
}

export type StorageSetResult = void;
