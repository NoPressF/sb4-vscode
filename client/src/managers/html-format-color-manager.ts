import { Singleton } from '@shared';

export class HtmlFormatColorManager extends Singleton {
	public getOpcodeAddress(opcode: string | undefined): string {
		return `<span class="opcode-address">${opcode}</span>`;
	}

	public getOpcodeName(name: string | undefined): string {
		return `<span class="opcode-name">${name}</span>`;
	}

	public getOpcodeReturnVarType(returnVar: string | undefined): string {
		return `<span class="opcode-return-var-type">${returnVar}</span>`;
	}

	public getOpcodeArgName(argName: string | undefined): string {
		return `<span class="opcode-param-name">${argName}</span>`;
	}

	public getOpcodeArgType(argType: string | undefined): string {
		return `<span class="opcode-param-type">${argType}</span>`;
	}

	public getOpcodeClassName(className: string | undefined): string {
		return `<span class="opcode-class-name">${className}</span>`;
	}
}