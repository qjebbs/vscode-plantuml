import * as vscode from 'vscode';
import * as path from 'path';
import { Exporter, ExportError } from './exporter';
import { Diagram } from './diagram';
import { ExportFormats, FileSuffixes } from './settings';
import { parseError } from './tools';

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
        if (!vscode.workspace.rootPath) { return; }
        let format = this.config.get("exportFormat") as string;
        if (!format) {
            format = await vscode.window.showQuickPick(ExportFormats);
            if (!format) return;
        }
        this.outputPanel.clear();
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
        if (!uris.length) {
            vscode.window.showInformationMessage("No file to export.");
            return;
        }
        let concurrency = this.config.get("exportConcurrency") as number;
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let errors: ExportError[] = [];
        let outDirName = this.config.get("exportOutDirName") as number;
        let dir = path.join(vscode.workspace.rootPath, outDirName);
        uris.reduce((prev: Promise<Buffer[]>, uri: vscode.Uri, index: number) => {
            return prev.then(
                () => {
                    return this.exporter.exportURI(uri, format, dir, concurrency, bar);
                },
                error => {
                    errors.push(...parseError(`${error.length} errors found in file ${uris[index - 1].fsPath}\n`))
                    errors.push(...parseError(error));
                    // continue next file
                    return this.exporter.exportURI(uri, format, dir, concurrency, bar);
                });
        }, Promise.resolve([])).then(
            () => {
                bar.dispose();
                if (uris.length) {
                    if (errors.length) {
                        vscode.window.showInformationMessage(`Export ${uris.length} files finish with error.`);
                        this.showError(errors);
                    } else {
                        vscode.window.showInformationMessage(`Export ${uris.length} files finish.`);
                    }
                }
            },
            error => {
                bar.dispose();
                errors.push(...parseError(`${error.length} errors found in file ${uris[uris.length - 1].fsPath}\n`))
                errors.push(...parseError(error));
                if (uris.length) {
                    vscode.window.showInformationMessage(`Export ${uris.length} files finish with error.`);
                    this.showError(errors);
                }
            }
            );
    }
    private showError(errors: ExportError[]) {
        this.outputPanel.clear();
        for (let e of errors) {
            this.outputPanel.appendLine(e.error);
        }
        this.outputPanel.show();
    }
}