import * as path from 'path';
import { Singleton } from '../../../../../src/singleton';
import { CommandArgs, CommandInfo, CommandIO, SearchType } from './types';
import { SEARCH_TYPE, VAR_NOTATIONS } from '../../../config';
import { StorageDataManager, StorageKey } from '../../../managers/storage-data-manager';
import { GtaVersionManager } from '../../../managers/gta-version-manager';
import { WebViewManager } from '../../../managers/webview-manager';


export class CommandProcessor extends Singleton {
    private searchType: SearchType = SearchType.OPCODES;
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();
    private gtaVersionManager: GtaVersionManager = GtaVersionManager.getInstance();

    public setSearchType(rawSearchType: string): void {
        this.searchType = this.getNormalizedSearchType(rawSearchType);
    }

    public processCommands(): { commandInfo: CommandInfo, commandString: string }[] {
        const functionsList = this.getFunctionsList();
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

    public getFunctionsList(): any {
        const sb4FolderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;
        const functionsFilePath = path.join(
            sb4FolderPath,
            'data',
            this.gtaVersionManager.getIdentifier(),
            this.gtaVersionManager.getFunctionsFile()
        );

        return WebViewManager.readJsonFile(functionsFilePath);
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
        let commandString = `${commandInfo.id}: `;
        commandString += commandIO.output || '';
        commandString += commandInfo.name ?? '';
        commandString += ' ';
        commandString += commandIO.input ? `${commandIO.input}` : '';
    
        return commandString;
    }
    
    public formatClassCommandString(commandInfo: CommandInfo, commandIO: CommandIO): string {
        let commandString = commandIO.output || '';
        commandString += `${commandInfo.class}.${commandInfo.member}`;
        commandString += commandIO.input ? `${commandIO.input}` : '';
    
        return commandString;
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
    
        const formatted = input.map(arg => this.formatClassInputArg(arg)).join(', ');
        return `(${formatted})`;
    }
    
    private formatOpcodeInputArg(args: CommandArgs): string {
        const { name, type, source } = args;
        const formattedName = name ? `{${name}}` : '';
        const formattedType = type ? `[${type}]` : '';
        return [formattedName, formattedType, source].filter(Boolean).join(' ');
    }
    
    private formatClassInputArg(args: CommandArgs): string {
        return args.name || '';
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
        const { name = '', type = '', source = '' } = args;
        const normalizedSource = `${this.getNormalizedVar(source)} `;
        const formattedName = name.trim() ? `${name}: ` : '';
        return `[${normalizedSource}${formattedName}${type}]`;
    }
    
    private formatClassOutputArg(args: CommandArgs): string {
        const { name, type } = args;
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