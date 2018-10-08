import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import { RenderTask } from '../plantuml/renders/interfaces'
import { Diagram, diagramsOf, currentDiagram } from '../plantuml/diagram/diagram';
import { config } from '../plantuml/config';
import { localize, extensionPath } from '../plantuml/common';
import { parseError, calculateExportPath, addFileIndex, showMessagePanel, fileToBase64 } from '../plantuml/tools';
import { exportToBuffer } from "../plantuml/exporter/exportToBuffer";
import { UI } from '../ui/ui';

enum previewStatus {
    default,
    error,
    processing,
}
class Previewer extends vscode.Disposable {

    private _uiPreview: UI;
    private _disposables: vscode.Disposable[] = [];
    private watchDisposables: vscode.Disposable[] = [];
    private status: previewStatus;
    private previewPageStatus: string;
    private rendered: Diagram;
    private task: RenderTask;

    private images: string[];
    private imageError: string;
    private error: string = "";
    private zoomUpperLimit: boolean = false;

    constructor() {
        super(() => this.dispose());
        this.register();
    }

    dispose() {
        this._disposables && this._disposables.length && this._disposables.map(d => d.dispose());
        this.watchDisposables && this.watchDisposables.length && this.watchDisposables.map(d => d.dispose());
    }

    reset() {
        this.rendered = null;
        this.previewPageStatus = "";
        this.images = [];
        this.imageError = "";
        this.error = "";
    }

    updateWebView(): string {
        let env = {
            images: this.images.reduce((p, c) => {
                return `${p}<img src="${c}">`
            }, ""),
            imageError: "",
            error: "",
            status: this.previewPageStatus,
            // nonce: Math.random().toString(36).substr(2),
            pageInfo: localize(20, null),
            icon: "file:///" + path.join(extensionPath, "images", "icon.png"),
            processingTip: localize(9, null),
            snapBottomTitle: localize(35, null),
            snapRightTitle: localize(36, null),
            snapTopTitle: localize(37, null),
            snapLeftTitle: localize(38, null),
            settings: JSON.stringify({
                zoomUpperLimit: this.zoomUpperLimit,
                showSpinner: this.status === previewStatus.processing,
                showSnapIndicators: config.previewSnapIndicators,
            }),
        };
        try {
            switch (this.status) {
                case previewStatus.default:
                case previewStatus.error:
                    env.imageError = this.imageError;
                    env.error = this.error.replace(/\n/g, "<br />");
                    this._uiPreview.show(env);
                    break;
                case previewStatus.processing:
                    env.error = "";
                    env.images = ["svg", "png"].reduce((p, c) => {
                        if (p) return p;
                        let exported = calculateExportPath(this.rendered, c);
                        exported = addFileIndex(exported, 0, this.rendered.pageCount);
                        return fs.existsSync(exported) ? env.images = `<img src="${fileToBase64(exported)}">` : "";
                    }, "");
                    this._uiPreview.show(env);
                    break;
                default:
                    break;
            }
        } catch (error) {
            return error
        }
    }
    setUIStatus(status: string) {
        this.previewPageStatus = status;
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
        ).then(() => this.task = null);
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
            this.previewPageStatus = "";
        }
        return changed;
    }
    private async doUpdate(processingTip: boolean) {
        let diagram = currentDiagram();
        if (!diagram) {
            this.status = previewStatus.error;
            this.error = localize(3, null);
            this.images = [];
            this.updateWebView();
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
                this.updateWebView();
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
                this.updateWebView();
            }
        );
    }
    //display processing tip
    processing() {
        this.status = previewStatus.processing;
        this.updateWebView();
    }
    register() {
        let disposable: vscode.Disposable;

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
            } catch (error) {
                showMessagePanel(error);
            }
        });
        this._disposables.push(disposable);

        this._uiPreview = new UI(
            "plantuml.preview",
            localize(17, null),
            path.join(extensionPath, "templates/preview.html"),
        );
        this._disposables.push(this._uiPreview);

        this._uiPreview.addEventListener("message", e => this.setUIStatus(JSON.stringify(e.message)));
        this._uiPreview.addEventListener("open", () => this.startWatch());
        this._uiPreview.addEventListener("close", () => { this.stopWatch(); this.killTasks(); });
    }
    startWatch() {
        if (!config.previewAutoUpdate) return;
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