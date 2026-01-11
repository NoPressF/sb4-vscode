import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { spawn } from 'child_process';
import { CompilerTools } from './compiler-tools';
import { Singleton } from '@shared';
import { StorageDataManager, StorageKey } from '@shared';
import { GtaVersionManager } from '@shared';

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
            this.gtaVersionManager.getIdentifier(),
            `--${flag}`,
            filePath
        ];
    }

    private async execute() {
        if (!this.storageDataManager.hasStorageDataEmpty(StorageKey.Sb4FolderPath)) {
            return;
        }

        const filePath = await this.getTargetFilePath();
        if (!filePath) {
            return;
        }

        await this.executeOperation(filePath);
    }

    private async executeOperation(filePath: string) {
        const sb4FolderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;
        const executeOptions = this.executeOptions[this.executeType];
        const logFileName = executeOptions.logFileName;

        const logPath = logFileName ? path.join(sb4FolderPath, logFileName) : null;
        const args = this.getArgs(filePath, executeOptions.flag);

        if (logPath !== null) {
            await fs.promises.unlink(logPath).catch(() => { });
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: executeOptions.operationTitle,
            cancellable: false
        }, async () => this.runCompilerProcess(logPath, filePath, sb4FolderPath, args));
    }

    private async runCompilerProcess(logPath: string | null, filePath: string, sb4FolderPath: string, args: string[]): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const child = spawn(path.join(sb4FolderPath, 'sanny.exe'), args);

            child.on('close', async () => this.handleProcessClose(logPath, filePath, resolve, reject));
            child.on('error', err => this.handleProcessError(err, reject));
        });
    }

    private async handleProcessClose(logPath: string | null, filePath: string, resolve: () => void, reject: (reason?: any) => void) {
        try {
            if (logPath !== null) {
                await fs.promises.access(logPath);

                const content = await this.readLogFile(logPath);
                this.handleLogContent(content, filePath, resolve);
            }

        } catch (error) {
            this.handleError(error as any, reject);
        }

        resolve();
        if (logPath !== null) {
            await fs.promises.unlink(logPath);
        }
    }

    private async readLogFile(logPath: string): Promise<string> {
        const buffer = await fs.promises.readFile(logPath);
        return iconv.decode(buffer, 'win1251');
    }

    private handleLogContent(content: string, filePath: string, resolve: () => void) {
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