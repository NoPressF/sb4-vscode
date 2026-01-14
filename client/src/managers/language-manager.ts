import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GtaVersionManager } from '@shared';
import { Singleton } from '@shared';
import { StorageDataManager, StorageKey } from '@shared';
import { GtaVersionButton } from '../components/gta-version-button.component';

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

    public async applyColors() {
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

    public async exportPatterns() {
        if (!this.gtaVersionManager.hasVersionDataExists()) {
            GtaVersionButton.getInstance().showErrorMessageNotFoundAnyVersion();
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

    private ensureGrammarFileExists(grammarPath: string) {
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
        const functionsData = this.parseFunctionNames();
        const enumsData = this.parseEnums();

        return {
            functions: this.extractFunctions(functionsData),
            classes: this.extractClasses(functionsData),
            methods: this.extractMethods(functionsData),
            enums: this.extractEnums(enumsData)
        };
    }

    private parseFunctionNames(): FunctionNamesList {
        return JSON.parse(fs.readFileSync(this.gtaVersionManager.getFullPath()!, 'utf-8'));
    }

    private parseEnums(): string {
        const folderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;

        if (!folderPath) {
            return "";
        }

        const enumsPath = path.join(folderPath, 'data', this.gtaVersionManager.getIdentifier()!, 'enums.txt');

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
        if (!items.length) {
            return [];
        }

        return [{ match: `\\b(${items.join('|')})\\b`, name }];
    }
}