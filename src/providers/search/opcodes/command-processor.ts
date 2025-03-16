import { Singleton } from 'singleton';
import { CommandArgs, CommandInfo, CommandIO, SearchType } from './types';
import { SEARCH_TYPE, VAR_NOTATIONS } from 'config';

export class CommandProcessor extends Singleton {
    private searchType: SearchType = SearchType.OPCODES;

    public setSearchType(rawSearchType: string): void {
        this.searchType = this.getNormalizedSearchType(rawSearchType);
    }

    public processCommands(functionsList: any): { commandInfo: CommandInfo, commandString: string }[] {
        const functionsContent: { commandInfo: CommandInfo, commandString: string }[] = [];

        for (const extension of functionsList.extensions) {
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
                functionsContent.push({ commandInfo, commandString });
            }
        }

        return functionsContent;
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
        const isOpcodeSearch = this.searchType === SearchType.OPCODES;
        
        let commandString = isOpcodeSearch ? `${commandInfo.id}: ` : '';
        commandString += commandIO.output || '';
        
        commandString += isOpcodeSearch 
            ? commandInfo.name ?? '' 
            : `${commandInfo.class}.${commandInfo.member}`;

        commandString += isOpcodeSearch ? ' ' : '';
        
        const inputPart = commandIO.input ? `${commandIO.input}` : '';
        
        return commandString + inputPart;
    }    

    private processCommandArgs(input?: CommandArgs[], output?: CommandArgs[]): CommandIO {
        return {
            input: this.formatInputArgs(input),
            output: this.formatOutputArgs(output)
        };
    }

    private formatInputArgs(input?: CommandArgs[]): string {
        if (!input) {
            return this.searchType === SearchType.CLASSES ? '()' : '';
        }

        const inputSeparator = this.searchType === SearchType.OPCODES ? ' ' : ', ';
        const formatted = input.map(arg => this.formatInputArg(arg)).join(inputSeparator);

        return this.searchType === SearchType.CLASSES
            ? `(${formatted})`
            : formatted;
    }

    private formatOutputArgs(output?: CommandArgs[]): string {
        if (!output) {
            return '';
        }

        return output.map(arg => this.formatOutputArg(arg)).join(', ') + ' = ' || '';
    }

    private formatInputArg(args: CommandArgs): string {
        const { name, type, source } = args;

        if (this.searchType === SearchType.OPCODES) {
            const formattedName = name ? `{${name}}` : '';
            const formattedType = type ? `[${type}]` : '';
            return [formattedName, formattedType, source].filter(Boolean).join(' ');
        }

        return name || '';
    }

    private formatOutputArg(args: CommandArgs): string {
        const { name = '', type = '', source = '' } = args;

        if (this.searchType === SearchType.OPCODES) {
            const normalizedSource = `${this.getNormalizedVar(source)} `;
            const formattedName = name.trim() ? `${name}: ` : '';
            return `[${normalizedSource}${formattedName}${type}]`;
        }

        return [name, type ? `[${type}]` : ''].filter(Boolean).join(' ');
    }

    public getHighlightOpcode(rawString: string, commandInfo: CommandInfo): string {
        let string = rawString;

        if (this.searchType === SearchType.OPCODES) {
            string = this.highlightOpcodeSyntax(string);
        } else {
            string = this.highlightClassMemberSyntax(string);
        }

        if (commandInfo.isUnsupported) {
            string = `<s>${string}</s>`;
        }

        return string;
    }

    private highlightOpcodeSyntax(line: string): string {
        line = line.replace(/^[0-9A-F]{4}:/g, (match: string) => {
            return `<span class="opcode-address">${match}</span>`;
        });

        line = line.replace(/^<span class="opcode-address">[0-9A-F]{4}:<\/span>\s*([\w_]+)/g, (match: string, name: string) => {
            return match.replace(name, `<span class="opcode-name">${name}</span>`);
        });

        line = line.replace(/\[([A-Za-z]+)\s+(\w+):\s*([A-Za-z\s]+)\]/g, (fullMatch: string, type: string, name: string, variableType: string) => {
            return fullMatch
                .replace(variableType, `<span class="opcode-param-type">${variableType}</span>`)
                .replace(name, `<span class="opcode-param-name">${name}</span>`)
                .replace(type, `<span class="opcode-type">${type}</span>`);
        });

        line = line.replace(/=\s*([\w_]+)/g, (match: string, name: string) => {
            return match.replace(name, `<span class="opcode-name">${name}</span>`);
        });

        line = line.replace(/(\{\w+\})/g, (match: string) => {
            return `<span class="opcode-param-name">${match}</span>`;
        });

        line = line.replace(/(\[\w+\])/g, (match: string) => {
            return `<span class="opcode-param-type">${match}</span>`;
        });

        return line;
    }

    private highlightClassMemberSyntax(line: string): string {
        line = line.replace(/(?<=\b)[\w]+(?=\.)/g, (match: string) => {
            return `<span class="opcode-class">${match}</span>`;
        });

        line = line.replace(/(?<=\.)[\w]+/g, (match: string) => {
            return `<span class="opcode-member">${match}</span>`;
        });

        line = line.replace(/\b\w+\b(?=\s*\[)/g, (match: string) => {
            return `<span class="opcode-param-name">${match}</span>`;
        });

        line = line.replace(/\[\w+\]/g, (match: string) => {
            return `<span class="opcode-return-type">${match}</span>`;
        });

        line = line.replace(/\(([^)]+)\)/g, (_, inside) => {
            return `(${inside.replace(/\b\w+\b/g, (match: string) => {
                return `<span class="opcode-params">${match}</span>`;
            })})`;
        });

        return line;
    }

    private getNormalizedVar(source: string): string {
        return VAR_NOTATIONS[source] || source;
    }

    private getNormalizedSearchType(source: string): SearchType {
        return SEARCH_TYPE[source];
    }
}