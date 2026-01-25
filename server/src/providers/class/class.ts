import { Command, Singleton } from '@shared';
import { CommandBridge } from '../../bridges/command-bridge';
import { ClassHoverProvider } from './hover';

export class ClassProvider extends Singleton {
	private commandBridge: CommandBridge = CommandBridge.getInstance();
	private classes = new Map<string, Command[]>();

	public async init() {
		await this.load();

		ClassHoverProvider.getInstance().init();
	}

	public getMember(className: string) {
		return this.classes.get(className);
	}

	public get() {
		return this.classes;
	}

	private async load() {
		await this.parse();
	}

	private async parse() {
		const classesMembers = await this.commandBridge.getClassesMembersCommands();
		if (!classesMembers) {
			return;
		}

		const classes = new Map<string, Command[]>(
			Object.entries(classesMembers) as unknown as [string, Command[]][]
		);

		this.classes = classes;
	}
}