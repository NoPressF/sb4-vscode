import { Singleton } from '@utils';
import { Token } from './token';
import { TokenKind } from './token-kind';

const singleCharTokens: Record<string, TokenKind> = {
	'(': TokenKind.OpenRoundBracket,
	')': TokenKind.CloseRoundBracket,
	'[': TokenKind.OpenSquareBracket,
	']': TokenKind.CloseSquareBracket,
	'=': TokenKind.Equals,
	',': TokenKind.Comma,
	'.': TokenKind.Dot,
};

const multiCharTokens: Record<string, TokenKind> = {
	'==': TokenKind.EqualEqual,
	'+=': TokenKind.PlusEquals,
	'-=': TokenKind.MinusEquals
};

const prefixCharTokens: Record<string, TokenKind> = {
	'@': TokenKind.LabelJump,
	':': TokenKind.LabelDefine,
	'$': TokenKind.GlobalVar
};

const postfixCharTokens: Record<string, TokenKind> = {
	'@': TokenKind.LocalVar,
	'ifsv': TokenKind.ArraySize
};

export class Tokenizer extends Singleton {
	private tokens: Token[] = [];

	private push(kind: TokenKind, text: string, line: number, col: number) {
		this.tokens.push({
			kind: kind,
			text: text,
			line: line,
			col: col
		});
	}

	private pushPrefix(line: string, kind: TokenKind, lineNum: number, col: number) {
		const start = col;

		if (prefixCharTokens[line[col]] !== undefined) {
			col++;
		}

		while (col < line.length && /\w/.test(line[col])) {
			col++;
		}

		this.push(kind, line.slice(start, col), lineNum + 1, start);
		return col;
	}

	private pushPostfix(line: string, lineNum: number, col: number) {
		const start = col;

		while (col < line.length && /\d/.test(line[col])) {
			col++;

			for (const [str, kind] of Object.entries(postfixCharTokens)) {
				for (const char of str) {
					if (line[col] === char) {
						this.push(kind, line.slice(start, col + 1), lineNum + 1, start);
						col++;
						break;
					}
				}
			}
		}

		return col;
	}

	public tokenize(text: string): Token[] {
		const lines = text.split(/\r?\n/);

		for (let lineNum = 0; lineNum < lines.length; lineNum++) {
			const line = lines[lineNum];
			let col = 0;

			while (col < line.length) {
				const char = line[col];

				if (/\s/.test(char)) {
					col++;
					continue;
				}

				// line-comment
				if (char === '/' && line[col + 1] === '/') {
					break;
				}

				const singleCharKind = singleCharTokens[char];
				if (singleCharKind !== undefined && line[col + 1] !== char) {
					this.push(singleCharKind, char, lineNum + 1, col);
					col++;
					continue;
				}

				for (const [str, kind] of Object.entries(multiCharTokens)) {
					let matches = 0;

					for (const c of str) {
						if (c === line[col]) {
							matches++;
							col++;
						}
					}

					if (matches === str.length) {
						this.push(kind, str, lineNum + 1, col);
					}
				}

				const prefixCharKind = prefixCharTokens[char];
				if (prefixCharKind !== undefined) {
					col = this.pushPrefix(line, prefixCharKind, lineNum, col);
					continue;
				}

				// local var / array size
				if (/\d/.test(char)) {
					col = this.pushPostfix(line, lineNum, col);
					continue;
				}

				// identifier
				if (/[A-Za-z_]/.test(char)) {
					col = this.pushPrefix(line, TokenKind.Identifier, lineNum, col);
					continue;
				}

				// number / float
				if (/\d/.test(char)) {
					const start = col;
					let hasDot = false;

					while (col < line.length) {
						const c = line[col];

						if (/\d/.test(c)) {
							col++;
							continue;
						}

						if (c === '.' && !hasDot) {
							hasDot = true;
							col++;
							continue;
						}

						break;
					}

					this.push(hasDot ? TokenKind.Float : TokenKind.Number, line.slice(start, col), lineNum + 1, start);
					continue;
				}

				// string
				if (char === '\'' || char === '\"') {
					const start = col;
					col++;

					let str: string = "";
					str += char;

					while (col < line.length) {
						const c = line[col];

						if (c === '\\') {
							const next = line[col + 1];
							if (next !== undefined) {
								str += c + next;
								col += 2;
								continue;
							}
						}

						if (c === '\'' || char === '\"') {
							col++;
							str += c;
							break;
						}

						str += c;
						col++;
					}

					this.push(TokenKind.String, str, lineNum + 1, start);
					continue;
				}

				col++;
			}

			// EOL
			this.push(TokenKind.NewLine, '\n', lineNum + 1, line.length);
		}

		// EOF
		this.push(TokenKind.EOF, '', lines.length + 1, 0);
		return this.tokens;
	}
};