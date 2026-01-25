import { Command, CommandGetClassesMembersMethod, CommandGetOpcodesMethod, CommandGetResult } from '@shared';
import { LanguageClient } from 'vscode-languageclient/node';
import { CommandManager } from '../managers/command-manager';

export class CommandBridgeEvents {
	private commandManager: CommandManager = CommandManager.getInstance();

	constructor(private client: LanguageClient) {
		this.connect();
	}

	private connect() {
		this.client.onRequest(CommandGetClassesMembersMethod, async () => {
			const result: CommandGetResult = {};
			const commands: ReadonlyMap<string, Command> = this.commandManager.getCommands();

			for (const id of commands.keys()) {
				const command = commands.get(id);
				if (!command) {
					continue;
				}

				if (!command.class || !command.member) {
					continue;
				}

				const members = result[command.class] ?? [];
				members.push(command);
				result[command.class] = members;
			}

			return result;
		});

		this.client.onRequest(CommandGetOpcodesMethod, async () => {
			const result: CommandGetResult = {};
			const commands: ReadonlyMap<string, Command> = this.commandManager.getCommands();

			for (const id of commands.keys()) {
				const command = commands.get(id);
				if (!command) {
					continue;
				}

				const members = result[command.name] ?? [];
				members.push(command);
				result[command.name] = members;
			}

			return result;
		});
	}
}