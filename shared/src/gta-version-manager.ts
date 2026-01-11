import { Singleton } from './singleton';
import { StorageDataManager, StorageKey } from './storage-data-manager';

export interface GtaVersion {
    label: string;
    description: string;
    identifier: string;
    functionsFile: string;
}

export class GtaVersionManager extends Singleton {
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();
    
    private readonly GTA_VERSIONS: GtaVersion[] = [
        { 
            label: 'GTA III', 
            description: 'Grand Theft Auto III', 
            identifier: 'gta3_sbl', 
            functionsFile: 'gta3.json' 
        },
        { 
            label: 'GTA VC', 
            description: 'Grand Theft Auto Vice City', 
            identifier: 'vc_sbl', 
            functionsFile: 'vc.json' 
        },
        { 
            label: 'GTA SA', 
            description: 'Grand Theft Auto San Andreas', 
            identifier: 'sa_sbl', 
            functionsFile: 'sa.json' 
        }
    ];

    public getGtaVersion(): GtaVersion[] {
        return this.GTA_VERSIONS;
    }

    public getVersionData(): GtaVersion {
        const gtaVersion = this.storageDataManager.getStorageData(StorageKey.GtaVersion) as string;

        if (!gtaVersion) {
            throw new Error('GTA version not found');
        }

        const versionData = this.GTA_VERSIONS.find(v => v.label === gtaVersion);

        if (!versionData) {
            throw new Error(`GTA version not found: ${gtaVersion}`);
        }
        
        return versionData;
    }

    public getIdentifier(): string {
        return this.getVersionData().identifier;
    }

    public getFunctionsFile(): string {
        return this.getVersionData().functionsFile;
    }
}