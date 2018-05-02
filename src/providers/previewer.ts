import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import { RenderTask, RenderError } from '../plantuml/renders/interfaces'
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
    private zoomUpperLimit: boolean = true;

    private template: string;
    private templateProcessing: string;

    private killingLock: boolean = false;

    constructor() {
        super(() => this.dispose());
        this.register();
    }

    dispose() {
        this._disposables && this._disposables.length && this._disposables.map(d => d.dispose());
        this.watchDisposables && this.watchDisposables.length && this.watchDisposables.map(d => d.dispose());
    }

    reset() {
        let tplPath: string = path.join(contextManager.context.extensionPath, "templates");
        let tplPreviewPath: string = path.join(tplPath, "preview.html");
        let tplPreviewProcessingPath: string = path.join(tplPath, "preview-processing.html");
        this.template = '`' + fs.readFileSync(tplPreviewPath, "utf-8") + '`';
        this.templateProcessing = '`' + fs.readFileSync(tplPreviewProcessingPath, "utf-8") + '`';

        this.rendered = null;
        this.uiStatus = "";
        this.images = [];
        this.imageError = "";
        this.error = "";
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        //start watching changes
        if (config.previewAutoUpdate) this.startWatch(); else this.stopWatch();
        let image = this.images[0];
        let images = this.images.reduce((p, c) => {
            return `${p}<img src="${c}">`
        }, "");
        let imageError: string;
        let error: string;
        try {
            switch (this.status) {
                case previewStatus.default:
                case previewStatus.error:
                    let zoomUpperLimit = this.zoomUpperLimit;
                    let status = this.uiStatus;
                    let nonce = Math.random().toString(36).substr(2);
                    let tmplPath = "file:///" + path.join(contextManager.context.extensionPath, "templates");
                    let pageInfo = localize(20, null);
                    let wheelAction = config.previewWheelAction;
                    imageError = this.imageError;
                    error = this.error.replace(/\n/g, "<br />");
                    if (!image) image = imageError;
                    return eval(this.template);
                case previewStatus.processing:
                    let icon = "file:///" + path.join(contextManager.context.extensionPath, "images", "icon.png");
                    let processingTip = localize(9, null);
                    image = calculateExportPath(this.rendered, config.previewFileType);
                    image = addFileIndex(image, 0, this.rendered.pageCount);
                    if (!fs.existsSync(image)) image = ""; else image = "file:///" + image;
                    return eval(this.templateProcessing);
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
    update(processingTip: boolean) {
        try {
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
            this.doUpdate(processingTip).catch(e => showMessagePanel(e));
        } catch (error) {
            showMessagePanel(error);
        }
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
        const previewFileType = config.previewFileType;
        const previewMimeType = previewFileType === 'png' ? 'png' : "svg+xml";
        this.zoomUpperLimit = previewMimeType === 'png';
        let task: RenderTask = exportToBuffer(diagram, previewFileType);
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
    register() {
        let disposable: vscode.Disposable;

        //register provider
        disposable = vscode.workspace.registerTextDocumentContentProvider('plantuml', this);
        this._disposables.push(disposable);

        //register command
        disposable = vscode.commands.registerCommand('plantuml.preview', () => {
            try {
                var editor = vscode.window.activeTextEditor;
                if (!editor) return;
                let diagrams = diagramsOf(editor.document);
                if (!diagrams.length) return;

                //reset in case that starting commnad in none-diagram area, 
                //or it may show last error image and may cause wrong "TargetChanged" result on cursor move.
                this.reset();
                this.TargetChanged;
                return vscode.commands.executeCommand('vscode.previewHtml', this.Uri, vscode.ViewColumn.Two, localize(17, null))
                    .then(
                        success => {
                            //active source editor
                            vscode.window.showTextDocument(editor.document).then(
                                () => {
                                    //update preview
                                    this.update(true);
                                    return;
                                },
                                reason => {
                                    vscode.window.showErrorMessage(reason);
                                }
                            );
                        },
                        reason => {
                            vscode.window.showErrorMessage(reason);
                        }
                    );
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