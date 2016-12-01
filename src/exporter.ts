import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Diagram, Diagrams } from './diagram';
import { ExportFormats } from './base';

export interface ExportError {
    error: string;
    out: Buffer;
}

export class Exporter {
    private jar: string;
    private java: string = "java";
    private javeInstalled: boolean = true;

    constructor(public config: vscode.WorkspaceConfiguration, public context: vscode.ExtensionContext) {
        this.testJava();
        this.jar = path.join(context.extensionPath, "plantuml.jar");
    }
    private testJava() {
        var process = child_process.exec(this.java + " -version", (e, stdout, stderr) => {
            if (e instanceof Error) {
                this.javeInstalled = false;
            }
        });
    }
    register(): vscode.Disposable[] {
        function showError(error) {
            let err = error as TypeError;
            console.log(error);
            vscode.window.showErrorMessage(err.message);
        }
        //register export
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.exportCurrent', () => {
            try {
                this.exportDocument(false);
            } catch (error) {
                showError(error);
            }
        });
        ds.push(d);
        d = vscode.commands.registerCommand('plantuml.exportDocument', () => {
            try {
                this.exportDocument(true);
            } catch (error) {
                showError(error);
            }
        });
        ds.push(d);
        return ds;
    }
    async exportURI(uri: vscode.Uri, format: string, concurrency?: number, bar?: vscode.StatusBarItem) {
        let doc = await vscode.workspace.openTextDocument(uri);
        let ds = new Diagrams().AddDocument(doc)
        return this.doExports(ds.diagrams, concurrency, format, bar);
    }
    exportToFile(diagram: Diagram, format: string, savePath?: string, bar?: vscode.StatusBarItem): Promise<Buffer> {
        if (!savePath) {
            let dir = diagram.dir;
            if (!path.isAbsolute(dir)) return Promise.reject<ExportError>({
                error: "Please save the file before you export its diagrams.",
                out: new Buffer("")
            });
            let subDir = this.config.get("exportSubFolder") as boolean;
            if (subDir) {
                dir = path.join(diagram.dir, diagram.fileName);
                if (!fs.existsSync(dir)) {
                    fs.mkdir(dir);
                }
            }
            savePath = path.join(dir, diagram.title + "." + format.split(":")[0])
        }
        return this.doExport(diagram, format, savePath, bar);
    }
    exportToBuffer(diagram: Diagram, format: string, bar?: vscode.StatusBarItem): Promise<Buffer> {
        return this.doExport(diagram, format, null, bar);
    }
    private async exportDocument(all: boolean) {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("No active document to export.");
            return;
        }
        let outputDefaultPath = path.dirname(editor.document.uri.fsPath);
        let format = this.config.get("exportFormat") as string;
        if (!format) {
            format = await vscode.window.showQuickPick(ExportFormats);
            if (!format) return;
        }
        let ds = new Diagrams();
        if (all) {
            ds.AddDocument();
            if (!ds.diagrams.length) {
                vscode.window.showWarningMessage("No valid diagram found!");
                return;
            }
        } else {
            let dg = new Diagram().GetCurrent();
            if (!dg.content) {
                vscode.window.showWarningMessage("No valid diagram found here!");
                return;
            }
            ds.Add(dg);
            editor.selections = [new vscode.Selection(dg.start, dg.end)];
        }
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let concurrency = this.config.get("exportConcurrency") as number;
        this.doExports(ds.diagrams, concurrency, format, bar).then(
            results => {
                bar.dispose();
                if (results.length) {
                    vscode.window.showInformationMessage(`${results.length} diagrams exported.`);
                }
            },
            error => {
                bar.dispose();
                let err = error as ExportError;
                let m = err.error as string
                console.log(m);
                vscode.window.showErrorMessage(m.replace(/\n/g, " "));
            }
        );
        return;
    }
    private doExport(diagram: Diagram, format: string, savePath?: string, bar?: vscode.StatusBarItem): Promise<Buffer> {
        if (!this.javeInstalled) {
            return Promise.reject<ExportError>({
                error: "java not installed!\nIf you've installed java, please add java bin path to PATH environment variable.",
                out: new Buffer("")
            });
        }
        if (!fs.existsSync(this.jar)) {
            return Promise.reject<ExportError>({
                error: "Can't find 'plantuml.jar'.Please download and place it here: \n" + this.context.extensionPath,
                out: new Buffer("")
            });
        }
        if (bar) {
            bar.show();
            bar.text = "PlantUML exporting: " + diagram.title + "." + format.split(":")[0];
        }
        let params = [
            '-Djava.awt.headless=true',
            '-jar',
            this.jar,
            "-t" + format,
            '-pipe',
            '-charset',
            'utf-8'
        ];
        if (path.isAbsolute(diagram.dir)) params.unshift('-Duser.dir=' + diagram.dir);

        var process = child_process.spawn(this.java, params);
        if (diagram.content !== null) {
            process.stdin.write(diagram.content);
            process.stdin.end();
        }
        return new Promise<Buffer>((resolve, reject) => {
            let buffs: Buffer[] = [];
            let bufflen = 0;
            let stderror = '';
            if (savePath) {
                let f = fs.createWriteStream(savePath);
                process.stdout.pipe(f);
            } else {
                process.stdout.on('data', function (x: Buffer) {
                    buffs.push(x);
                    bufflen += x.length;
                });
            }
            process.stdout.on('close', function () {
                let stdout = Buffer.concat(buffs, bufflen)
                if (!stderror) {
                    resolve(stdout);
                } else {
                    reject(<ExportError>{ error: stderror, out: stdout });
                }
            })
            process.stderr.on('data', function (x) {
                stderror += x;
            });
        });
    }
    private doExports(diagrams: Diagram[], concurrency: number = 1, format: string, bar?: vscode.StatusBarItem): Promise<Buffer[]> {
        concurrency = concurrency > diagrams.length ? diagrams.length : concurrency;
        let promises: Promise<Buffer>[] = [];
        for (let i = 0; i < concurrency; i++) {
            //each i starts a task chain, which export indexes like 0,3,6,9... (task 1, concurrency 3 for example.)
            promises.push(
                diagrams.reduce((prev: Promise<Buffer>, diagram: Diagram, index: number) => {
                    if (index % concurrency != i) {
                        // ignore indexes belongs to other task.chain
                        return prev;
                    }
                    return prev.then(
                        () => {
                            return this.exportToFile(diagram, format, null, bar);
                        },
                        err => {
                            let result = err as ExportError;
                            return Promise.reject<ExportError>({ error: result.error, out: result.out });
                        });
                }, Promise.resolve(""))
            );
        }
        return Promise.all<Buffer>(promises);
    }
}