import { Singleton } from '@shared';
import { CompletionItem, CompletionItemKind, CompletionParams, Position, Range } from 'vscode-languageserver';
import { BaseProvider } from '../base';
import { ClassProvider } from './class';

export class ClassCompletionProvider extends Singleton {
	private class: ClassProvider = ClassProvider.getInstance();
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public getResult(params: CompletionParams) {
		const doc = this.baseProvider.documents.get(params.textDocument.uri);
		if (!doc) {
			return [];
		}

		const classesMembers = this.class.get();

		const line = params.position.line;
		const range = Range.create(Position.create(line, 0), Position.create(line + 1, 0));
		const lineText = doc.getText(range);
		const textBeforeCursor = lineText.slice(0, params.position.character);

		const classMatch = textBeforeCursor.match(/(\w+)\.$/);

		if (classMatch) {
			const className = classMatch[1];

			const members = classesMembers.get(className);
			if (!members) {
				return [];
			}

			return members.map((command, idx) => {
				return {
					label: command.member!,
					kind: CompletionItemKind.Method,
					detail: `(Class member) ${className}.${command.member}`,
					sortText: String(idx).padStart(6, '0'),
					data: { type: 'classMember', className, memberName: command.member }
				};
			});
		}

		const out: CompletionItem[] = [];
		for (const [className] of classesMembers) {
			out.push({
				label: className,
				kind: CompletionItemKind.Class,
				detail: "Class",
				data: { type: 'class', className }
			});
		}

		return out;
	}
}