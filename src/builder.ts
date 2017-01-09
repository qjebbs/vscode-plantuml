import * as vscode from 'vscode';
import * as path from 'path';
import { Exporter, ExportError } from './exporter';
import { Diagram } from './diagram';
import { ExportFormats, FileSuffixes } from './settings';

export class Builder {
    constructor(
        public config: vscode.WorkspaceConfiguration,
        public context: vscode.ExtensionContext,
        public exporter: Exporter,
        public outputPanel: vscode.OutputChannel
    ) { }

    register(): vscode.Disposable[] {
        //register export
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.exportWorkspace', () => {
            try {
                this.build(null);
            } catch (error) {
                this.showError(error);
            }
        });
        ds.push(d);
        return ds;
    }
    build(uri: vscode.Uri);
    build(uris: vscode.Uri[]);
    async build(para) {
        let format = this.config.get("exportFormat") as string;
        if (!format) {
            format = await vscode.window.showQuickPick(ExportFormats);
            if (!format) return;
        }
        if (!para) {
            let exts = FileSuffixes.reduce((prev, cur) => {
                return prev + (prev ? "," : "") + cur;
            }, "");
            this.doBuild(await vscode.workspace.findFiles(`**/*{${exts}}`, ""), format);
        } else if (para instanceof vscode.Uri) {
            this.doBuild([para], format);
        } else if (para instanceof Array) {
            let uris: vscode.Uri[] = [];
            for (let p of para) {
                if (p instanceof vscode.Uri) {
                    uris.push(p);
                }
            }
            this.doBuild(uris, format);
        }
    }
    private doBuild(uris: vscode.Uri[], format: string) {
        let concurrency = this.config.get("exportConcurrency") as number;
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        uris.reduce((prev: Promise<Buffer>, uri: vscode.Uri, index: number) => {
            return prev.then(
                () => {
                    let outDirName = this.config.get("exportOutDirName") as number;
                    let dir = path.join(vscode.workspace.rootPath, outDirName);
                    return this.exporter.exportURI(uri, format, dir, concurrency, bar);
                },
                error => {
                    let reason = "";
                    if (typeof (error) === "string") {
                        reason = error;
                    } else {
                        let file = uris[index - 1].path;
                        if (error instanceof TypeError) {
                            let err = error as TypeError;
                            reason = `${file}: ${err.message}`
                        } else {
                            let err = error as ExportError;
                            reason = `${file}: ${err.error}`
                        }
                    }
                    return Promise.reject(reason);
                });
        }, Promise.resolve("")).then(
            results => {
                bar.dispose();
                if (uris.length) {
                    vscode.window.showInformationMessage(`Export ${uris.length} files finish.`);
                }
            },
            error => {
                bar.dispose();
                if (error instanceof TypeError) {
                    let err = error as TypeError;
                    this.showError(err.message);
                } else {
                    this.showError(error);
                }
            }
            );
    }
    private showError(error: string) {
        this.outputPanel.clear();
        this.outputPanel.append(error);
        this.outputPanel.show();
    }
}