import * as vscode from 'vscode';
import * as path from 'path';

import { appliedRender } from './appliedRender'
import { Diagram, Diagrams } from '../diagram/diagram';
import { config } from '../config';
import { outputPanel, localize, bar } from '../common';
import { showMessagePanel, StopWatch } from '../tools';
import { exportDiagrams } from './exportDiagrams';

export async function exportDocument(all: boolean) {
    try {
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
            format = await vscode.window.showQuickPick(appliedRender().formats());
            if (!format) return;
        }
        outputPanel.clear();
        let ds = new Diagrams();
        if (all) {
            ds.AddDocument();
            if (!ds.diagrams.length) {
                vscode.window.showInformationMessage(localize(2, null));
                return;
            }
        } else {
            let dg = new Diagram().GetCurrent();
            if (!dg.content) {
                vscode.window.showInformationMessage(localize(3, null));
                return;
            }
            ds.Add(dg);
            editor.selections = [new vscode.Selection(dg.start, dg.end)];
        }
        exportDiagrams(ds.diagrams, format, bar).then(
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
                    outputPanel,
                    localize(27, null, ds.diagrams.length, fileCnt, stopWatch.runTime() / 1000) + fileLst
                );
            },
            error => {
                bar.hide();
                showMessagePanel(outputPanel, error);
            }
        );
    } catch (error) {
        showMessagePanel(outputPanel, error);
    }
    return;
}