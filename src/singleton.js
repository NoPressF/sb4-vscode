"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Singleton = void 0;
class Singleton {
    static instances = new Map();
    static getInstance() {
        const className = this.name;
        if (!Singleton.instances.has(className)) {
            Singleton.instances.set(className, new this());
        }
        return Singleton.instances.get(className);
    }
}
exports.Singleton = Singleton;
//# sourceMappingURL=singleton.js.map