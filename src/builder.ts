import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { exporter, ExportError } from './exporter';
import { Diagram } from './diagram';
import { config } from './config';
import { outputPanel, context, localize } from './planuml';
import { showError, parseError } from './tools';

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
                format = await vscode.window.showQuickPick(config.exportFormats);
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
            showError(outputPanel, parseError(error));
        }
    }
    private doBuild(uris: vscode.Uri[], format: string) {
        if (!uris.length) {
            vscode.window.showInformationMessage(localize(8, null));
            return;
        }
        let concurrency = config.exportConcurrency;
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let errors: ExportError[] = [];
        uris.reduce((prev: Promise<Buffer[]>, uri: vscode.Uri, index: number) => {
            return prev.then(
                () => {
                    return exporter.exportURI(uri, format, concurrency, bar);
                },
                error => {
                    errors.push(...parseError(localize(11, null, error.length, uris[index - 1].fsPath)))
                    errors.push(...parseError(error));
                    // continue next file
                    return exporter.exportURI(uri, format, concurrency, bar);
                });
        }, Promise.resolve([])).then(
            () => {
                bar.dispose();
                if (uris.length) {
                    if (errors.length) {
                        vscode.window.showInformationMessage(localize(12, null, uris.length));
                        showError(outputPanel, errors);
                    } else {
                        vscode.window.showInformationMessage(localize(13, null, uris.length));
                    }
                }
            },
            error => {
                bar.dispose();
                errors.push(...parseError(localize(11, null, error.length, uris[uris.length - 1].fsPath)));
                errors.push(...parseError(error));
                if (uris.length) {
                    vscode.window.showInformationMessage(localize(12, null, uris.length));
                    showError(outputPanel, errors);
                }
            }
            );
    }
}
export const builder = new Builder();