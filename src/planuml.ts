import * as vscode from 'vscode';
import { Exporter } from './exporter';
import { Previewer } from './previewer';
import { Builder } from "./builder";
import { Symbol } from "./symboler";
import { URLMaker } from "./url";

export class PlantUML {
    private config: vscode.WorkspaceConfiguration;
    private previewer: Previewer;
    private exporter: Exporter;
    private builder: Builder;
    private symboler: Symbol;
    private URLMaker: URLMaker;
    private outputPanel: vscode.OutputChannel;
    constructor(public context: vscode.ExtensionContext) {
        this.outputPanel = vscode.window.createOutputChannel("PlantUML");
        this.exporter = new Exporter(this.config, this.context, this.outputPanel);
        this.previewer = new Previewer(this.config, this.context, this.exporter);
        this.builder = new Builder(this.config, this.context, this.exporter, this.outputPanel);
        this.URLMaker = new URLMaker(this.config, this.context, this.outputPanel);
        this.symboler = new Symbol();
        this.updateConfig();
    }
    updateConfig() {
        this.config = vscode.workspace.getConfiguration("plantuml");
        this.exporter.config = this.config;
        this.URLMaker.config = this.config;
        this.previewer.config = this.config;
        this.builder.config = this.config;
    }

    activate(): vscode.Disposable[] {
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
            //register builder
            ds.push(...this.builder.register());
            //register symbol provider
            ds.push(...this.symboler.register());
            //register server
            ds.push(...this.URLMaker.register());
            return ds;
        } catch (error) {
            this.outputPanel.clear()
            this.outputPanel.append(error);
        }
    }
    deactivate() {
        this.previewer.stopWatch();
        this.outputPanel.dispose();
    }
}