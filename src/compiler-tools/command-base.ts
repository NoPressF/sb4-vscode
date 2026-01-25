import { isFileExists, Singleton, StorageKey } from '@utils';
import { spawn } from 'child_process';
import { promises as fsp } from 'fs';
import * as iconv from 'iconv-lite';
import * as path from 'path';
import * as vscode from 'vscode';
import { FolderManager, GtaVersionManager, StorageDataManager } from '@managers';
import { CompilerTools } from './compiler-tools';

export enum ExecuteType {
    COMPILE,
    DECOMPILE
};

interface ExecuteInfo {
    commandName: string;
    flag: string;
    logFileName?: string;
    operationTitle: string;
    successMessage: string;
    errorMessagePrefix: string;
}

export abstract class CommandBase extends Singleton implements vscode.Disposable {

    protected abstract executeType: ExecuteType;
    private diagnosticCollection?: vscode.DiagnosticCollection;
    private disposables: vscode.Disposable[] = [];
    private compilerTools: CompilerTools = CompilerTools.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();

    private folderManager: FolderManager = FolderManager.getInstance();

    private readonly executeOptions: Record<ExecuteType, ExecuteInfo> = {
        [ExecuteType.COMPILE]: {
            commandName: 'compileScript',
            flag: 'compile',
            logFileName: 'compile.log',
            operationTitle: 'Compiling',
            successMessage: 'Compiling succeeded',
            errorMessagePrefix: 'Compiling failed'
        },
        [ExecuteType.DECOMPILE]: {
            commandName: 'decompileScript',
            flag: 'decompile',
            operationTitle: 'Decompiling',
            successMessage: 'Decompile succeeded',
            errorMessagePrefix: 'Decompile failed'
        },
    };

    public init(context: vscode.ExtensionContext) {
        const commandName = this.executeOptions[this.executeType].commandName;

        this.diagnosticCollection = vscode.languages.createDiagnosticCollection(`sb4-${commandName}`);
        this.disposables.push(
            vscode.commands.registerCommand(`sb4.${commandName}`, this.execute.bind(this))
        );

        context.subscriptions.push(this);
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
        this.diagnosticCollection?.dispose();
    }

    private async getTargetFilePath(): Promise<string | undefined> {
        if (this.executeType === ExecuteType.COMPILE) {
            const editor = vscode.window.activeTextEditor;
            return editor?.document.uri.fsPath;
        }
        return (await vscode.window.showOpenDialog({
            canSelectFiles: true,
            filters: { 'Compiled scripts': ['scm', 'cs', 'cs3', 'cs4', 's', 'cm', 'csa', 'csi'] }
        }))?.[0].fsPath;
    }

    private getArgs(filePath: string, flag: string): string[] {
        return [
            '--no-splash',
            '--mode',
            this.gtaVersionManager.getIdentifier()!,
            `--${flag}`,
            filePath
        ];
    }

    private async execute() {
        if (!this.storageDataManager.has(StorageKey.Sb4FolderPath)) {
            return;
        }

        const filePath = await this.getTargetFilePath();
        if (!filePath) {
            return;
        }

        await this.executeOperation(filePath);
    }

    private async executeOperation(filePath: string) {
        const folderPath = this.storageDataManager.get(StorageKey.Sb4FolderPath) as string;

        if (!folderPath) {
            this.folderManager.showErrorMessageSelectFolder();
            return;
        }

        const executeOptions = this.executeOptions[this.executeType];
        const logFileName = executeOptions.logFileName;

        const logPath = logFileName ? path.join(folderPath, logFileName) : null;
        const args = this.getArgs(filePath, executeOptions.flag);

        if (logPath !== null) {
            await fsp.unlink(logPath).catch(() => { });
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: executeOptions.operationTitle,
            cancellable: false
        }, async () => this.runCompilerProcess(logPath, filePath, folderPath, args));
    }

    private async runCompilerProcess(logPath: string | null, filePath: string, folderPath: string, args: string[]): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const child = spawn(path.join(folderPath, 'sanny.exe'), args);

            child.on('close', async () => this.handleProcessClose(logPath, filePath, resolve, reject));
            child.on('error', err => this.handleProcessError(err, reject));
        });
    }

    private async handleProcessClose(logPath: string | null, filePath: string, resolve: () => void, reject: (reason?: any) => void) {
        try {
            if (logPath !== null) {
                await fsp.access(logPath);

                const content = await this.readLogFile(logPath);

                this.handleLogContent(content, filePath);
            }

        } catch (error) {
            this.handleError(error as any, reject);
        }

        resolve();
        if (logPath !== null) {
            if (await isFileExists(logPath)) {
                await fsp.unlink(logPath);
            }
        }

    }

    private async readLogFile(logPath: string): Promise<string> {
        const buffer = await fsp.readFile(logPath);
        return iconv.decode(buffer, 'win1251');
    }

    private handleLogContent(content: string, filePath: string) {
        const executeOptions = this.executeOptions[this.executeType];
        if (content === null || content.trim() === '') {
            vscode.window.showInformationMessage(`✅ ${executeOptions.successMessage}`);
        } else {
            this.diagnosticCollection?.set(vscode.Uri.file(filePath),
                this.compilerTools.createFileLevelDiagnostics(content));
            vscode.window.showErrorMessage(`${executeOptions.errorMessagePrefix}:\n${content}`);
        }
    }

    private handleProcessError(err: Error, reject: (reason?: any) => void) {
        vscode.window.showErrorMessage(`Process error: ${err.message}`);
        reject(err);
    }

    private handleError(error: NodeJS.ErrnoException, reject: (reason?: any) => void) {
        if (error.code === 'ENOENT') {
            const executeOptions = this.executeOptions[this.executeType];

            this.diagnosticCollection?.clear();
            vscode.window.showInformationMessage(`✅ ${executeOptions.successMessage}`);
        } else {
            vscode.window.showErrorMessage(`Failed to read log file: ${error.message}`);
            reject(error);
        }
    }
}