import * as vscode from 'vscode';
import { StorageDataManager, StorageKey } from '@shared';
import { Singleton } from '@shared';
import { ClassCompletionProvider } from './completion';
import { ClassHoverProvider } from './hover';
import { CommandProcessor } from '../../search/opcodes/command-processor';
import { CommandInfo } from '../../search/opcodes/types';

export type ClassInfo = {
    members: Map<string, string>
};

export class Class extends Singleton {
    private storageDataManager: StorageDataManager = StorageDataManager.getInstance();
    private commandProcessor: CommandProcessor = CommandProcessor.getInstance();
    private classes = new Map<string, ClassInfo>();

    public init() {
        this.loadClasses();
    }

    public getClassInfo(className: string): ClassInfo | undefined {
        return this.classes.get(className);
    }

    public getMemberSignature(className: string, member: string): string | undefined {
        const classInfo = this.classes.get(className);
        return classInfo?.members.get(member);
    }

    public loadClasses() {
        const sb4FolderPath = this.storageDataManager.getStorageData(StorageKey.Sb4FolderPath) as string;
        if (!sb4FolderPath) {
            return;
        }

        this.parseClassesAndMethods();
    }

    private parseClassesAndMethods(): void {
        const functionsList = this.commandProcessor.getFunctionsList();

        for (const extension of functionsList.extensions) {
            for (const command of extension.commands) {
                const commandInfo: CommandInfo = { class: command.class, member: command.member };

                if (!commandInfo.class || !commandInfo.member) {
                    continue;
                }

                if (!command.input && !command.output) {
                    continue;
                }

                const commandIO = this.commandProcessor.processClassCommandArgs(command.input, command.output);
                const commandString = this.commandProcessor.formatClassCommandString(commandInfo, commandIO);

                this.updateClassInfo(commandInfo.class, commandInfo.member, commandString);
            }
        }
    }

    private updateClassInfo(className: string, member: string, signature: string): void {
        if (this.classes.has(className)) {
            const classInfo = this.classes.get(className)!;
            classInfo.members.set(member, signature);
        } else {
            const membersMap = new Map<string, string>();
            membersMap.set(member, signature);
            this.classes.set(className, { members: membersMap });
        }
    }
}

export const registerClassProviders = (context: vscode.ExtensionContext) => {
    const classInstance = Class.getInstance();
    const classCompletionProvider = ClassCompletionProvider.getInstance();
    const classHoverProvider = ClassHoverProvider.getInstance();

    classInstance.init();
    classCompletionProvider.init(context);
    classHoverProvider.init(context);
};
