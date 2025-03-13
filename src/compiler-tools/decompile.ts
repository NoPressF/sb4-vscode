import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { spawn } from 'child_process';
import { Folder } from '../folder';
import { GtaVersion } from 'gta-version';
import { CompilerTools } from './compiler-tools';

export const DeCompileScript = {
    registerCommander(context: vscode.ExtensionContext) {

        const diagnosticCollection = vscode.languages.createDiagnosticCollection('sb4-compiler');
        context.subscriptions.push(diagnosticCollection);

        const disposable = vscode.commands.registerCommand('sb4.decompileScript', async () => {
            const sbFolderPath = context.globalState.get('selectedSB4FolderPath') as string;

            if (!sbFolderPath) {
                Folder.showSB4FolderSelectionPrompt();
                return;
            }

            const decompileFile = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: { 'Compiled scripts': ['scm', 'cs', 'cs3', 'cs4', 's', 'cm', 'csa', 'csi'] },
                openLabel: 'Decompile'
            });

            if (!decompileFile) {
                return;
            }

            const decompilePath = decompileFile[0].fsPath;
            const sbExePath = path.join(sbFolderPath, 'sanny.exe');
            const activeEditor = vscode.window.activeTextEditor;

            if (!activeEditor) {
                return;
            }

            const logPath = path.join(sbFolderPath, 'decompile.log');

            const args = [
                '--no-splash',
                '--mode',
                GtaVersion.getIdentifier(context),
                '--decompile',
                decompilePath
            ];
        
            await fs.promises.unlink(logPath).catch(() => {});

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: 'Decompiling',
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
                                vscode.window.showInformationMessage('✅ Decompile succeeded');
                            } else {
                                const diagnostics = CompilerTools.createFileLevelDiagnostics(content);
                                diagnosticCollection.set(vscode.Uri.file(decompilePath), diagnostics);
                                vscode.window.showErrorMessage(`Decompile failed:\n${content}`);
                            }

                            await fs.promises.unlink(logPath);
                            resolve();
                        } catch (err) {
                            const error = err as NodeJS.ErrnoException;
                            if (error.code === 'ENOENT') {
                                diagnosticCollection.clear();
                                vscode.window.showInformationMessage('✅ Decompile succeeded');
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