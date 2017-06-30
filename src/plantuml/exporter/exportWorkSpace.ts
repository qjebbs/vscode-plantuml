import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { appliedRender } from './appliedRender'
import { RenderError } from '../renders/interfaces'
import { Diagram } from '../diagram/diagram';
import { config } from '../config';
import { outputPanel, context, localize, bar } from '../common';
import { showMessagePanel, parseError, StopWatch } from '../tools';
import { exportURIs, exportURIsResult } from './exportURIs';

export function exportWorkSpace(uri: vscode.Uri);
export function exportWorkSpace(uris: vscode.Uri[]);
export async function exportWorkSpace(para) {
    try {
        if (!vscode.workspace.rootPath) { return; }
        let format = config.exportFormat;
        if (!format) {
            format = await vscode.window.showQuickPick(appliedRender().formats());
            if (!format) return;
        }
        outputPanel.clear();
        let exts = config.fileExtensions;
        if (!para) {
            doBuild(await vscode.workspace.findFiles(`**/*${exts}`, ""), format);
        } else if (para instanceof vscode.Uri) {
            //commnad from the explorer/context
            if (fs.statSync(para.fsPath).isDirectory()) {
                let relPath = path.relative(vscode.workspace.rootPath, para.fsPath);
                doBuild(await vscode.workspace.findFiles(`${relPath}/**/*${exts}`, ""), format);
            } else {
                doBuild([para], format);
            }
        } else if (para instanceof Array) {
            //FIXME: directory uri(s) in array
            let uris: vscode.Uri[] = [];
            for (let p of para) {
                if (p instanceof vscode.Uri) {
                    uris.push(p);
                }
            }
            doBuild(uris, format);
        }
    } catch (error) {
        showMessagePanel(outputPanel, error);
    }
}
function doBuild(uris: vscode.Uri[], format: string) {
    if (!uris.length) {
        vscode.window.showInformationMessage(localize(8, null));
        return;
    }
    let stopWatch = new StopWatch();
    stopWatch.start();

    exportURIs(uris, format, bar).then(
        async r => {
            stopWatch.stop();
            r = r as exportURIsResult;
            let results = r.results;
            let errors = r.errors;
            bar.hide();
            //uris.length: found documents count 
            //results.length: exported documents count 
            if (!results.length) {
                vscode.window.showInformationMessage(localize(29, null));
                return;
            }
            let viewReport = localize(26, null);
            let msg = "";
            if (errors.length) {
                msg = localize(12, null, results.length);
            } else {
                msg = localize(13, null, results.length);
            }
            let btn = await vscode.window.showInformationMessage(msg, viewReport);
            if (btn !== viewReport) return;
            let fileCnt = 0;
            let diagramCnt = 0;
            let fileLst = results.reduce((list, diagrams) => {
                if (!diagrams || !diagrams.length) return list;
                diagramCnt += diagrams.length;
                return list + diagrams.reduce((oneDiagramList, files) => {
                    if (!files || !files.length) return oneDiagramList;
                    fileCnt += files.length;
                    return oneDiagramList + "\n" + files.join("\n");
                }, "");
            }, "");
            let report = localize(28, null, results.length, diagramCnt, fileCnt, stopWatch.runTime() / 1000) + fileLst;
            if (errors.length) {
                report = errors.reduce((p, c) => {
                    return p + (p ? "\n" : "") + c.error;
                }, "") + "\n\n" + report;
            }
            showMessagePanel(outputPanel, report);
        }
    );
}