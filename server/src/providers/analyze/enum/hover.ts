import { Enum } from './enum';
import { Singleton } from '@shared';
import { getDottedWordRangeAtPosition } from '../../../../src/utils';
import { Hover, MarkupContent } from 'vscode-languageserver';

export class EnumHoverProvider extends Singleton {
	private enum: Enum = Enum.getInstance();

	public init() {
		this.connect();
	}

	public connect() {
		this.enum.connection.onHover((params): Hover | undefined => {
			const doc = this.enum.documents.get(params.textDocument.uri);
			if (!doc) {
				return;
			}

			const wordRange = getDottedWordRangeAtPosition(doc, params.position);
			if (!wordRange) {
				return;
			}

			const word = doc.getText(wordRange);
			const [enumName, elementName] = word.split('.');

			if (!elementName || !enumName) {
				return;
			}

			const enumInfo = this.enum.getEnumElement(enumName);
			if (!enumInfo) {
				return;
			}

			const element = enumInfo.find(e => e.name === elementName);
			if (!element) {
				return;
			}

			const markupContent: MarkupContent = {
				kind: 'markdown',
				value: `**${enumName}.${elementName}**\n\n**Type**: ${enumName}\n\n**Value**: ${element.value}`
			};

			return { contents: markupContent };
		});
	}
}