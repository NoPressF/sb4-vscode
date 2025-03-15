export abstract class Singleton {
    private static instances: Map<string, Singleton> = new Map();

    public static getInstance<T extends Singleton>(this: new () => T): T {
        const className = this.name;
        if (!Singleton.instances.has(className)) {
            Singleton.instances.set(className, new this());
        }
        return Singleton.instances.get(className) as T;
    }
}