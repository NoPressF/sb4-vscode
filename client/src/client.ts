import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import { CONFIG, StorageGetMethod, StorageGetParams, StorageKey, StorageSetMethod, StorageSetParams } from '@shared';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { StorageDataBridgeEvents } from './storage/storage-data-bridge-events';
import { GtaVersionBridgeEvents } from './gta-version/gta-version-bridge-events';

let client: LanguageClient;

export async function clientActivate(context: ExtensionContext) {
	const serverModule = context.asAbsolutePath(path.join('dist', 'server', 'server.js'));
	const serverOptions: ServerOptions = {
		run: {
			module: serverModule,
			transport: TransportKind.ipc
		},
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ["--nolazy", "--inspect=6009"] }
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

	new StorageDataBridgeEvents(client);
	new GtaVersionBridgeEvents(client);

	await client.start();
}

export function clientDeactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}

	return client.stop();
}
