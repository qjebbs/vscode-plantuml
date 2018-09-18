import * as vscode from 'vscode';
import { SnippetString } from 'vscode';
import { macrosOf } from '../plantuml/macros/macros'

export class Completion extends vscode.Disposable implements vscode.CompletionItemProvider {
    private _disposables: vscode.Disposable[] = [];

    constructor() {
        super(() => this.dispose());
        let sel: vscode.DocumentSelector = [
            "diagram"
        ];
        this._disposables.push(
            vscode.languages.registerCompletionItemProvider(sel, this)
        );
    }

    dispose() {
        this._disposables && this._disposables.length && this._disposables.map(d => d.dispose());
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
        : Thenable<vscode.CompletionItem[]> {
        return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
            const results: vscode.CompletionItem[] = [];

            const macros = macrosOf(document);
            macros
                .forEach(macro => {
                    const item = new vscode.CompletionItem(macro.name, vscode.CompletionItemKind.Method);
                    item.detail = macro.getDetailLabel();
                    item.insertText = new SnippetString(macro.name);
                    results.push(item);
                });

            return resolve(results);
        });
    }

    resolveCompletionItem?(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
        // TODO: add item.documentation
        return null;
    }
}

