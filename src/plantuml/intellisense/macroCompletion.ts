import * as vscode from 'vscode';
import { macrosOf } from './macros';
import { Diagram } from '../diagram/diagram';

export async function MacroCompletionItems(target: vscode.TextDocument | Diagram, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.CompletionItem[]> {
    if (!target) return [];
    return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
        const results: vscode.CompletionItem[] = [];
        const macros = macrosOf(target, position);
        macros
            .forEach(macro => {
                const item = new vscode.CompletionItem(macro.name, vscode.CompletionItemKind.Method);
                item.detail = macro.getDetailLabel();
                item.insertText = new vscode.SnippetString(macro.name);
                results.push(item);
            });

        return resolve(results);
    });
}