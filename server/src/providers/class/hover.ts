import { CommandType, Singleton } from '@shared';
import { Hover, MarkupKind } from 'vscode-languageserver';
import { getDottedWordRangeAtPosition } from '../../../src/utils';
import { BaseProvider } from '../base';
import { ClassProvider } from './class';

export class ClassHoverProvider extends Singleton {
	private class: ClassProvider = ClassProvider.getInstance();
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
			const [className, memberName] = word.split('.');

			if (!memberName || !className) {
				return;
			}

			const classInfo = this.class.getMember(className);
			if (!classInfo) {
				return;
			}

			const element = classInfo.find(cmd => cmd.member === memberName);
			if (!element) {
				return;
			}

			const format = (element.format?.[CommandType.CLASS_MEMBER] ?? '').replace(/<[^>]+>/g, '');

			return {
				contents: { kind: MarkupKind.Markdown, value: `${format}\n\n${element.shortDesc}` }
			};
		});
	}
}