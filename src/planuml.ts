import * as vscode from 'vscode';
import { Exporter } from './exporter';
import { Previewer } from './preview';
import { Symbol } from "./symbol";

export class PlantUML {
    config: vscode.WorkspaceConfiguration;
    private previewer: Previewer;
    private exporter: Exporter;
    private symboler: Symbol;
    constructor(public context: vscode.ExtensionContext) {
        this.exporter = new Exporter(this.config, this.context);
        this.previewer = new Previewer(this.config, this.context, this.exporter)
        this.symboler=new Symbol();
        this.updateConfig();
    }
    updateConfig() {
        this.config = vscode.workspace.getConfiguration("plantuml");
        this.exporter.config = this.config;
        this.previewer.config = this.config;
    }

    register(): vscode.Disposable[] {
        try {
            let ds: vscode.Disposable[] = [];
            ds.push(
                vscode.workspace.onDidChangeConfiguration(() => {
                    this.updateConfig();
                })
            );
            //register export
            ds.push(...this.exporter.register());
            //register preview
            ds.push(...this.previewer.register());
            //register symbol provider
            ds.push(...this.symboler.register());
            return ds;
        } catch (error) {
            console.log(error);
        }

    }
}