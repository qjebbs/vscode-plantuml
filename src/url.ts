import * as vscode from 'vscode';
import { Diagram, Diagrams } from './diagram';
import { urlFormats } from './settings';
import { URLTextFrom } from './tools';


interface pURL {
    name: string;
    url: string;
}

export class URLMaker {
    constructor(public config: vscode.WorkspaceConfiguration, public context: vscode.ExtensionContext, public outputPanel: vscode.OutputChannel) {
    }
    register(): vscode.Disposable[] {
        function showError(error) {
            let err = error as TypeError;
            console.log(error);
            vscode.window.showErrorMessage(err.message);
        }
        //register url maker
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.URLCurrent', () => {
            try {
                this.makeDocumentURL(false);
            } catch (error) {
                showError(error);
            }
        });
        ds.push(d);
        d = vscode.commands.registerCommand('plantuml.URLDocument', () => {
            try {
                this.makeDocumentURL(true);
            } catch (error) {
                showError(error);
            }
        });
        ds.push(d);
        return ds;
    }
    private async makeDocumentURL(all: boolean) {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("No active document.");
            return;
        }

        let server = this.config.get("urlServer") as string;
        let format = this.config.get("urlFormat") as string;
        let resultFormat = this.config.get("urlResult") as string;
        if (!format) {
            format = await vscode.window.showQuickPick(urlFormats);
            if (!format) return;
        }
        let ds = new Diagrams();
        if (all) {
            ds.AddDocument();
            if (!ds.diagrams.length) {
                vscode.window.showWarningMessage("No valid diagram found!");
                return;
            }
        } else {
            let dg = new Diagram().GetCurrent();
            if (!dg.content) {
                vscode.window.showWarningMessage("No valid diagram found here!");
                return;
            }
            ds.Add(dg);
            editor.selections = [new vscode.Selection(dg.start, dg.end)];
        }
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let urls = this.makeURLs(ds.diagrams, server, format, bar)
        bar.dispose();

        this.outputPanel.clear();
        urls.map(url => {
            this.outputPanel.appendLine(url.name);
            if(resultFormat=="MarkDown"){
                this.outputPanel.appendLine(`\n![${url.name}](${url.url} "${url.name}")`);
            }else{
                this.outputPanel.appendLine(url.url);
            }
            this.outputPanel.appendLine("");
        });
        this.outputPanel.show();

        return urls;
    }
    private makeURL(diagram: Diagram, server: string, format: string, bar: vscode.StatusBarItem): pURL {
        if (bar) {
            bar.show();
            bar.text = "PlantUML Making URL: " + diagram.title + "." + format.split(":")[0];
        }
        let c = URLTextFrom(diagram.content);

        return <pURL>{ name: diagram.title, url: [server.replace(/^\/|\/$/g, ""), format, c].join("/") };
    }
    private makeURLs(diagrams: Diagram[], server: string, format: string, bar: vscode.StatusBarItem): pURL[] {
        return diagrams.map<pURL>((diagram: Diagram) => {
            return this.makeURL(diagram, server, format, bar);
        }, [])
    }
}