import * as vscode from 'vscode';

export const CompilerTools = {
    createFileLevelDiagnostics(errorMessage: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        const regex = /error:\s(.+):(\d+)\s(.*)/g;
        const matches = [...errorMessage.matchAll(regex)];

        if (matches.length > 0) {
            const [, _, lineStr, message] = matches[0];
            const lineNumber = parseInt(lineStr, 10);

            const range = new vscode.Range(lineNumber, 0, lineNumber, Number.MAX_SAFE_INTEGER);

            const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
            diagnostics.push(diagnostic);
        } else {
            const range = new vscode.Range(0, 0, 0, 0);
            const diagnostic = new vscode.Diagnostic(range, errorMessage, vscode.DiagnosticSeverity.Error);
            diagnostics.push(diagnostic);
        }

        return diagnostics;
    }
};