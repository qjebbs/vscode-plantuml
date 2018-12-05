import * as vscode from 'vscode';
import { macrosOf } from './macros';
import { Diagram } from '../diagram/diagram';
import { diagramAt } from '../diagram/tools';

const REG_VAR = /[0-9a-z_]+/ig;
const REG_EXCLUDE_PREPROCESS = /^\s*!.+/i;

export async function VariableCompletionItems(target: vscode.TextDocument | Diagram, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.CompletionItem[]> {
    return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
        let results = collectVariables(target, position, token)
            .map(variable => {
                const item = new vscode.CompletionItem(variable, vscode.CompletionItemKind.Variable);
                item.insertText = new vscode.SnippetString(variable);
                return item;
            });
        resolve(results);
    });
}

function collectVariables(target: vscode.TextDocument | Diagram, position: vscode.Position, token: vscode.CancellationToken): string[] {
    let variables = new Set<string>([]);
    let diagram = target instanceof Diagram ? target : diagramAt(target, position);
    let excludeLine = position.line - diagram.start.line;
    for (let i = 0; i < diagram.lines.length; i++) {
        if (i == excludeLine) continue;
        let line = diagram.lines[i];
        if (REG_EXCLUDE_PREPROCESS.test(line)) continue;

        REG_VAR.lastIndex = 0;
        let matches: RegExpExecArray;
        while (matches = REG_VAR.exec(line)) {
            variables.add(matches[0]);
        }
    }
    return Array.from(variables);
}
