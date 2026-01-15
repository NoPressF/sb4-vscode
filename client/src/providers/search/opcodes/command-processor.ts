import { Singleton } from '@shared';
import { CommandArgs, CommandInfo, CommandIO, SearchType } from '@shared';
import { SEARCH_TYPE, VAR_NOTATIONS } from '@shared';
import { WebViewManager } from '../../../managers/webview-manager';
import { HtmlFormatColorManager } from '../../../managers/html-format-color-manager';
import { GtaVersionManager } from '../../../gta-version/gta-version-manager';

export class CommandProcessor extends Singleton {
    private searchType: SearchType = SearchType.OPCODES;
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();

    private htmlFormatManager: HtmlFormatColorManager = HtmlFormatColorManager.getInstance();

    public setSearchType(rawSearchType: string): void {
        this.searchType = this.getNormalizedSearchType(rawSearchType);
    }

    public async process(): Promise<{ commandInfo: CommandInfo; commandString: string; }[]> {
        const list = await this.getFunctionsList();
        const data: { commandInfo: CommandInfo, commandString: string }[] = [];

        for (const extension of list.extensions) {
            for (const command of extension.commands) {
                let commandInfo = this.getCommandInfo(command);
                if (!commandInfo) {
                    continue;
                }

                if (command.attrs?.is_unsupported) {
                    commandInfo.isUnsupported = true;
                }

                const commandIO = this.processCommandArgs(command.input, command.output);
                const commandString = this.formatCommandString(commandInfo, commandIO);
                data.push({ commandInfo, commandString });
            }
        }

        return data;
    }

    public async getFunctionsList(): Promise<any> {
        return await WebViewManager.readJsonFile(this.gtaVersionManager.getFullPath()!);
    }

    private getCommandInfo(command: any): CommandInfo | null {
        if (this.searchType === SearchType.OPCODES) {
            return {
                id: command.id,
                name: command.name.toLowerCase()
            };
        }

        if (!command.class && !command.member) {
            return null;
        }

        return {
            class: command.class,
            member: command.member
        };
    }

    private formatCommandString(commandInfo: CommandInfo, commandIO: CommandIO): string {
        return this.searchType === SearchType.OPCODES
            ? this.formatOpcodeCommandString(commandInfo, commandIO)
            : this.formatClassCommandString(commandInfo, commandIO);
    }

    private formatOpcodeCommandString(commandInfo: CommandInfo, commandIO: CommandIO): string {
        const address = this.htmlFormatManager.getOpcodeAddress(commandInfo.id + ":");
        const output = commandIO.output;
        const name = this.htmlFormatManager.getOpcodeName(commandInfo.name);
        const input = commandIO.input;

        return `${address} ${output} ${name} ${input}`;
    }

    public formatClassCommandString(commandInfo: CommandInfo, commandIO: CommandIO): string {
        const output = commandIO.output;
        const commandClass = this.htmlFormatManager.getOpcodeClassName(commandInfo.class);
        const commandMember = this.htmlFormatManager.getOpcodeName(commandInfo.member);
        const input = commandIO.input;

        return `${output} ${commandClass}.${commandMember}${input}`;
    }

    private processCommandArgs(input?: CommandArgs[], output?: CommandArgs[]): CommandIO {
        return this.searchType === SearchType.OPCODES
            ? this.processOpcodeCommandArgs(input, output)
            : this.processClassCommandArgs(input, output);
    }

    private processOpcodeCommandArgs(input?: CommandArgs[], output?: CommandArgs[]): CommandIO {
        return {
            input: this.formatOpcodeInputArgs(input),
            output: this.formatOpcodeOutputArgs(output)
        };
    }

    public processClassCommandArgs(input?: CommandArgs[], output?: CommandArgs[]): CommandIO {
        return {
            input: this.formatClassInputArgs(input),
            output: this.formatClassOutputArgs(output)
        };
    }

    private formatOpcodeInputArgs(input?: CommandArgs[]): string {
        if (!input) {
            return '';
        }

        return input.map(arg => this.formatOpcodeInputArg(arg)).join(' ');
    }

    private formatClassInputArgs(input?: CommandArgs[]): string {
        if (!input) {
            return '()';
        }

        const args = input.map(arg => this.formatClassInputArg(arg)).join(', ');
        return `(${args})`;
    }

    private formatOpcodeInputArg(args: CommandArgs): string {
        const { name, type, source } = args;

        const argName = name ? this.htmlFormatManager.getOpcodeArgName(`{${name}}`) : '';
        const argType = type ? this.htmlFormatManager.getOpcodeArgType(`[${type}]`) : '';

        return [argName, argType, source].filter(Boolean).join(' ');
    }

    private formatClassInputArg(args: CommandArgs): string {
        return this.htmlFormatManager.getOpcodeArgName(args.name);
    }

    private formatOpcodeOutputArgs(output?: CommandArgs[]): string {
        if (!output) {
            return '';
        }

        return output.map(arg => this.formatOpcodeOutputArg(arg)).join(', ') + ' = ' || '';
    }

    private formatClassOutputArgs(output?: CommandArgs[]): string {
        if (!output) {
            return '';
        }

        return output.map(arg => this.formatClassOutputArg(arg)).join(', ') + ' = ' || '';
    }

    private formatOpcodeOutputArg(args: CommandArgs): string {
        const { name, type, source } = args;

        const argReturnVar = source ? `${this.htmlFormatManager.getOpcodeReturnVarType(this.getNormalizedVar(source))} ` : '';
        const argName = name ? this.htmlFormatManager.getOpcodeArgName(name + ':') : '';
        const argType = type ? this.htmlFormatManager.getOpcodeArgType(type) : '';

        return `[${argReturnVar}${argName}${argType}]`;
    }

    private formatClassOutputArg(args: CommandArgs): string {
        const { name, type } = args;

        const argName = name ? this.htmlFormatManager.getOpcodeArgName(name) : '';
        const argType = type ? this.htmlFormatManager.getOpcodeReturnVarType(`[${type}]`) : '';

        return [argName, argType].filter(Boolean).join(' ');
    }

    private getNormalizedVar(source: string): string {
        return VAR_NOTATIONS[source] || source;
    }

    private getNormalizedSearchType(source: string): SearchType {
        return SEARCH_TYPE[source];
    }
}