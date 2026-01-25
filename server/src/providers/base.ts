import { Singleton } from '@shared';
import { Connection, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ClassCompletionProvider } from './class/completion';
import { EnumCompletionProvider } from './enum/completion';
import { OpcodeCompletionProvider } from './opcode/completion';

export class BaseProvider extends Singleton {
	public connection!: Connection;
	public documents!: TextDocuments<TextDocument>;

	public setup(connection: Connection, documents: TextDocuments<TextDocument>) {
		this.connection = connection;
		this.documents = documents;
		return this;
	}

	public provideCompletions() {
		this.connection.onCompletion(params => {
			return [
				...EnumCompletionProvider.getInstance().getResult(params),
				...ClassCompletionProvider.getInstance().getResult(params),
				...OpcodeCompletionProvider.getInstance().getResult(params)
			];
		});
	}
}