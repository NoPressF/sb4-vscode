import { Singleton } from '@shared';
import { Hover, MarkupContent } from 'vscode-languageserver';
import { getDottedWordRangeAtPosition } from '../../../src/utils';
import { BaseProvider } from '../base';
import { EnumProvider } from './enum';

export class EnumHoverProvider extends Singleton {
	private enum: EnumProvider = EnumProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public init() {
		this.connect();
	}

	private connect() {
		this.baseProvider.connection.onHover((params): Hover | undefined => {
			const doc = this.baseProvider.documents.get(params.textDocument.uri);
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

			const enumInfo = this.enum.getElement(enumName);
			if (!enumInfo) {
				return;
			}

			const element = enumInfo.find(e => e.name === elementName);
			if (!element) {
				return;
			}

			const markupContent: MarkupContent = {
				kind: 'markdown',
				value: `${enumName}.${elementName}\nValue: ${element.value}`
			};

			return { contents: markupContent };
		});
	}
}