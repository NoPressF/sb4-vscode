import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport,
	CompletionItemKind,
	HoverParams,
	Hover
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { Enum } from './providers/analyze/enum/enum';
import { StorageDataBridge } from './bridges/storage-data-bridge';
import { GtaVersionBridge } from './bridges/gta-version-bridge';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const documentSettings = new Map<string, Thenable<void>>();

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

const storageDataBridge: StorageDataBridge = StorageDataBridge.getInstance();
const gtaVersionBridge: GtaVersionBridge = GtaVersionBridge.getInstance();

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
				resolveProvider: true,
				triggerCharacters: ['.']
			},
			hoverProvider: true,
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

	return result;
});

connection.onInitialized(async () => {
	if (hasConfigurationCapability) {
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => { });
	}

	storageDataBridge.init(connection);
	gtaVersionBridge.init(connection);

	await Enum.getInstance().init(connection, documents);
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

documents.onDidChangeContent(change => {
	//validateTextDocument(change.document);
});

// async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
// 	const text = textDocument.getText();
// 	const pattern = /'\w{8,}'/g;
// 	let m: RegExpExecArray | null;

// 	const diagnostics: Diagnostic[] = [];
// 	while ((m = pattern.exec(text))) {
// 		const diagnostic: Diagnostic = {
// 			severity: DiagnosticSeverity.Error,
// 			range: {
// 				start: textDocument.positionAt(m.index),
// 				end: textDocument.positionAt(m.index + m[0].length)
// 			},
// 			message: `${m[0]} has more than 7 characters in single quotes.`
// 		};

// 		diagnostics.push(diagnostic);
// 	}
// 	return diagnostics;
// }

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return item;
	}
);

documents.listen(connection);
connection.listen();