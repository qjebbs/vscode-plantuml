import * as vscode from 'vscode';
import { diagramsOf } from '../plantuml/diagram/tools';
import { Uri } from 'vscode';
import { localize } from '../plantuml/common';
import { config } from '../plantuml/config';

export class Diagnoser extends vscode.Disposable {
    private _disposables: vscode.Disposable[] = [];
    private DiagnosticCollection: vscode.DiagnosticCollection;
    private langID: string;
    private extName: string;

    constructor(ext: vscode.Extension<any>) {
        super(() => this.dispose());
        this.langID = ext.packageJSON.contributes.languages[0].id;
        this.extName = ext.packageJSON.name;
        this.DiagnosticCollection = vscode.languages.createDiagnosticCollection(this.extName);
        this._disposables.push(
            this.DiagnosticCollection,
            vscode.workspace.onDidOpenTextDocument(doc => this.diagnose(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.diagnose(e.document)),
            vscode.workspace.onDidCloseTextDocument(doc => this.removeDiagnose(doc)),
        );
    }

    dispose() {
        this._disposables && this._disposables.length && this._disposables.map(d => d.dispose());
    }

    diagnose(document: vscode.TextDocument) {
        if (document.languageId !== this.langID) return;
        let diagrams = diagramsOf(document);
        let diagnostics: vscode.Diagnostic[] = [];
        let names = {};
        diagrams.map(d => {
            let range = document.lineAt(d.start.line).range;
            if (config.lintDiagramNoName(d.parentUri) && !d.nameRaw) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        range,
                        localize(30, null),
                        vscode.DiagnosticSeverity.Warning
                    )
                );
            }
            if (names[d.name]) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        range,
                        localize(31, null, d.name),
                        vscode.DiagnosticSeverity.Error
                    )
                );
            } else {
                names[d.name] = true;
            }
        });
        this.removeDiagnose(document);
        this.DiagnosticCollection.set(document.uri, diagnostics);
    }
    removeDiagnose(document: vscode.TextDocument) {
        this.DiagnosticCollection.delete(document.uri);
    }
}