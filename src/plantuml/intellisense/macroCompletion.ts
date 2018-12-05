import * as vscode from 'vscode';
import { macrosOf } from './macros';

export async function MacroCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.CompletionItem[]> {
    return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
        const results: vscode.CompletionItem[] = [];
        const macros = macrosOf(document, position);
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