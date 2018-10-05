import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import { RenderTask } from '../plantuml/renders/interfaces'
import { Diagram, diagramsOf, currentDiagram } from '../plantuml/diagram/diagram';
import { config } from '../plantuml/config';
import { localize } from '../plantuml/common';
import { parseError, calculateExportPath, addFileIndex, showMessagePanel } from '../plantuml/tools';
import { exportToBuffer } from "../plantuml/exporter/exportToBuffer";
import { contextManager } from '../plantuml/context';

enum previewStatus {
    default,
    error,
    processing,
}
class Previewer extends vscode.Disposable implements vscode.TextDocumentContentProvider {

    Emittor = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.Emittor.event;
    Uri = vscode.Uri.parse('plantuml://preview');

    private _disposables: vscode.Disposable[] = [];
    private watchDisposables: vscode.Disposable[] = [];
    private status: previewStatus;
    private uiStatus: string;
    private rendered: Diagram;
    private task: RenderTask;

    private images: string[];
    private imageError: string;
    private error: string = "";
    private zoomUpperLimit: boolean = false;

    private template: string;

    constructor() {
        super(() => this.dispose());
        this.register();
    }

    dispose() {
        this._disposables && this._disposables.length && this._disposables.map(d => d.dispose());
        this.watchDisposables && this.watchDisposables.length && this.watchDisposables.map(d => d.dispose());
    }

