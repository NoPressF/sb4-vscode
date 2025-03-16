import * as vscode from 'vscode';
import * as path from 'path';
import { FolderManager } from 'managers/folder-manager';
import { GtaVersionManager } from 'managers/gta-version-manager';
import { Singleton } from 'singleton';
import { StorageDataManager, StorageKey } from 'managers/storage-data-manager';
import { WebviewHandler, WebViewManager } from 'managers/webview-manager';
import { CommandProcessor } from './command-processor';
import { MessageCommand } from './types';

export class OpcodesSearch extends Singleton {
    private context!: vscode.ExtensionContext;
    private webviewManager!: WebViewManager;
    private folderManager: FolderManager = FolderManager.getInstance();
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();
    private commandProcessor: CommandProcessor = CommandProcessor.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;
        this.create(context);
    }

    private create(context: vscode.ExtensionContext) {
        const disposable = vscode.commands.registerCommand('sb4.searchOpcodes', () => {
            if (!this.storageDataManager.hasStorageDataEmpty(StorageKey.Sb4FolderPath)) {
                this.folderManager.handleFolderSelection();
                return;
            }

            this.webviewManager = new WebViewManager(context, 'src/views/opcodes');

            const iconPath = this.webviewManager.getFileUri(this.context.asAbsolutePath('images/logo.jpg'));

            this.webviewManager.createPanel('opcodes-view', 'Search Opcodes', iconPath);
            this.setupWebviewHandlers();
            this.updateWebviewContent();
        });

        this.context.subscriptions.push(disposable);
    }

    private setupWebviewHandlers(): void {
        this.webviewManager.registerMessageHandler(message => {
            switch (message.command) {
                case MessageCommand.UPDATE_SEARCH_TYPE:
                    this.commandProcessor.setSearchType(message.type);
                    this.updateWebviewContent();
                    break;
            }
        });

        // this.webviewManager.registerChangeViewStateHandler(event => {
        //     if (event.webviewPanel.visible) {
        //         this.updateWebviewContent();
        //     }
        // });
    }

    private updateWebviewContent() {
        const content = this.getOpcodesContent();

        const message: WebviewHandler = {
            command: 'updateOpcodes',
            data: content
        };

        this.webviewManager.sendMessage(message);
    }

    private getOpcodesContent(): string {
        const sb4FolderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;
        const functionsFilePath = path.join(
            sb4FolderPath,
            'data',
            this.gtaVersionManager.getIdentifier(),
            this.gtaVersionManager.getFunctionsFile()
        );

        const functionsList = this.webviewManager.readJsonFile(functionsFilePath);
        const functionsContent = this.commandProcessor.processCommands(functionsList);

        return functionsContent
            .map(({ commandInfo, commandString }) => {
                const highlightedLine = this.commandProcessor.getHighlightOpcode(commandString, commandInfo);
                return `<div class="opcode-item">${highlightedLine}</div>`;
            })
            .join('');
    }
}