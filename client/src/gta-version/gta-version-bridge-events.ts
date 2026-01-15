import { LanguageClient } from 'vscode-languageclient/node';
import { GtaVersionManager } from './gta-version-manager';
import { GtaVersionGetIdentifierMethod } from '@shared';

export class GtaVersionBridgeEvents {
	private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();

	constructor(private client: LanguageClient) {
		this.connect();
	}

	private connect() {
		this.client.onRequest(GtaVersionGetIdentifierMethod, async () => {
			return this.gtaVersionManager.getIdentifier();
		});
	}
}