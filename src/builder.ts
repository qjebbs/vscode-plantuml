import * as vscode from 'vscode';
import { Exporter, ExportError } from './exporter';
import { Diagram } from './diagram';
import { ExportFormats, FileSuffixes } from './base';


export class Builder {
    constructor(
        public config: vscode.WorkspaceConfiguration,
        public context: vscode.ExtensionContext,
        public exporter: Exporter
    ) { }

    register(): vscode.Disposable[] {
        function showError(error) {
            let err = error as TypeError;
            console.log(error);
            vscode.window.showErrorMessage(err.message);
        }
        //register export
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.exportWorkspace', () => {
            try {
                this.build(null);
            } catch (error) {
                showError(error);
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
            this.doBuild(await this.findFiles(FileSuffixes), format);
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
                    return this.exporter.exportURI(uri, format, concurrency, bar);
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
                    // return this.exporter.exportURI(uri, format, concurrency, bar);
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
                    console.log(err);
                    vscode.window.showErrorMessage(err.message);
                } else {
                    vscode.window.showErrorMessage(error.replace(/\n/g, " "));
                }
            }
            )
    }

    private async findFiles(exts: string[]) {
        let uris: vscode.Uri[] = [];
        await exts.reduce((prev: Promise<vscode.Uri[]>, ext: string) => {
            return prev.then(
                us => {
                    uris.push(...us);
                    return vscode.workspace.findFiles(`**/*${ext}`, "");
                },
                err => {
                    return Promise.reject(err);
                }
            );
        }, Promise.resolve("")).then(
            us => {
                uris.push(...us);
            },
            err => {
                return Promise.reject(err);
            }
            );
        return uris;
    }
}