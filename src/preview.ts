import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { Exporter } from './exporter';
import { Diagram } from './diagram';


export class Previewer implements vscode.TextDocumentContentProvider {

    Emittor: vscode.EventEmitter<vscode.Uri> = new vscode.EventEmitter<vscode.Uri>();
    onDidChange: vscode.Event<vscode.Uri> = this.Emittor.event;
    Uri: vscode.Uri = vscode.Uri.parse('plantuml://preview');

    private prevPath: string = path.join(os.tmpdir(), "plantuml-preview.svg");
    private error: string = "";
    constructor(public exporter: Exporter, public autoUpdate: boolean) { }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        if (this.error) {
            return `<html>
                    <body>
                    <div>
                        <p>${this.error}</p>
                    </div>
                    </body>
                </html>`;
        }
        let Timestamp = new Date().getTime();
        return `<html>
                    <body>
                    <div>
                        <img src="${this.prevPath}?_=${Timestamp}" alt="Processing...">
                    </div>
                    </body>
                </html>`;
    }
    update() {
        let diagram = new Diagram().GetCurrent();
        if (fs.existsSync(this.prevPath)) {
            fs.unlinkSync(this.prevPath);
        }
        if (!diagram.content) {
            this.error = "No valid diagram found here!";
            this.Emittor.fire(this.Uri);
            return;
        }
        this.exporter.exportToFile(diagram, "svg", this.prevPath).then(
            svg => {
                this.error = "";
                this.Emittor.fire(this.Uri);
            },
            err => {
                this.error = err;
                this.Emittor.fire(this.Uri);
            }
        );
    };
    register(): vscode.Disposable[] {
        let disposable: vscode.Disposable;
        let disposables: vscode.Disposable[] = [];

        //register provider
        disposable = vscode.workspace.registerTextDocumentContentProvider('plantuml', this);
        disposables.push(disposable);

        //register command
        disposable = vscode.commands.registerCommand('plantuml.preview', () => {
            var editor = vscode.window.activeTextEditor;
            return vscode.commands.executeCommand('vscode.previewHtml', this.Uri, vscode.ViewColumn.Two, 'PlantUML Preview')
                .then(success => {
                    this.update();
                    return;
                }, reason => {
                    vscode.window.showErrorMessage(reason);
                });
        });
        disposables.push(disposable);

        //register watcher
        let lastTimestamp = new Date().getTime();
        disposable = vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor.document !== e.document || !this.autoUpdate) {
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

        return disposables;
    }
}