import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { spawn } from 'child_process';
import { Folder } from '../folder';
import { GtaVersion } from 'gta-version';
import { CompilerTools } from './compiler-tools';

export const CompileScript = {
    registerCommand(context: vscode.ExtensionContext) {

        const diagnosticCollection = vscode.languages.createDiagnosticCollection('sb4-compiler');
        context.subscriptions.push(diagnosticCollection);

        const disposable = vscode.commands.registerCommand('sb4.compileScript', async () => {
            const sbFolderPath = context.globalState.get('selectedSB4FolderPath') as string;

            if (!sbFolderPath) {
                Folder.showSB4FolderSelectionPrompt();
                return;
            }

            const sbExePath = path.join(sbFolderPath, 'sanny.exe');
            const activeEditor = vscode.window.activeTextEditor;

            if (!activeEditor) {
                return;
            }

            const currentFilePath = activeEditor.document.uri.fsPath;
            const logPath = path.join(sbFolderPath, 'compile.log');

            const args = [
                '--no-splash',
                '--mode',
                GtaVersion.getIdentifier(context),
                '--compile',
                currentFilePath
            ];

            await fs.promises.unlink(logPath).catch(() => { });

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: 'Compiling',
                cancellable: false
            }, async () => {
                return new Promise<void>(async (resolve, reject) => {
                    const child = spawn(sbExePath, args);

                    child.on('close', async () => {
                        try {
                            await fs.promises.access(logPath);

                            const buffer = await fs.promises.readFile(logPath);
                            const content = iconv.decode(buffer, 'win1251');

                            if (content.trim() === '') {
                                vscode.window.showInformationMessage('✅ Compiling succeeded');
                            } else {
                                const diagnostics = CompilerTools.createFileLevelDiagnostics(content);
                                diagnosticCollection.set(vscode.Uri.file(currentFilePath), diagnostics);
                                vscode.window.showErrorMessage(`Compiling failed:\n${content}`);
                            }

                            await fs.promises.unlink(logPath);
                            resolve();
                        } catch (err) {
                            const error = err as NodeJS.ErrnoException;
                            if (error.code === 'ENOENT') {
                                diagnosticCollection.clear();
                                vscode.window.showInformationMessage('✅ Compiling succeeded');
                                resolve();
                            } else {
                                vscode.window.showErrorMessage(`Failed to read log file: ${error.message}`);
                                reject(error);
                            }
                        }
                    });

                    child.on('error', (err) => {
                        const error = err as Error;
                        vscode.window.showErrorMessage(`Process error: ${error.message}`);
                        reject(error);
                    });
                });
            });
        });

        context.subscriptions.push(disposable);
    }
};

function createFileLevelDiagnostics(content: string) {
    throw new Error('Function not implemented.');
}
