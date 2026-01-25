import { Command, Singleton } from '@shared';
import { CommandBridge } from '../../bridges/command-bridge';
import { OpcodeHoverProvider } from './hover';

export class OpcodeProvider extends Singleton {
	private commandBridge: CommandBridge = CommandBridge.getInstance();
	private opcodes = new Map<string, Command[]>();

	public async init() {
		await this.load();

		OpcodeHoverProvider.getInstance().init();
	}

	public get() {
		return this.opcodes;
	}

	private async load() {
		await this.parse();
	}

	private async parse() {
		const opcodes = await this.commandBridge.getOpcodes();
		if (!opcodes) {
			return;
		}

		const opcodesMap = new Map<string, Command[]>(
			Object.entries(opcodes) as unknown as [string, Command[]][]
		);

		this.opcodes = opcodesMap;
	}
}