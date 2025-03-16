import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface WebviewHandler {
    command: string;
    data: any;
};

export class WebViewManager {
    private panel: vscode.WebviewPanel | undefined;

    constructor(private context: vscode.ExtensionContext, private basePath: string) { }

    public createPanel(viewId: string, title: string, iconPath?: vscode.Uri, viewColumn: vscode.ViewColumn = vscode.ViewColumn.One): void {
        this.panel = vscode.window.createWebviewPanel(
            viewId,
            title,
            viewColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, this.basePath))
                ]
            }
        );

        this.loadTemplate();

        if (iconPath) {
            this.panel.iconPath = {
                light: iconPath,
                dark: iconPath
            };
        }
    }

    private loadTemplate(): void {
        if (!this.panel) {
            return;
        }

        const templatePath = path.join(
            this.context.extensionPath,
            this.basePath,
            'index.html'
        );

        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        htmlContent = htmlContent
            .replace(/{{cssUri}}/g, this.getResourceUri('styles.css'))
            .replace(/{{jsUri}}/g, this.getResourceUri('script.js'));

        this.panel.webview.html = htmlContent;
    }

    public registerMessageHandler(handler: (message: any) => void): void {
        this.panel?.webview.onDidReceiveMessage(handler);
    }

    // public registerChangeViewStateHandler(handler: (event: vscode.WebviewPanelOnDidChangeViewStateEvent) => void): void {
    //     this.panel?.onDidChangeViewState(handler);
    // }

    public sendMessage(message: WebviewHandler): void {
        this.panel?.webview.postMessage(message);
    }

    public readJsonFile(filePath: string): any {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    };

    public getFileUri(path: string): vscode.Uri {
        return vscode.Uri.file(path);
    }

    private getResourceUri(filename: string): string {
        return this.panel!.webview.asWebviewUri(
            this.getFileUri(path.join(this.context.extensionPath, this.basePath, filename))
        ).toString();
    }

    public dispose(): void {
        this.panel?.dispose();
    }
}