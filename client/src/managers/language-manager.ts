import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { type GtaVersion, GtaVersionManager } from '@shared';
import { Singleton } from '@shared';
import { StorageDataManager, StorageKey } from '@shared';

interface GrammarPattern {
    match: string;
    name: string;
}

interface FunctionNamesList {
    extensions: Array<{
        commands: Array<{
            name: string;
            class?: string;
            member?: string;
        }>;
    }>;
}

export class LanguageManager extends Singleton {
    private readonly SYNTAX_FOLDER = 'syntax';
    private readonly BASE_GRAMMAR = {
        scopeName: 'source.sb4.functions',
        name: 'SB',
        patterns: [] as GrammarPattern[]
    };

    private context!: vscode.ExtensionContext;
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;

        this.exportPatterns();
        this.applyColors();
    }

    public async applyColors(): Promise<void> {
        const colorsPath = path.join(this.context.extensionPath, this.SYNTAX_FOLDER, 'sb4.tm-colors.json');
        const colors = JSON.parse(fs.readFileSync(colorsPath, 'utf-8'));

        if (colors?.textMateRules) {
            await vscode.workspace.getConfiguration().update(
                'editor.tokenColorCustomizations',
                colors,
                vscode.ConfigurationTarget.Global
            );
        }
    }

    public async exportPatterns(): Promise<void> {
        const grammarPath = this.getGrammarPath();
        this.ensureGrammarFileExists(grammarPath);

        const grammar = this.loadGrammar(grammarPath);
        grammar.patterns = await this.generatePatterns();

        fs.writeFileSync(grammarPath, JSON.stringify(grammar, null, 4));
    }

    private getGrammarPath(): string {
        return path.join(
            this.context.extensionPath,
            this.SYNTAX_FOLDER,
            'sb4.tm-language-functions.json'
        );
    }

    private ensureGrammarFileExists(grammarPath: string): void {
        if (fs.existsSync(grammarPath)) {
            return;
        }

        fs.writeFileSync(grammarPath, JSON.stringify(this.BASE_GRAMMAR, null, 4));
    }

    private loadGrammar(grammarPath: string): typeof this.BASE_GRAMMAR {
        return JSON.parse(fs.readFileSync(grammarPath, 'utf-8'));
    }

    private async generatePatterns(): Promise<GrammarPattern[]> {
        const { functions, classes, methods, enums } = await this.parseData();

        return [
            ...this.createPatterns(functions, 'function.sb'),
            ...this.createPatterns(classes, 'class.sb'),
            ...this.createPatterns(methods, 'method.sb'),
            ...this.createPatterns(enums, 'enum.sb')
        ];
    }

    private async parseData(): Promise<{ functions: string[]; classes: string[]; methods: string[]; enums: string[]; }> {
        const functionsData = this.loadFunctionNames();
        const enumsData = this.loadEnums();

        return {
            functions: this.extractFunctions(functionsData),
            classes: this.extractClasses(functionsData),
            methods: this.extractMethods(functionsData),
            enums: this.extractEnums(enumsData)
        };
    }

    private loadFunctionNames(): FunctionNamesList {
        return JSON.parse(fs.readFileSync(this.gtaVersionManager.getFullPath(), 'utf-8'));
    }

    private loadEnums(): string {
        const folderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;
        const enumsPath = path.join(folderPath, 'data', this.gtaVersionManager.getIdentifier(), 'enums.txt');

        if (!fs.existsSync(enumsPath)) {
            return "";
        }

        return fs.readFileSync(enumsPath, 'utf-8');
    }

    private extractFunctions(data: FunctionNamesList): string[] {
        return data.extensions
            .flatMap(ext => ext.commands)
            .filter(cmd => !cmd.class && !cmd.member)
            .map(cmd => cmd.name.toLowerCase());
    }

    private extractClasses(data: FunctionNamesList): string[] {
        return [...new Set(
            data.extensions
                .flatMap(ext => ext.commands)
                .filter(cmd => cmd.class)
                .map(cmd => cmd.class as string)
        )];
    }

    private extractMethods(data: FunctionNamesList): string[] {
        return [...new Set(
            data.extensions
                .flatMap(ext => ext.commands)
                .filter(cmd => cmd.member)
                .map(cmd => cmd.member as string)
        )];
    }

    private extractEnums(enumsData: string): string[] {
        return [...enumsData.matchAll(/(?<=enum\s)(\w+)/g)]
            .map(match => match[1]);
    }

    private createPatterns(items: string[], name: string): GrammarPattern[] {
        return items.length > 0
            ? [{ match: `\\b(${items.join('|')})\\b`, name }]
            : [];
    }
}