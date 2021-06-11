import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { appliedRender } from './appliedRender'
import { config } from '../config';
import { localize, bar } from '../common';
import { showMessagePanel, parseError, StopWatch, isSubPath } from '../tools';
import { exportFiles, exportFilesResult } from './exportURIs';
import { FileAndFormat } from './exportURI';

export function exportWorkSpace(uri: vscode.Uri);
export function exportWorkSpace(target: vscode.Uri, all: vscode.Uri[]);
export async function exportWorkSpace(...para: any[]) {

    if (!vscode.workspace.workspaceFolders) { return; }

    let files: FileAndFormat[]
    if (para.length == 1) {
        files = await getFileList(para[0] as vscode.Uri);
    } else {
        files = await getFileList(para[1] as vscode.Uri[]);
    }
    let hasEmptyFormat: boolean = files.reduce((hasEmpty, file) => {
        if (hasEmpty) return true;
        return !file.format;
    }, false);
    if (hasEmptyFormat) {
        let userPickFormat = await vscode.window.showQuickPick(
            appliedRender(files[0].uri).formats(),
            <vscode.QuickPickOptions>{
                placeHolder: localize(34, null)
            }
        );
        if (!userPickFormat) return;
        files.map(file => {
            file.format = file.format || userPickFormat;
        });
    }
    doBuild(files);
}

function getFileList(): Promise<FileAndFormat[]>;
function getFileList(uri: vscode.Uri): Promise<FileAndFormat[]>;
function getFileList(uris: vscode.Uri[]): Promise<FileAndFormat[]>;
async function getFileList(para?): Promise<FileAndFormat[]> {
    let _files: FileAndFormat[] = [];

    if (!vscode.workspace.workspaceFolders) { return []; }

    if (!para) {
        for (let folder of vscode.workspace.workspaceFolders) {
            _files.push(...await getFileList(config.diagramsRoot(folder.uri)));
        }
    } else if (para instanceof Array) {
        for (let u of para.filter(p => p instanceof vscode.Uri)) {
            _files.push(...await getFileList(u));
        }
    } else if (para instanceof vscode.Uri) {
        if (fs.statSync(para.fsPath).isDirectory()) {
            let exts = config.fileExtensions(para);
            let folder = vscode.workspace.getWorkspaceFolder(para);
            let relPath = path.relative(folder.uri.fsPath, para.fsPath);
            relPath = relPath ? relPath + '/' : '';
            let files = await vscode.workspace.findFiles(`${relPath}**/*${exts}`, "");
            files.filter(file => isSubPath(file.fsPath, folder.uri.fsPath))
                .map(
                    f => _files.push(
                        <FileAndFormat>{
                            uri: f,
                            format: config.exportFormat(f)
                        }
                    )
                );
        } else {
            _files.push(<FileAndFormat>{
                uri: para,
                format: config.exportFormat(para)
            });
        }
    }
    return _files;
}
function doBuild(files: FileAndFormat[]) {
    if (!files.length) {
        vscode.window.showInformationMessage(localize(8, null));
        return;
    }
    let stopWatch = new StopWatch();
    stopWatch.start();

    exportFiles(files, bar).then(
        async r => {
            stopWatch.stop();
            r = r as exportFilesResult;
            let results = r.results;
            let errors = r.errors;
            bar.hide();
            //uris.length: found documents count 
            //results.length: exported documents count 
            let viewReport = localize(26, null);
            let msg = "";
            let btn = "";
            if (!results.length) {
                msg = localize(29, null);
                if (!errors.length) {
                    vscode.window.showInformationMessage(msg);
                } else {
                    btn = await vscode.window.showInformationMessage(msg, viewReport);
                    if (btn === viewReport) showReport();
                }
                return;
            }
            msg = localize(errors.length ? 12 : 13, null, results.length);
            btn = await vscode.window.showInformationMessage(msg, viewReport);
            if (btn === viewReport) showReport();
            function showReport() {
                let fileCnt = 0;
                let diagramCnt = 0;
                let fileLst = results.reduce((list, diagrams) => {
                    if (!diagrams || !diagrams.length) return list;
                    diagramCnt += diagrams.length;
                    return list + diagrams.reduce((oneDiagramList, files) => {
                        if (!files || !files.length) return oneDiagramList;
                        let filtered = files.filter(v => !!v.length);
                        fileCnt += filtered.length;
                        return oneDiagramList + "\n" + filtered.join("\n");
                    }, "");
                }, "");
                let report = localize(28, null, results.length, diagramCnt, fileCnt, stopWatch.runTime() / 1000) + fileLst;
                if (errors.length) {
                    report += "\n" + errors.reduce((p, c) => {
                        return p + (p ? "\n" : "") + c.error;
                    }, "");
                }
                showMessagePanel(report);
            }
        }
    );
}