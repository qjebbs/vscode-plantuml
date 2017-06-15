import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import { exporter, ExportTask } from './exporter';
import { httpExporter } from './httpExporter';
import { Diagram, Diagrams } from './diagram';
import { config } from './config';
import { context, localize } from './planuml';
import { parseError } from './tools';

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
    private rendered: Diagram;
    private processes: child_process.ChildProcess[] = [];
    private watchDisposables: vscode.Disposable[] = [];

    private images: string[];
    private imageError: string;
    private error: string = "";

    private template: string;
    private templateError: string;
    private templateProcessing: string;

    private killingLock: boolean = false;

    initialize() {
        let tplPath: string = path.join(context.extensionPath, "templates");
        let tplPreviewPath: string = path.join(tplPath, "preview.html");
        let tplPreviewErrorPath: string = path.join(tplPath, "preview-error.html");
        let tplPreviewProcessingPath: string = path.join(tplPath, "preview-processing.html");
        this.template = '`' + fs.readFileSync(tplPreviewPath, "utf-8") + '`';
        this.templateError = '`' + fs.readFileSync(tplPreviewErrorPath, "utf-8") + '`';
        this.templateProcessing = '`' + fs.readFileSync(tplPreviewProcessingPath, "utf-8") + '`';
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
                image = exporter.calculateExportPath(this.rendered, config.previewFileType);
                image = exporter.addFileIndex(image, 0, this.rendered.pageCount);
                if (!fs.existsSync(image)) image = ""; else image = "file:///" + image;
                return eval(this.templateProcessing);
            default:
                return "";
        }
    }
    update(processingTip: boolean) {
        //FIXME: last update may not happen due to killingLock
        if (this.killingLock) return;
        if (this.processes && this.processes.length) {
            this.killingLock = true;
            //kill lats unfinished task.
            // let pid = this.process.pid;
            this.processes.map((p, i) => {
                p.kill()
                if (i == this.processes.length - 1) {
                    //start next preview only when last process is killed
                    p.on('exit', (code) => {
                        // console.log(`killed (${pid} ${code}) and restart!`);
                        this.processes = [];
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
        let changed = (!this.rendered || !this.rendered.start || this.rendered.start.line != current.start.line || this.rendered.fileName != current.fileName);
        if (changed) {
            this.rendered = current;
            this.error = "";
            this.images = [];
            this.imageError = ""
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

        let task: ExportTask;
        if (config.previewFromUrlServer) {
            task = httpExporter.exportToBuffer(diagram, previewFileType);
            this.processes = null;
        } else {
            task = exporter.exportToBuffer(diagram, previewFileType);
            this.processes = task.processes;
        }

        // console.log(`start pid ${this.process.pid}!`);
        if (processingTip) this.processing();
        task.promise.then(
            result => {

                //tasks are killed, returned result of null
                if (!result) return;

                this.processes = null;
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
                this.processes = null;
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
            if (vscode.window.activeTextEditor.document !== e.document) {
                return;
            }
            lastTimestamp = new Date().getTime();
            setTimeout(() => {
                if (new Date().getTime() - lastTimestamp >= 400) {
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