import { Singleton } from '@utils';
import * as vscode from 'vscode';

export class BaseProvider extends Singleton {
	public context!: vscode.ExtensionContext;

	public init(context: vscode.ExtensionContext) {
		this.context = context;
		return this;
	}
}