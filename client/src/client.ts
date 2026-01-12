import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { CONFIG } from './config';

let client: LanguageClient;

export function clientActivate(context: ExtensionContext) {
	const serverModule = context.asAbsolutePath(path.join('dist', 'server', 'src', 'server.js'));
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [CONFIG.LANGUAGE_SELECTOR],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	client = new LanguageClient(
		'sannyBuilderServer',
		'Sanny Builder 4 Server',
		serverOptions,
		clientOptions
	);

	client.start();
}

export function clientDeactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}

	return client.stop();
}
