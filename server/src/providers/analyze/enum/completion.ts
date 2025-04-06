// import * as vscode from 'vscode';
// import { Enum } from './enum';
// import { Singleton } from '../../../../../client/src/singleton';
// import { TextDocument } from 'vscode-languageserver-textdocument';
// import { CompletionItem, Position } from 'vscode-languageserver';

// export class EnumCompletionProvider extends Singleton {
//     private enumInstance: Enum = Enum.getInstance();

//     public getCompletionItems(document: TextDocument, position: Position): CompletionItem[] {
//         const linePrefix = document.getText({ start: { line: position.line, character: 0 }, end: position });

//         const enumUsageMatch = linePrefix.match(/(\w+)\.$/);
//         if (!enumUsageMatch) return [];

//         const enumName = enumUsageMatch[1];
//         return this.getEnumValues(enumName);
//     }

//     private getEnumValues(enumName: string): CompletionItem[] {
//         const enumInfo = this.enumInstance.getEnumElement(enumName);

//         return enumInfo.elements.map(element => {
//             const item: CompletionItem = {
//                 label: element.name,
//                 kind: vscode.CompletionItemKind.EnumMember,
//                 detail: `${enumName}.${element.name}`,
//                 documentation: `Type: ${enumName}\nValue: ${element.value}`
//             };
//             return item;
//         });
//     }
// }