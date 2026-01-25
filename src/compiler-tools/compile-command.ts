import { CommandBase, ExecuteType } from './command-base';

export class CompileCommand extends CommandBase {
    protected executeType: ExecuteType = ExecuteType.COMPILE;
}