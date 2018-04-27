import * as vscode from 'vscode';
import * as nls from "vscode-nls";

import { Diagram, diagramsOf } from '../diagram/diagram';
import { config } from '../config';
import { outputPanel, context, localize, bar } from '../common';
import { plantumlServer } from '../renders/plantumlServer';

interface pURL {
    name: string;
    url: string;
}

export async function makeDocumentURL(all: boolean) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage(localize(14, null));
        return;
    }

    let format = config.urlFormat;
    if (!format) {
        format = await vscode.window.showQuickPick(plantumlServer.formats());
        if (!format) return;
    }
    let diagrams: Diagram[] = [];
    if (all) {
        diagrams = diagramsOf(editor.document);
        if (!diagrams.length) {
            vscode.window.showWarningMessage(localize(15, null));
            return;
        }
    } else {
        let dg = new Diagram().GetCurrent();
        if (!dg.content) {
            vscode.window.showWarningMessage(localize(3, null));
            return;
        }
        diagrams.push(dg);
        editor.selections = [new vscode.Selection(dg.start, dg.end)];
    }
    let urls = makeURLs(diagrams, config.server, format, bar)
    bar.hide();

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
function makeURLs(diagrams: Diagram[], server: string, format: string, bar: vscode.StatusBarItem): pURL[] {
    return diagrams.map<pURL>((diagram: Diagram) => {
        return makeURL(diagram, server, format, bar);
    })
}
function makeURL(diagram: Diagram, server: string, format: string, bar: vscode.StatusBarItem): pURL {
    if (bar) {
        bar.show();
        bar.text = localize(16, null, diagram.title);
    }
    return <pURL>{ name: diagram.title, url: plantumlServer.makeURL(diagram, format) };
}