// import * as vscode from 'vscode';
// import { Class } from './class';
// import { Singleton } from '@shared';

// export const LANGUAGE_SELECTOR = { language: 'sb', scheme: 'file' };

// export class ClassHoverProvider extends Singleton implements vscode.HoverProvider {
//     private context!: vscode.ExtensionContext;
//     private classInstance: Class = Class.getInstance();

//     public init(context: vscode.ExtensionContext) {
//         this.context = context;

//         this.registerProvider();
//     }

//     public provideHover(document: vscode.TextDocument, position: vscode.Position) {
//         const wordRange = document.getWordRangeAtPosition(position, /\b[\w\.]+\b/);
//         if (!wordRange) {
//             return;
//         }

//         const word = document.getText(wordRange);
//         const [className, memberName] = word.split('.');

//         if (!memberName || !className) {
//             return;
//         }

//         const classInfo = this.classInstance.getClassInfo(className);
//         if (!classInfo) {
//             return;
//         }

//         const memberSignature = classInfo.members.get(memberName);
//         if (!memberSignature) {
//             return;
//         }

//         const contents = new vscode.MarkdownString();
//         contents.appendCodeblock(memberSignature, 'sb');

//         return new vscode.Hover(contents);
//     }

//     private registerProvider() {
//         this.context.subscriptions.push(
//             vscode.languages.registerHoverProvider(
//                 LANGUAGE_SELECTOR,
//                 this
//             )
//         );
//     }
// }