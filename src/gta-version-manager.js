"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GtaVersionManager = void 0;
const singleton_1 = require("../singleton");
const storage_data_manager_1 = require("./storage-data-manager");
class GtaVersionManager extends singleton_1.Singleton {
    storageDataManager = storage_data_manager_1.StorageDataManager.getInstance();
    GTA_VERSIONS = [
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
    getGtaVersion() {
        return this.GTA_VERSIONS;
    }
    getVersionData() {
        const gtaVersion = this.storageDataManager.getStorageData(storage_data_manager_1.StorageKey.GtaVersion);
        if (!gtaVersion) {
            throw new Error('GTA version not found');
        }
        const versionData = this.GTA_VERSIONS.find(v => v.label === gtaVersion);
        if (!versionData) {
            throw new Error(`GTA version not found: ${gtaVersion}`);
        }
        return versionData;
    }
    getIdentifier() {
        return this.getVersionData().identifier;
    }
    getFunctionsFile() {
        return this.getVersionData().functionsFile;
    }
}
exports.GtaVersionManager = GtaVersionManager;
//# sourceMappingURL=gta-version-manager.js.map