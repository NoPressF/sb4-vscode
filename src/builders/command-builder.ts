import { Command, Singleton } from '@utils';
import { CommandManager } from '@managers';

export class CommandBuilder extends Singleton {
	private commandManager: CommandManager = CommandManager.getInstance();

	public getClassesMembers() {
		const result: Map<string, Command[]> = new Map();
		const commands: ReadonlyMap<string, Command> = this.commandManager.getCommands();

		for (const id of commands.keys()) {
			const command = commands.get(id);
			if (!command) {
				continue;
			}

			if (!command.class || !command.member) {
				continue;
			}

			const members = result.get(command.class) ?? [];
			members.push(command);
			result.set(command.class, members);
		}

		return result;
	}

	public getOpcodes() {
		const result: Map<string, Command[]> = new Map();
		const commands: Map<string, Command> = this.commandManager.getCommands();

		for (const id of commands.keys()) {
			const command = commands.get(id);
			if (!command) {
				continue;
			}

			const members = result.get(command.name) ?? [];
			members.push(command);
			result.set(command.name, members);
		}

		return result;
	}
}