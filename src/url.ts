import * as vscode from 'vscode';
import * as nls from "vscode-nls";

import { Diagram, Diagrams } from './diagram';
import { config } from './config';
import { outputPanel, context, localize } from './planuml';
import { URLTextFrom } from './tools';


interface pURL {
    name: string;
    url: string;
}
class URLMaker {
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
            vscode.window.showWarningMessage(localize(14, null));
            return;
        }

        let format = config.urlFormat;
        if (!format) {
            format = await vscode.window.showQuickPick(config.urlFormats);
            if (!format) return;
        }
        let ds = new Diagrams();
        if (all) {
            ds.AddDocument();
            if (!ds.diagrams.length) {
                vscode.window.showWarningMessage(localize(15, null));
                return;
            }
        } else {
            let dg = new Diagram().GetCurrent();
            if (!dg.content) {
                vscode.window.showWarningMessage(localize(3, null));
                return;
            }
            ds.Add(dg);
            editor.selections = [new vscode.Selection(dg.start, dg.end)];
        }
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let urls = this.makeURLs(ds.diagrams, config.urlServer, format, bar)
        bar.dispose();

        outputPanel.clear();
        urls.map(url => {
            outputPanel.appendLine(url.name);
            if (config.urlResult == "MarkDown") {
                outputPanel.appendLine(`\n![${url.name}](${url.url} "${url.name}")`);
            } else {
                outputPanel.appendLine(url.url);
            }
            outputPanel.appendLine("");
        });
        outputPanel.show();

        return urls;
    }
    private makeURL(diagram: Diagram, server: string, format: string, bar: vscode.StatusBarItem): pURL {
        if (bar) {
            bar.show();
            bar.text = localize(16, null, diagram.title);
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
export const urlMaker = new URLMaker();