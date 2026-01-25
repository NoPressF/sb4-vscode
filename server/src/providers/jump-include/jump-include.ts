import { INCLUDE_PATTERN, Singleton } from '@shared';
import path from 'path';
import { URI } from 'vscode-uri';
import { BaseProvider } from '../base';

export class JumpIncludeProvider extends Singleton {
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public init() {
		this.connect();
	}

	private connect() {
		this.baseProvider.connection.onDocumentLinks((params) => {
			const doc = this.baseProvider.documents.get(params.textDocument.uri);
			if (!doc) {
				return [];
			}

			const text = doc.getText();
			const links = [];

			let match;
			while ((match = INCLUDE_PATTERN.exec(text)) !== null) {
				const fullMatch = match[0];
				const filePath = match[1].trim();

				const pathStartInMatch = fullMatch.indexOf(filePath);
				const startIndex = match.index + pathStartInMatch;
				const endIndex = startIndex + filePath.length;

				const startPos = doc.positionAt(startIndex);
				const endPos = doc.positionAt(endIndex);

				const targetUri = URI.file(
					path.resolve(path.dirname(URI.parse(doc.uri).fsPath), filePath)
				);

				links.push({
					range: {
						start: startPos,
						end: endPos
					},
					target: targetUri.toString()
				});
			}

			return links;
		});
	}
}