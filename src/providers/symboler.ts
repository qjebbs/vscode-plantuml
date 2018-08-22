import * as vscode from 'vscode';
import { diagramsOf } from '../plantuml/diagram/diagram'

export class Symbol extends vscode.Disposable implements vscode.DocumentSymbolProvider {
    private _disposables: vscode.Disposable[] = [];

    constructor() {
        super(() => this.dispose());
        let sel: vscode.DocumentSelector = [
            "diagram",
            "markdown",
            "c",
            "csharp",
            "cpp",
            "clojure",
            "coffeescript",
            "fsharp",
            "go",
            "groovy",
            "java",
            "javascript",
            "javascriptreact",
            "lua",
            "objective-c",
            "objective-cpp",
            "php",
            "perl",
            "perl6",
            "python",
            "ruby",
            "rust",
            "swift",
            "typescript",
            "typescriptreact",
            "vb",
            "plaintext"
        ];
        this._disposables.push(
            vscode.languages.registerDocumentSymbolProvider(sel, this)
        );
    }

    dispose() {
        this._disposables && this._disposables.length && this._disposables.map(d => d.dispose());
    }
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {
        let results: vscode.SymbolInformation[] = [];

        let diagrams = diagramsOf(document);
        for (let d of diagrams) {
            const location = new vscode.Location(document.uri, new vscode.Range(d.start, d.end));
            results.push(
                new vscode.SymbolInformation(
                    d.title,
                    vscode.SymbolKind.Object,
                    "",
                    location
                )
            );
        }
        return results;
    }
}