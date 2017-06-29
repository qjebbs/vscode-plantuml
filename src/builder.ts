import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { exporter } from './exporter/exporter';
import { ExportError } from './exporter/interfaces'
import { Diagram } from './diagram';
import { config } from './config';
import { outputPanel, context, localize } from './planuml';
import { showMessagePanel, parseError, StopWatch } from './tools';

class Builder {
    register(): vscode.Disposable[] {
        //register export
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.exportWorkspace', (fileUri) => {
            this.build(fileUri);
        });
        ds.push(d);
        return ds;
    }
    build(uri: vscode.Uri);
    build(uris: vscode.Uri[]);
    async build(para) {
        try {
            if (!vscode.workspace.rootPath) { return; }
            let format = config.exportFormat;
            if (!format) {
                format = await vscode.window.showQuickPick(exporter.formats());
                if (!format) return;
            }
            outputPanel.clear();
            let exts = config.fileExtensions;
            if (!para) {
                this.doBuild(await vscode.workspace.findFiles(`**/*${exts}`, ""), format);
            } else if (para instanceof vscode.Uri) {
                //commnad from the explorer/context
                if (fs.statSync(para.fsPath).isDirectory()) {
                    let relPath = path.relative(vscode.workspace.rootPath, para.fsPath);
                    this.doBuild(await vscode.workspace.findFiles(`${relPath}/**/*${exts}`, ""), format);
                } else {
                    this.doBuild([para], format);
                }
            } else if (para instanceof Array) {
                //FIXME: directory uri(s) in array
                let uris: vscode.Uri[] = [];
                for (let p of para) {
                    if (p instanceof vscode.Uri) {
                        uris.push(p);
                    }
                }
                this.doBuild(uris, format);
            }
        } catch (error) {
            showMessagePanel(outputPanel, error);
        }
    }
    private doBuild(uris: vscode.Uri[], format: string) {
        if (!uris.length) {
            vscode.window.showInformationMessage(localize(8, null));
            return;
        }
        let stopWatch = new StopWatch();
        stopWatch.start();
        let concurrency = config.exportConcurrency;
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let errors: ExportError[] = [];
        let results: Buffer[][][] = [];
        uris.reduce((prev: Promise<Buffer[][]>, uri: vscode.Uri, index: number) => {
            return prev.then(
                result => {
                    if (result && result.length)
                        results.push(result);
                    return exporter.exportURI(uri, format, concurrency, bar);
                },
                error => {
                    errors.push(...parseError(localize(11, null, error.length, uris[index - 1].fsPath)))
                    errors.push(...parseError(error));
                    // continue next file
                    return exporter.exportURI(uri, format, concurrency, bar);
                });
        }, Promise.resolve([])).then(
            async result => {
                stopWatch.stop();
                //push last exported document result
                if (result && result.length)
                    results.push(result);
                bar.dispose();
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
            },
            error => {
                bar.dispose();
                errors.push(...parseError(localize(11, null, error.length, uris[uris.length - 1].fsPath)));
                errors.push(...parseError(error));
                if (uris.length) {
                    vscode.window.showInformationMessage(localize(12, null, uris.length));
                    showMessagePanel(outputPanel, errors);
                }
            }
            );
    }
}
export const builder = new Builder();