import * as vscode from 'vscode';
import * as path from 'path';
import { Exporter } from './exporter';
import { Diagram, Diagrams } from './diagram';

interface format {
    label: string;
    format: string;
}
export class PlantUML {
    context: vscode.ExtensionContext;
    config: vscode.WorkspaceConfiguration;
    constructor(context: vscode.ExtensionContext) {
        this.context = context
        this.updateConfig();
    }
    updateConfig() {
        this.config = vscode.workspace.getConfiguration("plantuml");
    }
    export(all: boolean) {
        let editor = vscode.window.activeTextEditor;
        let outputDefaultPath = path.dirname(editor.document.uri.fsPath);
        let diagrams = new Diagrams();
        if (all) {
            diagrams.AddAll();
        } else {
            let dg = new Diagram().GetCurrent();
            diagrams.Add(new Diagram().GetCurrent());
            editor.selections = [new vscode.Selection(dg.start, dg.end)];
        }
        let bar=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        return new Exporter(this.config, diagrams).execute(bar)
        .then(
            msgs => {
                vscode.window.showInformationMessage("Export finish.");
                bar.dispose();
            },
            msg => {
                let m = msg as string
                vscode.window.showErrorMessage(m.replace(/\n/g, " "));
                bar.dispose();
            }
        );
    }
    register(): vscode.Disposable[] {
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.export', () => {
            this.export(false);
        });
        ds.push(d);
        d = vscode.commands.registerCommand('plantuml.exportAll', () => {
            this.export(true);
        });
        ds.push(d);
        return ds;
    }
}