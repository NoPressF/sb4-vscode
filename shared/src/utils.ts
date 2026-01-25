import { promises as fsp } from 'fs';

export async function isFileExists(path: string): Promise<boolean> {
    try {
        await fsp.access(path);
        return true;
    } catch {
        return false;
    }
}

export async function readJsonFile(filePath: string): Promise<any> {
    return JSON.parse(await fsp.readFile(filePath, 'utf-8'));
};