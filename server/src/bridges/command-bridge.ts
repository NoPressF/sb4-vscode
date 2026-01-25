import { CommandGetClassesMembersMethod, CommandGetOpcodesMethod, CommandGetResult, Singleton } from '@shared';
import { BaseProvider } from '../providers/base';

export class CommandBridge extends Singleton {
	private baseProvider: BaseProvider = BaseProvider.getInstance();

	public async getClassesMembersCommands(): Promise<CommandGetResult> {
		return await this.baseProvider.connection.sendRequest<CommandGetResult>(
			CommandGetClassesMembersMethod
		);
	}

	public async getOpcodes(): Promise<CommandGetResult> {
		return await this.baseProvider.connection.sendRequest<CommandGetResult>(
			CommandGetOpcodesMethod
		);
	}
}