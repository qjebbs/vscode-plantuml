import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Exporter, ExportError } from './exporter';
import { Diagram, Diagrams } from './diagram';
import * as child_process from 'child_process';
import { parseError } from './tools';
import * as nls from "vscode-nls";

enum previewStatus {
    default,
    error,
    processing,
}

export class Previewer implements vscode.TextDocumentContentProvider {

    Emittor = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.Emittor.event;
    Uri = vscode.Uri.parse('plantuml://preview');

    private status: previewStatus;
    private rendered: string = "";
    private process: child_process.ChildProcess = null;
    private watchDisposables: vscode.Disposable[] = [];

    private image: string;
    private imageError: string;
    private error: string = "";

    private template: string;
    private templateError: string;
    private templateProcessing: string;

    private killingLock: boolean = false;

    constructor(
        public config: vscode.WorkspaceConfiguration,
        public context: vscode.ExtensionContext,
        public exporter: Exporter,
        public localize: nls.LocalizeFunc
    ) {
        let tplPath: string = path.join(this.context.extensionPath, "templates");
        let tplPreviewPath: string = path.join(tplPath, "preview.html");
        let tplPreviewErrorPath: string = path.join(tplPath, "preview-error.html");
        let tplPreviewProcessingPath: string = path.join(tplPath, "preview-processing.html");
        this.template = '`' + fs.readFileSync(tplPreviewPath, "utf-8") + '`';
        this.templateError = '`' + fs.readFileSync(tplPreviewErrorPath, "utf-8") + '`';
        this.templateProcessing = '`' + fs.readFileSync(tplPreviewProcessingPath, "utf-8") + '`';
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        let image: string;
        let imageError: string;
        let error: string;
        let text: string;
        switch (this.status) {
            case previewStatus.default:
                image = this.image
                return eval(this.template);
            case previewStatus.error:
                image = this.image
                imageError = this.imageError;
                error = this.error.replace(/\n/g, "<br />");
                return eval(this.templateError);
            case previewStatus.processing:
                image = path.join(this.context.extensionPath, "images", "icon.png");
                text = this.localize(9, "Processing...");
                return eval(this.templateProcessing);
            default:
                return "";
        }
    }
    update(processingTip: boolean) {
        //FIXME: last update may not happen due to killingLock
        if (this.killingLock) return;
        if (this.process) {
            this.killingLock = true;
            //kill lats unfinished task.
            // let pid = this.process.pid;
            this.process.kill();
            this.process.on('exit', (code) => {
                // console.log(`killed (${pid} ${code}) and restart!`);
                this.process = null;
                this.doUpdate(processingTip);
                this.killingLock = false;
            })
            return;
        }
        this.doUpdate(processingTip);
    }
    get TargetChanged(): boolean {
        let current = new Diagram().GetCurrent();
        let cur = "";
        if (current.start) cur = current.path + "@" + current.start.line;
        let changed = this.rendered != cur;
        if (changed) {
            this.rendered = cur;
            this.error = "";
            this.image = "";
            this.imageError = ""
        }
        return changed;
    }
    private doUpdate(processingTip: boolean) {
        let diagram = new Diagram().GetCurrent();
        if (!diagram.content) {
            this.status = previewStatus.error;
            this.error = this.localize(3, "No valid diagram found here!");
            this.image = "";
            this.Emittor.fire(this.Uri);
            return;
        }
        let task = this.exporter.exportToBuffer(diagram, "png");
        this.process = task.process;
        // console.log(`start pid ${this.process.pid}!`);
        if (processingTip) this.processing();
        task.promise.then(
            result => {
                this.process = null;
                this.status = previewStatus.default;
                let b64 = result.toString('base64');
                if (!b64) return;
                this.image = `data:image/png;base64,${b64}`
                this.Emittor.fire(this.Uri);
            },
            error => {
                this.process = null;
                this.status = previewStatus.error;
                let err = parseError(error)[0];
                this.error = err.error;
                let b64 = err.out.toString('base64');
                if (!(b64 || err.error)) return;
                this.imageError = `data:image/png;base64,${b64}`
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

            return vscode.commands.executeCommand('vscode.previewHtml', this.Uri, vscode.ViewColumn.Two, 'PlantUML Preview')
                .then(
                success => {
                    //active source editor
                    vscode.window.showTextDocument(editor.document);
                    //update preview
                    let auto = this.config.get("autoUpdatePreview") as boolean
                    if (auto) this.startWatch(); else this.stopWatch();
                    this.update(true);
                    this.TargetChanged;
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