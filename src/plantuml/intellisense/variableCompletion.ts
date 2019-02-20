import * as vscode from 'vscode';
import { macrosOf } from './macros';
import { Diagram } from '../diagram/diagram';
import { diagramAt } from '../diagram/tools';
import { dicLanguageWords } from './languageCompletion';

const REG_VAR = /[0-9a-z_]+/ig;
const REG_EXCLUDE_LINE = /^\s*(!|@)/i;
// const REG_REMOVE_INLINE_NOTE = /:.+$/i;
// const REG_ENTER_NOTE = /^\s*([rh]?note)(?:\s+(right|left|top|bottom))?(\s+(?:of|over))?[^:]+$/i;
// const REG_LEAVE_NOTE = /^\s*(end\s*[rh]?note)/i

export async function VariableCompletionItems(target: vscode.TextDocument | Diagram, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.CompletionItem[]> {
    if (!target) return [];
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
    // let flagNote = false;
    for (let i = 0; i < diagram.lines.length; i++) {
        if (i == excludeLine) continue;
        let line = diagram.lines[i];
        if (REG_EXCLUDE_LINE.test(line)) continue;

        // if (flagNote) {
        //     // currently in a note block
        //     flagNote = !REG_LEAVE_NOTE.test(line);
        //     continue;
        // }
        // flagNote = REG_ENTER_NOTE.test(line);

        // // FIXME: 
        // // Will remove none-note part if the line like:
        // // :Alice: -> :Bob:: notes
        // line = line.replace(REG_REMOVE_INLINE_NOTE, "");
        let matches: RegExpExecArray;
        REG_VAR.lastIndex = 0;
        while (matches = REG_VAR.exec(line)) {
           if (!dicLanguageWords.has(matches[0])) variables.add(matches[0]);
        }
    }
    return Array.from(variables);
}
