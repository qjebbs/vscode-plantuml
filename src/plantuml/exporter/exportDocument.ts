import * as vscode from 'vscode';
import * as path from 'path';

import { appliedRender } from './appliedRender'
import { Diagram } from '../diagram/diagram';
import { currentDiagram, diagramsOf } from '../diagram/tools';
import { config } from '../config';
import { localize, bar } from '../common';
import { showMessagePanel, StopWatch } from '../tools';
import { exportDiagrams } from './exportDiagrams';

export async function exportDocument(all: boolean) {
    let stopWatch = new StopWatch();
    stopWatch.start();
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage(localize(0, null));
        return;
    }
    if (!path.isAbsolute(editor.document.fileName)) {
        vscode.window.showInformationMessage(localize(1, null));
        return;
    };
    let format = config.exportFormat(editor.document.uri);
    if (!format) {
        format = await vscode.window.showQuickPick(appliedRender(editor.document.uri).formats());
        if (!format) return;
    }
    let diagrams: Diagram[] = [];
    if (all) {
        diagrams = diagramsOf(editor.document);
        if (!diagrams.length) {
            vscode.window.showInformationMessage(localize(2, null));
            return;
        }
    } else {
        let dg = currentDiagram();
        if (!dg) {
            vscode.window.showInformationMessage(localize(3, null));
            return;
        }
        diagrams.push(dg);
        editor.selections = [new vscode.Selection(dg.start, dg.end)];
    }
    exportDiagrams(diagrams, format, bar).then(
        async results => {
            stopWatch.stop();
            bar.hide();
            if (!results.length) return;
            let viewReport = localize(26, null);
            let btn = await vscode.window.showInformationMessage(localize(4, null), viewReport);
            if (btn !== viewReport) return;
            let fileCnt = 0;
            let fileLst = results.reduce((prev, files) => {
                let filtered = files.filter(v => !!v.length);
                fileCnt += filtered.length;
                return prev + "\n" + filtered.join("\n");
            }, "");
            showMessagePanel(
                localize(27, null, diagrams.length, fileCnt, stopWatch.runTime() / 1000) + fileLst
            );
        },
        error => {
            bar.hide();
            showMessagePanel(error);
        }
    );
    return;
}