import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import { RenderTask, RenderError } from '../plantuml/renders/interfaces'
import { Diagram, Diagrams } from '../plantuml/diagram/diagram';
import { config } from '../plantuml/config';
import { context, localize } from '../plantuml/common';
import { parseError, calculateExportPath, addFileIndex } from '../plantuml/tools';
import { exportToBuffer } from "../plantuml/exporter/exportToBuffer";

enum previewStatus {
    default,
    error,
    processing,
}
class Previewer implements vscode.TextDocumentContentProvider {

    Emittor = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.Emittor.event;
    Uri = vscode.Uri.parse('plantuml://preview');

    private status: previewStatus;
    private uiStatus: string;
    private rendered: Diagram;
    private task: RenderTask;
    private watchDisposables: vscode.Disposable[] = [];

    private images: string[];
    private imageError: string;
    private error: string = "";
    private zoomUpperLimit: boolean = true;

    private template: string;
    private templateError: string;
    private templateProcessing: string;

    private killingLock: boolean = false;

    initialize() {
        this.reset();
    }

    reset() {
        let tplPath: string = path.join(context.extensionPath, "templates");
        let tplPreviewPath: string = path.join(tplPath, "preview.html");
        let tplPreviewErrorPath: string = path.join(tplPath, "preview-error.html");
        let tplPreviewProcessingPath: string = path.join(tplPath, "preview-processing.html");
        this.template = '`' + fs.readFileSync(tplPreviewPath, "utf-8") + '`';
        this.templateError = '`' + fs.readFileSync(tplPreviewErrorPath, "utf-8") + '`';
        this.templateProcessing = '`' + fs.readFileSync(tplPreviewProcessingPath, "utf-8") + '`';

        this.rendered = null;
        this.uiStatus = "";
        this.images = [];
        this.imageError = "";
        this.error = "";
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        let image: string;
        let images: string;
        let imageError: string;
        let error: string;
        image = this.images[0];
        images = this.images.reduce((p, c) => {
            return `${p}<img src="${c}">`
        }, "");
        switch (this.status) {
            case previewStatus.default:
                let zoomUpperLimit = this.zoomUpperLimit;
                let status = this.uiStatus;
                let nonce = Math.random().toString(36).substr(2);
                let jsPath = "file:///" + path.join(context.extensionPath, "templates", "js");
                let pageInfo = localize(20, null);
                return eval(this.template);
            case previewStatus.error:
                imageError = this.imageError;
                error = this.error.replace(/\n/g, "<br />");
                return eval(this.templateError);
            case previewStatus.processing:
                let icon = "file:///" + path.join(context.extensionPath, "images", "icon.png");
                let processingTip = localize(9, null);
                image = calculateExportPath(this.rendered, config.previewFileType);
                image = addFileIndex(image, 0, this.rendered.pageCount);
                if (!fs.existsSync(image)) image = ""; else image = "file:///" + image;
                return eval(this.templateProcessing);
            default:
                return "";
        }
    }
    setUIStatus(status: string) {
        this.uiStatus = status;
    }
    update(processingTip: boolean) {
        //FIXME: last update may not happen due to killingLock
        if (this.killingLock) return;
        if (this.task) this.task.canceled = true;
        if (this.task && this.task.processes && this.task.processes.length) {
            this.killingLock = true;
            //kill lats unfinished task.
            // let pid = this.process.pid;
            this.task.processes.map((p, i) => {
                p.kill()
                if (i == this.task.processes.length - 1) {
                    //start next preview only when last process is killed
                    p.on('exit', (code) => {
                        // console.log(`killed (${pid} ${code}) and restart!`);
                        this.task.processes = [];
                        this.doUpdate(processingTip);
                        this.killingLock = false;
                    })
                }
            });
            return;
        }
        this.doUpdate(processingTip);
    }
    get TargetChanged(): boolean {
        let current = new Diagram().GetCurrent();
        if (!current.content) return false;
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
    private doUpdate(processingTip: boolean) {
        let diagram = new Diagram().GetCurrent();
        if (!diagram.content) {
            this.status = previewStatus.error;
            this.error = localize(3, null);
            this.images = [];
            this.Emittor.fire(this.Uri);
            return;
        }
        const previewFileType = config.previewFileType;
        const previewMimeType = previewFileType === 'png' ? 'png' : "svg+xml";
        this.zoomUpperLimit = previewMimeType === 'png';
        let task: RenderTask = exportToBuffer(diagram, previewFileType);
        this.task = task;

        // console.log(`start pid ${this.process.pid}!`);
        if (processingTip) this.processing();
        task.promise.then(
            result => {
                if (task.canceled) return;
                this.task = null;
                this.status = previewStatus.default;

                this.images = result.reduce((p, buf) => {
                    let b64 = buf.toString('base64');
                    if (!b64) return p;
                    p.push(`data:image/${previewMimeType};base64,${b64}`);
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
                this.imageError = `data:image/${previewMimeType};base64,${b64}`
                this.Emittor.fire(this.Uri);
            }
        );
    }
    //display processing tip
    processing() {
        this.status = previewStatus.processing;
        this.Emittor.fire(this.Uri);
    }
    register(): vscode.Disposable[] {
        this.initialize();
        let disposable: vscode.Disposable;
        let disposables: vscode.Disposable[] = [];

        //register provider
        disposable = vscode.workspace.registerTextDocumentContentProvider('plantuml', this);
        disposables.push(disposable);

        //register command
        disposable = vscode.commands.registerCommand('plantuml.preview', () => {
            var editor = vscode.window.activeTextEditor;
            if (!editor) return;
            let ds = new Diagrams().AddDocument(editor.document);
            if (!ds.diagrams.length) return;

            //reset in case that starting commnad in none-diagram area, 
            //or it may show last error image and may cause wrong "TargetChanged" result on cursor move.
            this.reset();
            this.TargetChanged;
            return vscode.commands.executeCommand('vscode.previewHtml', this.Uri, vscode.ViewColumn.Two, localize(17, null))
                .then(
                success => {
                    //active source editor
                    vscode.window.showTextDocument(editor.document);
                    //update preview
                    if (config.previewAutoUpdate) this.startWatch(); else this.stopWatch();
                    this.update(true);
                    return;
                },
                reason => {
                    vscode.window.showErrorMessage(reason);
                }
                );
        });
        disposables.push(disposable);
        return disposables;
    }
    startWatch() {
        if (this.watchDisposables.length) {
            return;
        }
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
                    if (!new Diagram().GetCurrent().content) return;
                    this.update(false);
                }
            }, 500);
        });
        disposables.push(disposable);
        disposable = vscode.window.onDidChangeTextEditorSelection(e => {
            if (!this.TargetChanged) return;
            lastTimestamp = new Date().getTime();
            setTimeout(() => {
                if (new Date().getTime() - lastTimestamp >= 400) {
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