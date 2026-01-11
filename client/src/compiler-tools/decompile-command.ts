import { CommandBase, ExecuteType } from './command-base';

export class DecompileCommand extends CommandBase {
    protected executeType: ExecuteType = ExecuteType.DECOMPILE;
}