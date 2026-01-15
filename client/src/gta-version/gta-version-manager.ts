import { isFileExists, Singleton, StorageKey } from '@shared';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { StorageDataManager } from '../storage/storage-data-manager';

export interface GtaVersion {
    label: string;
    identifier: string;
    fullPath: string;
}

export class GtaVersionManager extends Singleton {

    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

    private GTA_VERSIONS: GtaVersion[] = [];

    public async init() {
        await this.parseVersions();
    }

    public async parseVersions(): Promise<GtaVersion[]> {

        try {
            this.GTA_VERSIONS = [];

            const folderPath = this.storageDataManager.get(StorageKey.Sb4FolderPath) as string;

            if (!folderPath) {
                return [];
            }

            const parser = new XMLParser({
                ignoreAttributes: false,
                textNodeName: "#text"
            });

            const folderDataPath = path.join(folderPath, 'data');
            const files = await fsp.readdir(folderDataPath);

            for (const file of files) {
                const folderGtaVersionPath = path.join(folderDataPath, file);

                if (!(await fsp.stat(folderGtaVersionPath)).isDirectory()) {
                    continue;
                }

                const modeXmlPath = path.join(folderGtaVersionPath, 'mode.xml');

                if (!await isFileExists(modeXmlPath)) {
                    continue;
                }

                const xmlContent = await fsp.readFile(modeXmlPath, 'utf-8');

                const parseData = parser.parse(xmlContent);
                const library = parseData.mode?.library;

                if (!library) {
                    continue;
                }

                const libraryPath = typeof library === 'object' ? library["#text"] : library;

                if (!libraryPath) {
                    continue;
                }

                const fullPath = (libraryPath as string).replace("@sb:", folderPath);

                const gtaVersion: GtaVersion = {
                    label: parseData.mode?.["@_title"],
                    identifier: parseData.mode?.["@_id"],
                    fullPath: fullPath
                };

                this.GTA_VERSIONS.push(gtaVersion);
            }

        } catch (err) {
            throw new Error(`Error parse the versions: ${err}`);
        }

        return this.GTA_VERSIONS;
    }

    public getVersionData(): GtaVersion | undefined {
        const gtaVersion = this.storageDataManager.get(StorageKey.GtaVersion) as string;

        return this.GTA_VERSIONS.find(v => v.label === gtaVersion);
    }

    public hasVersionDataExists(): boolean {
        return this.getVersionData() !== undefined;
    }

    public getIdentifier(): string | undefined {
        const versionData = this.getVersionData();

        if (!versionData) {
            return undefined;
        }

        return versionData.identifier;
    }

    public getFullPath(): string | undefined {
        const versionData = this.getVersionData();

        if (!versionData) {
            return undefined;
        }

        return versionData.fullPath;
    }
}