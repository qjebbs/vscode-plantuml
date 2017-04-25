import * as vscode from 'vscode';
import { Diagrams } from './diagram'

class Symbol implements vscode.DocumentSymbolProvider {
    register() {
        //register Symbol provider
        let ds: vscode.Disposable[] = [];
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
        let d = vscode.languages.registerDocumentSymbolProvider(sel, this);
        ds.push(d);
        return ds;
    }
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {
        let results: vscode.SymbolInformation[] = [];

        let ds = new Diagrams().AddDocument(document);
        for (let d of ds.diagrams) {
            results.push(
                new vscode.SymbolInformation(
                    d.title,
                    vscode.SymbolKind.Object,
                    new vscode.Range(d.start, d.end),
                    document.uri, ""
                )
            );
        }
        return results;
    }
}
export const symboler = new Symbol();