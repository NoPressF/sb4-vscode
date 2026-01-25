import { CONFIG, INCLUDE_PATTERN, Singleton } from '@utils';
import path from 'path';
import * as vscode from 'vscode';
import { BaseProvider } from '../base';

export class JumpIncludeProvider extends Singleton {
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public register() {
		const provider: vscode.DocumentLinkProvider = {
			provideDocumentLinks: (doc, token) => {
				const text = doc.getText();
				const links: vscode.DocumentLink[] = [];

				let match;
				while (!token.isCancellationRequested && (match = INCLUDE_PATTERN.exec(text)) !== null) {
					const fullMatch = match[0];
					const filePath = match[1].trim();

					const pathStartInMatch = fullMatch.indexOf(filePath);
					const startIndex = match.index + pathStartInMatch;
					const endIndex = startIndex + filePath.length;

					const startPos = doc.positionAt(startIndex);
					const endPos = doc.positionAt(endIndex);
					const range = new vscode.Range(startPos, endPos);

					const targetUri = vscode.Uri.file(
						path.resolve(path.dirname(doc.uri.fsPath), filePath)
					);

					links.push({
						range: range,
						target: targetUri,
						tooltip: 'Open include'
					});
				}

				return links;
			}
		};

		this.baseProvider.context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(CONFIG.LANGUAGE_SELECTOR, provider));
	}
}