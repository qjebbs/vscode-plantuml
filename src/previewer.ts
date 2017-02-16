import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Exporter, ExportError } from './exporter';
import { Diagram } from './diagram';
import * as child_process from 'child_process';
import { parseError } from './tools'

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

    constructor(
        public config: vscode.WorkspaceConfiguration,
        public context: vscode.ExtensionContext,
        public exporter: Exporter
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
                text = "Processing";
                return eval(this.templateProcessing);
            default:
                return "";
        }
    }
    update() {
        if (this.process) {
            //kill lats unfinished task.
            // let pid = this.process.pid;
            this.process.kill();
            this.process.on('exit', (code) => {
                // console.log(`killed (${pid} ${code}) and restart!`);
                this.process = null;
                this.doUpdate();
            })
            return;
        }
        this.doUpdate();
    }
    get TargetChanged(): boolean {
        let current = new Diagram().GetCurrent();
        let changed = this.rendered != current.path + "@" + current.start.line;
        if (changed) {
            this.rendered = current.path + "@" + current.start.line;
            this.error = "";
            this.image = "";
            this.imageError = ""
        }
        return changed;
    }
    private doUpdate() {
        let diagram = new Diagram().GetCurrent();
        if (!diagram.content) {
            this.status = previewStatus.error;
            this.error = "No valid diagram found here!";
            this.image = "";
            this.Emittor.fire(this.Uri);
            return;
        }
        let task = this.exporter.exportToBuffer(diagram, "png");
        this.process = task.process;
        // console.log(`start pid ${this.process.pid}!`);

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
            return vscode.commands.executeCommand('vscode.previewHtml', this.Uri, vscode.ViewColumn.Two, 'PlantUML Preview')
                .then(success => {
                    //active source editor
                    vscode.window.showTextDocument(editor.document);
                    //update preview
                    let auto = this.config.get("autoUpdatePreview") as boolean
                    if (auto) this.startWatch(); else this.stopWatch();
                    this.processing();
                    this.update();
                    this.TargetChanged;
                    return;
                }, reason => {
                    vscode.window.showErrorMessage(reason);
                });
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
                    this.update();
                }
            }, 500);
        });
        disposables.push(disposable);
        disposable = vscode.window.onDidChangeTextEditorSelection(e => {
            if (!this.TargetChanged) return;
            lastTimestamp = new Date().getTime();
            setTimeout(() => {
                if (new Date().getTime() - lastTimestamp >= 400) {
                    this.processing();
                    this.update();
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