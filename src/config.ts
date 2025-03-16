import { SearchType } from 'providers/search/opcodes/types';

export const VAR_NOTATIONS: Record<string, string> = {
    'var_any': 'var',
    'var_global': 'global var',
    'var_local': 'local var'
};

export const SEARCH_TYPE: Record<string, SearchType> = {
    'Opcodes': SearchType.OPCODES,
    'Classes & members': SearchType.CLASSES
};

export const Config = Object.freeze({
    LANGUAGE_SELECTOR: { language: 'sb', scheme: 'file' },
    SANNY_EXE: 'sanny.exe'
});