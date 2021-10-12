import * as vscode from 'vscode';
import { diagramsOf } from '../plantuml/diagram/tools'
import { languageid } from '../plantuml/common';

export class Symbol extends vscode.Disposable implements vscode.DocumentSymbolProvider {
    private _disposables: vscode.Disposable[] = [];

    constructor() {
        super(() => this.dispose());
        let sel: vscode.DocumentSelector = [
            { scheme: 'file', language: languageid },
            { scheme: 'file', language: 'markdown' },
            { scheme: 'file', language: 'c' },
            { scheme: 'file', language: 'csharp' },
            { scheme: 'file', language: 'cpp' },
            { scheme: 'file', language: 'clojure' },
            { scheme: 'file', language: 'coffeescript' },
            { scheme: 'file', language: 'fsharp' },
            { scheme: 'file', language: 'go' },
            { scheme: 'file', language: 'groovy' },
            { scheme: 'file', language: 'java' },
            { scheme: 'file', language: 'javascript' },
            { scheme: 'file', language: 'javascriptreact' },
            { scheme: 'file', language: 'lua' },
            { scheme: 'file', language: 'objective-c' },
            { scheme: 'file', language: 'objective-cpp' },
            { scheme: 'file', language: 'php' },
            { scheme: 'file', language: 'perl' },
            { scheme: 'file', language: 'perl6' },
            { scheme: 'file', language: 'python' },
            { scheme: 'file', language: 'ruby' },
            { scheme: 'file', language: 'rust' },
            { scheme: 'file', language: 'swift' },
            { scheme: 'file', language: 'typescript' },
            { scheme: 'file', language: 'typescriptreact' },
            { scheme: 'file', language: 'vb' },
            { scheme: 'file', language: 'plaintext' },
            { scheme: 'untitled', language: languageid },
            { scheme: 'untitled', language: 'markdown' },
            { scheme: 'untitled', language: 'c' },
            { scheme: 'untitled', language: 'csharp' },
            { scheme: 'untitled', language: 'cpp' },
            { scheme: 'untitled', language: 'clojure' },
            { scheme: 'untitled', language: 'coffeescript' },
            { scheme: 'untitled', language: 'fsharp' },
            { scheme: 'untitled', language: 'go' },
            { scheme: 'untitled', language: 'groovy' },
            { scheme: 'untitled', language: 'java' },
            { scheme: 'untitled', language: 'javascript' },
            { scheme: 'untitled', language: 'javascriptreact' },
            { scheme: 'untitled', language: 'lua' },
            { scheme: 'untitled', language: 'objective-c' },
            { scheme: 'untitled', language: 'objective-cpp' },
            { scheme: 'untitled', language: 'php' },
            { scheme: 'untitled', language: 'perl' },
            { scheme: 'untitled', language: 'perl6' },
            { scheme: 'untitled', language: 'python' },
            { scheme: 'untitled', language: 'ruby' },
            { scheme: 'untitled', language: 'rust' },
            { scheme: 'untitled', language: 'swift' },
            { scheme: 'untitled', language: 'typescript' },
            { scheme: 'untitled', language: 'typescriptreact' },
            { scheme: 'untitled', language: 'vb' },
            { scheme: 'untitled', language: 'plaintext' },
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
                    d.name,
                    vscode.SymbolKind.Object,
                    "",
                    location
                )
            );
        }
        return results;
    }
}