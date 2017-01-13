import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Exporter, ExportError } from './exporter';
import { Diagram } from './diagram';


export class Previewer implements vscode.TextDocumentContentProvider {

    Emittor = new vscode.EventEmitter<vscode.Uri>();
    Uri = vscode.Uri.parse('plantuml://preview');

    private image: string;
    private imageProcessing: string;
    private template: string;
    private templateError: string;
    private error: string = "";
    private rendered: number = 0;
    private watchDisposables: vscode.Disposable[] = [];
    constructor(
        public config: vscode.WorkspaceConfiguration,
        public context: vscode.ExtensionContext,
        public exporter: Exporter
    ) {
        let tplPath: string = path.join(this.context.extensionPath, "templates");
        let tplPreviewPath: string = path.join(tplPath, "preview.html");
        let tplPreviewErrorPath: string = path.join(tplPath, "preview-error.html");
        this.template = '`' + fs.readFileSync(tplPreviewPath, "utf-8") + '`';
        this.templateError = '`' + fs.readFileSync(tplPreviewErrorPath, "utf-8") + '`';
        this.imageProcessing = path.join(this.context.extensionPath, "images", "preview-processing.png");
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        let image = this.image;
        let error = this.error.replace(/\n/g, "<br />");
        if (this.error) {
            return eval(this.templateError);
        }
        return eval(this.template);
    }
    update() {
        let diagram = new Diagram().GetCurrent();
        if (!diagram.content) {
            this.error = "No valid diagram found here!";
            this.image = "";
            this.Emittor.fire(this.Uri);
            return;
        }
        this.rendered = diagram.start.line;
        this.exporter.exportToBuffer(diagram, "png").then(
            result => {
                let b64 = result.toString('base64');
                this.image = `data:image/png;base64,${b64}`
                this.error = "";
                this.Emittor.fire(this.Uri);
            },
            error => {
                let err = error as ExportError
                this.image = "";
                this.error = err.error;
                let b64 = err.out.toString('base64');
                if (b64) {
                    this.image = `data:image/png;base64,${b64}`
                }
                this.Emittor.fire(this.Uri);
            }
        );
    };
    //display processing tip
    processing() {
        this.error = "";
        this.image = this.imageProcessing;
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
            if (vscode.window.activeTextEditor !== e.textEditor ||
                this.rendered == new Diagram().GetCurrent().start.line) {
                return;
            }
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