import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FolderManager } from './folder-manager';
import { type GtaVersion } from './gta-version-manager';
import { GtaVersionManager } from './gta-version-manager';
import { Singleton } from 'singleton';
import { StorageDataManager, StorageKey } from './storage-data-manager';

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
        scopeName: "source.sb4.functions",
        name: "SB",
        patterns: [] as GrammarPattern[]
    };

    private context!: vscode.ExtensionContext;
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;

        this.importPatterns();
        this.applyColors();
    }

    public async applyColors(): Promise<void> {
        const colorsPath = path.join(this.context.extensionPath, this.SYNTAX_FOLDER, 'sb4.tm-colors.json');
        const colors = JSON.parse(fs.readFileSync(colorsPath, 'utf8'));

        if (colors?.textMateRules) {
            await vscode.workspace.getConfiguration().update(
                'editor.tokenColorCustomizations',
                colors,
                vscode.ConfigurationTarget.Global
            );
        }
    }

    public async importPatterns(): Promise<void> {
        if (!this.storageDataManager.hasStorageDataEmpty(StorageKey.Sb4FolderPath)) {
            await FolderManager.getInstance().handleFolderSelection();
            return;
        }

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
        return JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    }

    private async generatePatterns(): Promise<GrammarPattern[]> {
        const versionData = this.gtaVersionManager.getVersionData();
        const { functions, classes, methods, enums } = await this.parseGameData(versionData);

        return [
            ...this.createPatterns(functions, 'function.sb'),
            ...this.createPatterns(classes, 'class.sb'),
            ...this.createPatterns(methods, 'method.sb'),
            ...this.createPatterns(enums, 'enum.sb')
        ];
    }

    private async parseGameData(versionData: GtaVersion): Promise<{ functions: string[]; classes: string[]; methods: string[]; enums: string[]; }> {
        const sb4FolderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;
        const functionsData = this.loadFunctionNames(sb4FolderPath, versionData);
        const enumsData = this.loadEnums(sb4FolderPath, versionData);

        return {
            functions: this.extractFunctions(functionsData),
            classes: this.extractClasses(functionsData),
            methods: this.extractMethods(functionsData),
            enums: this.extractEnums(enumsData)
        };
    }

    private loadFunctionNames(sb4FolderPath: string, versionData: GtaVersion): FunctionNamesList {
        const functionsPath = path.join(
            sb4FolderPath,
            'data',
            versionData.identifier,
            versionData.functionsFile
        );
        return JSON.parse(fs.readFileSync(functionsPath, 'utf8'));
    }

    private loadEnums(sb4FolderPath: string, versionData: GtaVersion): string {
        const enumsPath = path.join(sb4FolderPath, 'data', versionData.identifier, 'enums.txt');
        return fs.readFileSync(enumsPath, 'utf8');
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