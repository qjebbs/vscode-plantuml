import * as vscode from 'vscode';
import { Diagram, Diagrams } from './diagram'

export class Symbol implements vscode.DocumentSymbolProvider {
    register() {
        //register Symbol provider
        let ds: vscode.Disposable[] = [];
        let sel: vscode.DocumentSelector = "diagram";
        let d = vscode.languages.registerDocumentSymbolProvider(sel, this);
        ds.push(d);
        return ds;
    }
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {
        let results: vscode.SymbolInformation[] = [];

        let ds = new Diagrams().AddAll(document);
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