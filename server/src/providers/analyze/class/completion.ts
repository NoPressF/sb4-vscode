// import * as vscode from 'vscode';
// import { Class } from './class';
// import { Singleton } from '@shared';
// import { CONFIG } from '@shared';

// export class ClassCompletionProvider extends Singleton implements vscode.CompletionItemProvider {
//     private context!: vscode.ExtensionContext;
//     private classInstance: Class = Class.getInstance();

//     public init(context: vscode.ExtensionContext) {
//         this.context = context;

//         this.registerProvider();
//     }

//     public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] | undefined {
//         const linePrefix = document.getText(new vscode.Range(position.line, 0, position.line, position.character));

//         const classMethodMatch = linePrefix.match(/(\w+)\.$/i);
//         if (!classMethodMatch) {
//             return undefined;
//         }

//         const className = classMethodMatch[1];
//         return this.getMethodsForClass(className);
//     }

//     private getMethodsForClass(className: string): vscode.CompletionItem[] {
//         const classInfo = this.classInstance.getClassInfo(className);
//         if (!classInfo) {
//             return [];
//         }

//         return Array.from(classInfo.members.entries()).map(([member, signature]) => {
//             const item = new vscode.CompletionItem(member, vscode.CompletionItemKind.Method);
//             item.detail = signature;
//             return item;
//         });
//     }

//     private registerProvider() {
//         this.context.subscriptions.push(
//             vscode.languages.registerCompletionItemProvider(
//                 CONFIG.LANGUAGE_SELECTOR,
//                 this,
//                 '.', '(', ',', ' '
//             )
//         );
//     }
// }