import * as vscode from 'vscode';
import { Singleton, StorageKey, StorageDataManager } from '@shared';
import { WebViewHandler, WebViewManager } from '../../../managers/webview-manager';
import { CommandProcessor } from './command-processor';
import { MessageCommand } from '../../../../../shared/src/types';
import { FolderManager } from '../../../managers/folder-manager';

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
            if (!this.storageDataManager.hasStorageData(StorageKey.Sb4FolderPath)) {
                this.folderManager.handleFolderSelection();
                return;
            }

            this.webViewManager = new WebViewManager(context, 'client/src/views/opcodes');

            const iconPath = this.webViewManager.getFileUri(this.context.asAbsolutePath('images/logo.jpg'));

            this.webViewManager.createPanel('opcodes-view', 'SB4: Search Opcodes', iconPath);
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

        this.webViewManager.registerChangeViewStateHandler(event => {
            if (event.webviewPanel.visible) {
                this.updateWebviewContent();
            }
        });
    }

    public updateWebviewContent(scrollToTop: boolean = false) {
        const content = this.getOpcodesContent();

        const message: WebViewHandler = {
            command: 'updateOpcodes',
            data: content,
            scrollToTop: scrollToTop
        };

        this.webViewManager.sendMessage(message);
    }

    private getOpcodesContent(): string {
        const functionsContent = this.commandProcessor.processCommands();

        return functionsContent
            .map(({ commandInfo, commandString }) => {
                if (commandInfo.isUnsupported) {
                    commandString = `<s>${commandString}</s>`;
                }

                return `<div class="opcode-item">${commandString}</div>`;
            })
            .join('');
    }
}