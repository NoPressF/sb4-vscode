export abstract class Singleton {

    private static instances = new WeakMap<Function, any>();

    public static getInstance<T>(this: new () => T): T {
        let inst = Singleton.instances.get(this);
        if (!inst) {
            inst = new this();
            Singleton.instances.set(this, inst);
        }
        return inst as T;
    }

}