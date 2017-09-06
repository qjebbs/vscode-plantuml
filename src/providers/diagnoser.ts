import * as vscode from 'vscode';
import { Diagrams } from '../plantuml/diagram/diagram';
import { Uri } from 'vscode';
import { localize } from '../plantuml/common';

export class Diagnoser {

    constructor(ext: vscode.Extension<any>) {
        this.langID = ext.packageJSON.contributes.languages[0].id;
        this.extName = ext.packageJSON.name;
    }
    private DiagnosticCollection: vscode.DiagnosticCollection;
    private langID: string;
    private extName: string;
    register(): vscode.Disposable[] {
        let ds: vscode.Disposable[] = [];
        this.DiagnosticCollection = vscode.languages.createDiagnosticCollection(this.extName);
        ds.push(
            this.DiagnosticCollection,
            vscode.workspace.onDidOpenTextDocument(doc => this.diagnose(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.diagnose(e.document)),
            vscode.workspace.onDidCloseTextDocument(doc => this.removeDiagnose(doc)),
        );
        return ds;
    }
    diagnose(document: vscode.TextDocument) {
        if (document.languageId !== this.langID) return;
        let diagrams = new Diagrams().AddDocument(document);
        let diagnostics: vscode.Diagnostic[] = [];
        let names = {};
        diagrams.diagrams.map(d => {
            let range = document.lineAt(d.start.line).range;
            if (!d.titleRaw) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        range,
                        localize(30, null),
                        vscode.DiagnosticSeverity.Warning
                    )
                );
            }
            if (names[d.title]) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        range,
                        localize(31, null, d.title),
                        vscode.DiagnosticSeverity.Error
                    )
                );
            } else {
                names[d.title] = true;
            }
        });
        this.removeDiagnose(document);
        this.DiagnosticCollection.set(document.uri, diagnostics);
    }
    removeDiagnose(document: vscode.TextDocument) {
        this.DiagnosticCollection.delete(document.uri);
    }
}