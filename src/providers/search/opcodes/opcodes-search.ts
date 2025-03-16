import * as vscode from 'vscode';
import { FolderManager } from 'managers/folder-manager';
import { Singleton } from 'singleton';
import { StorageDataManager, StorageKey } from 'managers/storage-data-manager';
import { WebViewHandler, WebViewManager } from 'managers/webview-manager';
import { CommandProcessor } from './command-processor';
import { MessageCommand } from './types';

export class OpcodesSearch extends Singleton {
    private context!: vscode.ExtensionContext;
    private webViewManager!: WebViewManager;
    private folderManager: FolderManager = FolderManager.getInstance();
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

            this.webViewManager = new WebViewManager(context, 'src/views/opcodes');

            const iconPath = this.webViewManager.getFileUri(this.context.asAbsolutePath('images/logo.jpg'));

            this.webViewManager.createPanel('opcodes-view', 'Search Opcodes', iconPath);
            this.setupWebViewHandlers();
            this.updateWebviewContent();
        });

        this.context.subscriptions.push(disposable);
    }

    private setupWebViewHandlers(): void {
        this.webViewManager.registerMessageHandler(message => {
            switch (message.command) {
                case MessageCommand.UPDATE_SEARCH_TYPE:
                    this.commandProcessor.setSearchType(message.type);
                    this.updateWebviewContent();
                    break;
            }
        });

        // this.webViewManager.registerChangeViewStateHandler(event => {
        //     if (event.webviewPanel.visible) {
        //         this.updateWebviewContent();
        //     }
        // });
    }

    private updateWebviewContent() {
        const content = this.getOpcodesContent();

        const message: WebViewHandler = {
            command: 'updateOpcodes',
            data: content
        };

        this.webViewManager.sendMessage(message);
    }

    private getOpcodesContent(): string {
        const functionsContent = this.commandProcessor.processCommands();

        return functionsContent
            .map(({ commandInfo, commandString }) => {
                const highlightedLine = this.commandProcessor.getHighlightOpcode(commandString, commandInfo);
                return `<div class="opcode-item">${highlightedLine}</div>`;
            })
            .join('');
    }
}