import { CONFIG } from '@shared';
import * as path from 'path';
import { ExtensionContext, workspace } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { CommandBridgeEvents } from './events/command-bridge-events';
import { GtaVersionBridgeEvents } from './events/gta-version-bridge-events';
import { StorageDataBridgeEvents } from './events/storage-data-bridge-events';

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
	new CommandBridgeEvents(client);

	await client.start();
}

export function clientDeactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}

	return client.stop();
}
