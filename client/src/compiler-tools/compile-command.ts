import { BaseCommand, ExecuteType } from './base-command';

export class CompileCommand extends BaseCommand {
    protected executeType: ExecuteType = ExecuteType.COMPILE;
}