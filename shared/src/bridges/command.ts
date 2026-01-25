import { Command } from '@shared';

export const CommandGetClassesMembersMethod = 'sb4/command/get-classes-members' as const;
export const CommandGetOpcodesMethod = 'sb4/command/get-opcodes' as const;

export type CommandGetResult = Record<string, Command[]>;