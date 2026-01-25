import { GtaVersionGetIdentifierMethod, GtaVersionGetIdentifierResult, Singleton } from '@shared';
import { BaseProvider } from '../providers/base';

export class GtaVersionBridge extends Singleton {
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public async getIdentifier(): Promise<string | undefined> {
		return await this.baseProvider.connection.sendRequest<GtaVersionGetIdentifierResult>(
			GtaVersionGetIdentifierMethod
		);
	}
}