    reset() {
        let tplPreviewPath: string = path.join(contextManager.context.extensionPath, "templates", "preview.html");
        this.template = '`' + fs.readFileSync(tplPreviewPath, "utf-8") + '`';
        this.rendered = null;
        this.uiStatus = "";
        this.images = [];
        this.imageError = "";
        this.error = "";
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        //start watching changes
        if (config.previewAutoUpdate) this.startWatch(); else this.stopWatch();
        let images = this.images.reduce((p, c) => {
            return `${p}<img src="${c}">`
        }, "");
        let imageError: string;
        let error: string;
        let tmplPath = "file:///" + path.join(contextManager.context.extensionPath, "templates");
        let status = this.uiStatus;
        let nonce = Math.random().toString(36).substr(2);
        let pageInfo = localize(20, null);
        let icon = "file:///" + path.join(contextManager.context.extensionPath, "images", "icon.png");
        let processingTip = localize(9, null);
        let snapBottomTitle = localize(35, null);
        let snapRightTitle = localize(36, null);
        let snapTopTitle = localize(37, null);
        let snapLeftTitle = localize(38, null);
        let settings = JSON.stringify({
            zoomUpperLimit: this.zoomUpperLimit,
            showSpinner: this.status == previewStatus.processing,
            showSnapIndicators: config.previewSnapIndicators,
        });
        try {
            switch (this.status) {
                case previewStatus.default:
                case previewStatus.error:
                    imageError = this.imageError;
                    error = this.error.replace(/\n/g, "<br />");
                    return eval(this.template);
                case previewStatus.processing:
                    error = "";
                    images = ["svg", "png"].reduce((p, c) => {
                        if (p) return p;
                        let exported = calculateExportPath(this.rendered, c);
                        exported = addFileIndex(exported, 0, this.rendered.pageCount);
                        return fs.existsSync(exported) ? images = `<img src="file:///${exported}">` : "";
                    }, "");
                    return eval(this.template);
                default:
                    return "";
            }
        } catch (error) {
            return error
        }
    }
    setUIStatus(status: string) {
        this.uiStatus = status;
    }
    async update(processingTip: boolean) {
        await this.killTasks();
        // console.log("updating...");
        // do not await doUpdate, so that preview window could open before update task finish.
        this.doUpdate(processingTip).catch(e => showMessagePanel(e));
    }
    private killTasks() {
        if (!this.task || !this.task.processes || !this.task.processes.length)
            return Promise.resolve(true);

        //kill unfinish task.
        this.task.canceled = true;
        return Promise.all(
            this.task.processes.map(p => this.killTask(p))
        ).then(() => this.task.processes = []);
    }
    private killTask(process: child_process.ChildProcess) {
        return new Promise((resolve, reject) => {
            process.kill();
            process.on('exit', (code) => {
                // console.log(`killed ${process.pid} with code ${code}!`);
                resolve(true);
            });
        })
    }
    get TargetChanged(): boolean {
        let current = currentDiagram();
        if (!current) return false;
        let changed = (!this.rendered || !this.rendered.isEqual(current));
        if (changed) {
            this.rendered = current;
            this.error = "";
            this.images = [];
            this.imageError = "";
            this.uiStatus = "";
        }
        return changed;
    }
    private async doUpdate(processingTip: boolean) {
        let diagram = currentDiagram();
        if (!diagram) {
            this.status = previewStatus.error;
            this.error = localize(3, null);
            this.images = [];
            this.Emittor.fire(this.Uri);
            return;
        }
        let task: RenderTask = exportToBuffer(diagram, "svg");
        this.task = task;

        // console.log(`start pid ${this.process.pid}!`);
        if (processingTip) this.processing();
        await task.promise.then(
            result => {
                if (task.canceled) return;
                this.task = null;
                this.status = previewStatus.default;

                this.error = "";
                this.imageError = "";
                this.images = result.reduce((p, buf) => {
                    let isSvg = buf.slice(0, 5).toString() == "<?xml";
                    let b64 = buf.toString('base64');
                    if (!b64) return p;
                    p.push(`data:image/${isSvg ? "svg+xml" : 'png'};base64,${b64}`);
                    return p;
                }, <string[]>[]);
                this.Emittor.fire(this.Uri);
            },
            error => {
                if (task.canceled) return;
                this.task = null;
                this.status = previewStatus.error;
                let err = parseError(error)[0];
                this.error = err.error;
                let b64 = err.out.toString('base64');
                if (!(b64 || err.error)) return;
                this.imageError = `data:image/svg+xml;base64,${b64}`
                this.Emittor.fire(this.Uri);
            }
        );
    }
    //display processing tip
    processing() {
        this.status = previewStatus.processing;
        this.Emittor.fire(this.Uri);
    }
    register() {
        let disposable: vscode.Disposable;

        //register provider
        disposable = vscode.workspace.registerTextDocumentContentProvider('plantuml', this);
        this._disposables.push(disposable);

        //register command
        disposable = vscode.commands.registerCommand('plantuml.preview', async () => {
            try {
                var editor = vscode.window.activeTextEditor;
                if (!editor) return;
                let diagrams = diagramsOf(editor.document);
                if (!diagrams.length) return;

                //reset in case that starting commnad in none-diagram area, 
                //or it may show last error image and may cause wrong "TargetChanged" result on cursor move.
                this.reset();
                this.TargetChanged;
                //update preview
                await this.update(true);
                vscode.commands.executeCommand('vscode.previewHtml', this.Uri, vscode.ViewColumn.Two, localize(17, null))
                    .then(null, error => showMessagePanel(error));
            } catch (error) {
                showMessagePanel(error);
            }
        });
        this._disposables.push(disposable);
    }
    startWatch() {
        if (this.watchDisposables.length) return;
        let disposable: vscode.Disposable;
        let disposables: vscode.Disposable[] = [];

        //register watcher
        let lastTimestamp = new Date().getTime();
        disposable = vscode.workspace.onDidChangeTextDocument(e => {
            if (!e || !e.document || !e.document.uri) return;
            if (e.document.uri.scheme == "plantuml") return;
            lastTimestamp = new Date().getTime();
            setTimeout(() => {
                if (new Date().getTime() - lastTimestamp >= 400) {
                    if (!currentDiagram()) return;
                    this.update(false);
                }
            }, 500);
        });
        disposables.push(disposable);
        disposable = vscode.window.onDidChangeTextEditorSelection(e => {
            lastTimestamp = new Date().getTime();
            setTimeout(() => {
                if (new Date().getTime() - lastTimestamp >= 400) {
                    if (!this.TargetChanged) return;
                    this.update(true);
                }
            }, 500);
        });
        disposables.push(disposable);

        //stop watcher when preview window is closed
        disposable = vscode.workspace.onDidCloseTextDocument(e => {
            if (e.uri.scheme === this.Uri.scheme) {
                this.stopWatch();
            }
        })
        disposables.push(disposable);

        this.watchDisposables = disposables;
    }
    stopWatch() {
        for (let d of this.watchDisposables) {
            d.dispose();
        }
        this.watchDisposables = [];
    }
}
export const previewer = new Previewer();