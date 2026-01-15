import * as vscode from 'vscode';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { Singleton, StorageKey, isFileExists } from '@shared';
import { GtaVersionButton } from '../components/gta-version-button.component';
import { StorageDataManager } from '../storage/storage-data-manager';
import { GtaVersionManager } from '../gta-version/gta-version-manager';

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
    // TODO: Refactor parse data
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

    public async applyColors() {
        const colorsPath = path.join(this.context.extensionPath, this.SYNTAX_FOLDER, 'sb4.tm-colors.json');
        const colors = JSON.parse(await fsp.readFile(colorsPath, 'utf-8'));

        if (colors?.textMateRules) {
            await vscode.workspace.getConfiguration().update(
                'editor.tokenColorCustomizations',
                colors,
                vscode.ConfigurationTarget.Global
            );
        }
    }

    public async exportPatterns() {
        if (!this.gtaVersionManager.hasVersionDataExists()) {
            GtaVersionButton.getInstance().showErrorMessageNotFoundAnyVersion();
            return;
        }

        const grammarPath = this.getGrammarPath();
        this.ensureGrammarFileExists(grammarPath);

        const grammar = await this.loadGrammar(grammarPath);
        grammar.patterns = await this.generatePatterns();

        await fsp.writeFile(grammarPath, JSON.stringify(grammar, null, 4));
    }

    private getGrammarPath(): string {
        return path.join(
            this.context.extensionPath,
            this.SYNTAX_FOLDER,
            'sb4.tm-language-functions.json'
        );
    }

    private async ensureGrammarFileExists(grammarPath: string) {
        if (await isFileExists(grammarPath)) {
            return;
        }

        await fsp.writeFile(grammarPath, JSON.stringify(this.BASE_GRAMMAR, null, 4));
    }

    private async loadGrammar(grammarPath: string): Promise<typeof this.BASE_GRAMMAR> {
        return JSON.parse(await fsp.readFile(grammarPath, 'utf-8'));
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
        const functionsData = await this.parseFunctionNames();
        const enumsData = await this.parseEnums();

        return {
            functions: this.extractFunctions(functionsData),
            classes: this.extractClasses(functionsData),
            methods: this.extractMethods(functionsData),
            enums: this.extractEnums(enumsData)
        };
    }

    private async parseFunctionNames(): Promise<FunctionNamesList> {
        return JSON.parse(await fsp.readFile(this.gtaVersionManager.getFullPath()!, 'utf-8'));
    }

    private async parseEnums(): Promise<string> {
        const folderPath = this.storageDataManager.get(StorageKey.Sb4FolderPath) as string;

        if (!folderPath) {
            return "";
        }

        const enumsPath = path.join(folderPath, 'data', this.gtaVersionManager.getIdentifier()!, 'enums.txt');

        if (!await isFileExists(enumsPath)) {
            return "";
        }

        return await fsp.readFile(enumsPath, 'utf-8');
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
        if (!items.length) {
            return [];
        }

        return [{ match: `\\b(${items.join('|')})\\b`, name }];
    }
}