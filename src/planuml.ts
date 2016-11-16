import * as vscode from 'vscode';
import { Exporter } from './exporter';
import { Previewer } from './preview';

export class PlantUML {
    config: vscode.WorkspaceConfiguration;
    private previewer: Previewer;
    private exporter: Exporter;
    constructor(public context: vscode.ExtensionContext) {
        this.exporter = new Exporter(this.config, this.context);
        this.previewer = new Previewer(this.exporter, true)
        this.updateConfig();
    }
    updateConfig() {
        this.config = vscode.workspace.getConfiguration("plantuml");
        this.exporter.config = this.config;
        this.previewer.autoUpdate = this.config.get("autoUpdatePreview") as boolean
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
            return ds;
        } catch (error) {
            console.log(error);
        }

    }
}