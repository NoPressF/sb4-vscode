import { BaseCommand, ExecuteType } from './base-command';

export class DecompileCommand extends BaseCommand {
    protected executeType: ExecuteType = ExecuteType.DECOMPILE;
}