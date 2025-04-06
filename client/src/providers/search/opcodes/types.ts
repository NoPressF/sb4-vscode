export enum SearchType {
    OPCODES,
    CLASSES
};

export enum MessageCommand {
    UPDATE_SEARCH_TYPE
};

export interface CommandArgs {
    name?: string;
    type?: string;
    source?: string;
}

export interface CommandIO {
    input?: string;
    output?: string;
};

export interface CommandInfo {
    id?: string;
    name?: string;
    class?: string;
    member?: string;
    isUnsupported?: boolean;
};