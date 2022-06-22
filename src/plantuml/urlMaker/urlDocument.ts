import * as vscode from 'vscode';

import { Diagram } from '../diagram/diagram';
import { diagramsOf, currentDiagram } from '../diagram/tools';
import { config } from '../config';
import { outputPanel, localize, bar } from '../common';
import { plantumlServer } from '../renders/plantumlServer';
import { MakeDiagramsURL } from './urlMaker';

export async function makeDocumentURL(all: boolean) {
    if (!config.server(vscode.window.activeTextEditor.document.uri)) {
        vscode.window.showWarningMessage(localize(53, null));
        return;
    }
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
        let dg = currentDiagram();
        if (!dg) {
            vscode.window.showWarningMessage(localize(3, null));
            return;
        }
        diagrams.push(dg);
        editor.selections = [new vscode.Selection(dg.start, dg.end)];
    }
    let results = MakeDiagramsURL(diagrams, format, bar)
    bar.hide();

    outputPanel.clear();
    results.map(result => {
        outputPanel.appendLine(result.name);
        if (config.urlResult == "MarkDown") {
            result.urls.forEach(url => {
                outputPanel.appendLine(`\n![${result.name}](${url} "${result.name}")`);
            });
        } else {
            result.urls.forEach(url => {
                outputPanel.appendLine(url);
            });
        }
        outputPanel.appendLine("");
    });
    outputPanel.show();
}