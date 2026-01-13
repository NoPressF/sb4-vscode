import { Singleton } from '@shared';
import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { StorageDataManager, StorageKey } from './storage-data-manager';

export interface GtaVersion {
    label: string;
    identifier: string;
    fullPath: string;
}

export class GtaVersionManager extends Singleton {

    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

    private GTA_VERSIONS: GtaVersion[] = [];

    public init() {
        this.parseVersions();
    }

    public parseVersions(): GtaVersion[] {

        try {
            this.GTA_VERSIONS = [];

            const folderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;

            if (!folderPath) {
                throw new Error("Couldn't find the SB4 folder");
            }

            const folderDataPath = path.join(folderPath, 'data');
            const files = fs.readdirSync(folderDataPath);

            const parser = new XMLParser({
                ignoreAttributes: false,
                textNodeName: "#text"
            });

            for (const file of files) {
                const folderGtaVersionPath = path.join(folderDataPath, file);

                if (!fs.statSync(folderGtaVersionPath).isDirectory()) {
                    continue;
                }

                const modeXmlPath = path.join(folderGtaVersionPath, 'mode.xml');

                if (!fs.existsSync(modeXmlPath)) {
                    continue;
                }

                const xmlContent = fs.readFileSync(modeXmlPath, 'utf-8');

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
            throw new Error(`Error reading directory: ${err}`);
        }

        return this.GTA_VERSIONS;
    }

    public getVersionData(): GtaVersion {
        const gtaVersion = this.storageDataManager.getStorageData(StorageKey.GtaVersion) as string;

        if (!gtaVersion) {
            throw new Error('GTA version not found');
        }

        let versionData = this.GTA_VERSIONS.find(v => v.label === gtaVersion);

        if (!versionData) {
            versionData = this.GTA_VERSIONS[0];
        }

        return versionData;
    }

    public getIdentifier(): string {
        return this.getVersionData().identifier;
    }

    public getFullPath(): string {
        return this.getVersionData().fullPath;
    }
}