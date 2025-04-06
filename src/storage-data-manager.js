"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageDataManager = exports.StorageKey = void 0;
const singleton_1 = require("../singleton");
var StorageKey;
(function (StorageKey) {
    StorageKey["GtaVersion"] = "gtaVersion";
    StorageKey["Sb4FolderPath"] = "sb4FolderPath";
})(StorageKey || (exports.StorageKey = StorageKey = {}));
class StorageDataManager extends singleton_1.Singleton {
    context;
    init(context) {
        this.context = context;
    }
    hasStorageDataEmpty(key) {
        return this.getStorageData(key);
    }
    getStorageData(key) {
        return this.context.globalState.get(key);
    }
    async updateStorageData(key, value) {
        await this.context.globalState.update(key, value);
    }
}
exports.StorageDataManager = StorageDataManager;
//# sourceMappingURL=storage-data-manager.js.map