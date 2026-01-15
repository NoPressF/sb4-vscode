import { Range } from 'vscode-languageserver';
import { TextDocument, Position } from 'vscode-languageserver-textdocument';

export function getDottedWordRangeAtPosition(doc: TextDocument, position: Position): Range | null {
	const text = doc.getText();
	const offset = doc.offsetAt(position);

	const isWordOrDot = (ch: number) =>
		ch === 46 || ch === 95 ||
		(ch >= 48 && ch <= 57) ||
		(ch >= 65 && ch <= 90) ||
		(ch >= 97 && ch <= 122);

	let s = offset, e = offset;
	while (s > 0 && isWordOrDot(text.charCodeAt(s - 1))) { s--; }
	while (e < text.length && isWordOrDot(text.charCodeAt(e))) { e++; }

	if (s === e) { return null; }

	const slice = text.slice(s, e);
	const m = /^([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?)/.exec(slice);
	if (!m) { return null; }
	const matched = m[1];

	const startPos = doc.positionAt(s);
	const endPos = doc.positionAt(s + matched.length);

	return Range.create(startPos, endPos);
}
