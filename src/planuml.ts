import * as vscode from 'vscode';
import { Exporter } from './exporter';
import { Previewer } from './preview';

export class PlantUML {
    config: vscode.WorkspaceConfiguration;
    private previewer = new Previewer(true);
    private exporter = new Exporter(null);
    constructor(public context: vscode.ExtensionContext) {
        this.updateConfig();
    }
    updateConfig() {
        this.config = vscode.workspace.getConfiguration("plantuml");
        this.exporter.config=this.config;
        this.previewer.autoUpdate=this.config.get("autoUpdatePreview") as boolean
    }
    
    register(): vscode.Disposable[] {
        //register export
        let ds: vscode.Disposable[] = [];
        ds.push(...this.exporter.register());
        //register preview
        ds.push(...this.previewer.register());
        return ds;
    }
}