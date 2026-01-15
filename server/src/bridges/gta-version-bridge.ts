import { GtaVersionGetIdentifierMethod, GtaVersionGetIdentifierResult, Singleton } from '@shared';
import { Connection } from 'vscode-languageserver';

export class GtaVersionBridge extends Singleton {
	private connection!: Connection;

	public init(connection: Connection) {
		this.connection = connection;
	}

	async getIdentifier(): Promise<string | undefined> {
		return await this.connection.sendRequest<GtaVersionGetIdentifierResult>(
			GtaVersionGetIdentifierMethod
		);
	}
}