import * as vscode from 'vscode';
import { Singleton, StorageKey } from '@shared';
import { WebViewHandler, WebViewManager } from '../../../managers/webview-manager';
import { CommandProcessor } from './command-processor';
import { MessageCommand } from '@shared';
import { FolderManager } from '../../../managers/folder-manager';
import { GtaVersionButton } from '../../../components/gta-version-button.component';
import { StorageDataManager } from '../../../storage/storage-data-manager';
import { GtaVersionManager } from '../../../gta-version/gta-version-manager';

export class OpcodesSearch extends Singleton {
    private context!: vscode.ExtensionContext;
    private webViewManager!: WebViewManager;
    private folderManager: FolderManager = FolderManager.getInstance();
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();
    private commandProcessor: CommandProcessor = CommandProcessor.getInstance();

    public init(context: vscode.ExtensionContext) {
        this.context = context;

        this.create(context);
    }

    private create(context: vscode.ExtensionContext) {
        const disposable = vscode.commands.registerCommand('sb4.searchOpcodes', async () => {
            if (!this.storageDataManager.has(StorageKey.Sb4FolderPath)) {
                this.folderManager.showErrorMessageSelectFolder();
                return;
            }

            if (!this.gtaVersionManager.hasVersionDataExists()) {
                GtaVersionButton.getInstance().showErrorMessageNotFoundAnyVersion();
                return;
            }

            this.webViewManager = new WebViewManager(context, 'client/src/views/opcodes');

            const iconPath = this.webViewManager.getFileUri(this.context.asAbsolutePath('images/logo.jpg'));

            this.webViewManager.createPanel('opcodes-view', 'SB4: Search Opcodes', iconPath);

            this.setupWebViewHandlers();
            await this.updateWebviewContent();
        });

        this.context.subscriptions.push(disposable);
    }

    private setupWebViewHandlers() {
        this.webViewManager.registerMessageHandler(async message => {
            switch (message.command) {
                case MessageCommand.UPDATE_SEARCH_TYPE:
                    this.commandProcessor.setSearchType(message.type);
                    await this.updateWebviewContent();
                    break;
            }
        });

        this.webViewManager.registerChangeViewStateHandler(async event => {
            if (event.webviewPanel.visible) {
                await this.updateWebviewContent();
            }
        });
    }

    public async updateWebviewContent(scrollToTop: boolean = false) {
        if (this.webViewManager === undefined || this.webViewManager.isPanelDisposed()) {
            return;
        }

        const content = await this.getContent();

        const message: WebViewHandler = {
            command: 'updateOpcodes',
            data: content,
            scrollToTop: scrollToTop
        };

        this.webViewManager.sendMessage(message);
    }

    private async getContent(): Promise<string> {
        const functionsContent = await this.commandProcessor.process();

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