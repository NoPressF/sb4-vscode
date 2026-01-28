import { TokenKind } from './token-kind';

export interface Token {
	kind: TokenKind
	text: string
	line: number
	col: number
};