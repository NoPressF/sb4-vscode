import * as vscode from 'vscode';
import { Singleton } from '../../../src/singleton';

export class CompilerTools extends Singleton {
    public createFileLevelDiagnostics(errorMessage: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const regex = /error:\s(.+):(\d+)\s(.*)/g;
        const matches = [...errorMessage.matchAll(regex)];

        if (matches.length > 0) {
            const [, _, lineStr, message] = matches[0];
            const range = new vscode.Range(parseInt(lineStr, 10), 0, parseInt(lineStr, 10), Number.MAX_SAFE_INTEGER);
            diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error));
        } else {
            diagnostics.push(new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), errorMessage, vscode.DiagnosticSeverity.Error));
        }

        return diagnostics;
    }
}