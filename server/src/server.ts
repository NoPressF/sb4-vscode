import {
	createConnection,
	DidChangeConfigurationNotification,
	DocumentDiagnosticReportKind,
	InitializeParams,
	InitializeResult,
	ProposedFeatures,
	TextDocuments,
	TextDocumentSyncKind,
	type DocumentDiagnosticReport
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { BaseProvider } from './providers/base';
import { ClassProvider } from './providers/class/class';
import { EnumProvider } from './providers/enum/enum';
import { JumpIncludeProvider } from './providers/jump-include/jump-include';
import { OpcodeProvider } from './providers/opcode/opcode';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const documentSettings = new Map<string, Thenable<void>>();

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: false,
				triggerCharacters: ['.']
			},
			hoverProvider: true,
			documentLinkProvider: {
				resolveProvider: false
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			}
		}
	};

	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}

	BaseProvider.getInstance().setup(connection, documents);
	JumpIncludeProvider.getInstance().init();

	return result;
});

connection.onInitialized(async () => {
	if (hasConfigurationCapability) {
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => { });
	}

	await EnumProvider.getInstance().init();
	await ClassProvider.getInstance().init();
	await OpcodeProvider.getInstance().init();

	BaseProvider.getInstance().provideCompletions();
});

connection.onDidChangeConfiguration(_ => {
	if (hasConfigurationCapability) {
		documentSettings.clear();
	}

	connection.languages.diagnostics.refresh();
});

documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	} else {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});

documents.onDidChangeContent(_change => {

});

documents.listen(connection);
connection.listen();