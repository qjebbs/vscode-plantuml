import * as vscode from 'vscode';
import * as path from 'path';
import { Exporter, ExportError } from './exporter';
import { Diagram } from './diagram';
import { ExportFormats, FileSuffixes } from './settings';
import { showError, parseError } from './tools';
import * as nls from "vscode-nls";

export class Builder {
    constructor(
        public config: vscode.WorkspaceConfiguration,
        public context: vscode.ExtensionContext,
        public exporter: Exporter,
        public outputPanel: vscode.OutputChannel,
        public localize: nls.LocalizeFunc
    ) { }

    register(): vscode.Disposable[] {
        //register export
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.exportWorkspace', () => {
            try {
                this.build(null);
            } catch (error) {
                showError(this.outputPanel, parseError(error));
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
            vscode.window.showInformationMessage(this.localize(8, null));
            return;
        }
        let concurrency = this.config.get("exportConcurrency") as number;
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let errors: ExportError[] = [];
        uris.reduce((prev: Promise<Buffer[]>, uri: vscode.Uri, index: number) => {
            return prev.then(
                () => {
                    return this.exporter.exportURI(uri, format, concurrency, bar);
                },
                error => {
                    errors.push(...parseError(this.localize(11, null, error.length, uris[index - 1].fsPath)))
                    errors.push(...parseError(error));
                    // continue next file
                    return this.exporter.exportURI(uri, format, concurrency, bar);
                });
        }, Promise.resolve([])).then(
            () => {
                bar.dispose();
                if (uris.length) {
                    if (errors.length) {
                        vscode.window.showInformationMessage(this.localize(12, null, uris.length));
                        showError(this.outputPanel, errors);
                    } else {
                        vscode.window.showInformationMessage(this.localize(13, null, uris.length));
                    }
                }
            },
            error => {
                bar.dispose();
                errors.push(...parseError(this.localize(11, null, error.length, uris[uris.length - 1].fsPath)));
                errors.push(...parseError(error));
                if (uris.length) {
                    vscode.window.showInformationMessage(this.localize(12, null, uris.length));
                    showError(this.outputPanel, errors);
                }
            }
            );
    }
}