import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Diagram, Diagrams } from './diagram';

export class Exporter {
    private jar: string;
    private java: string = "java";
    private javeInstalled: boolean = true;

    constructor(public config: vscode.WorkspaceConfiguration, public context: vscode.ExtensionContext) {
        this.testJava();
        this.jar = path.join(context.extensionPath, "plantuml.jar");
        if (!fs.existsSync(this.jar)) {
            vscode.window.showErrorMessage("can't find 'plantuml.jar', please download and put it here: " +
                context.extensionPath);
        }
    }
    private testJava() {
        var process = child_process.exec(this.java + " -version", (e, stdout, stderr) => {
            if (e instanceof Error) {
                this.javeInstalled = false;
            }
        });
    }
    register(): vscode.Disposable[] {
        //register export
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.export', () => {
            try {
                this.export(false);
            } catch (error) {
                vscode.window.showErrorMessage(error)
            }
        });
        ds.push(d);
        d = vscode.commands.registerCommand('plantuml.exportAll', () => {
            try {
                this.export(true);
            } catch (error) {
                vscode.window.showErrorMessage(error)
            }
        });
        ds.push(d);
        return ds;
    }
    export(all: boolean) {
        let editor = vscode.window.activeTextEditor;
        let outputDefaultPath = path.dirname(editor.document.uri.fsPath);
        let ds = new Diagrams();
        if (all) {
            ds.AddAll();
        } else {
            let dg = new Diagram().GetCurrent();
            ds.Add(new Diagram().GetCurrent());
            editor.selections = [new vscode.Selection(dg.start, dg.end)];
        }
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let concurrency = this.config.get("exportConcurrency") as number;
        return this.doExports(ds.diagrams, concurrency, bar)
            .then(
            msgs => {
                bar.dispose();
                vscode.window.showInformationMessage("Export finish.");
            },
            msg => {
                bar.dispose();
                let m = msg as string
                console.log(m);
                vscode.window.showErrorMessage(m.replace(/\n/g, " "));
            }
            );
    }
    exportToFile(diagram: Diagram, format: string, savePath?: string, bar?: vscode.StatusBarItem) {
        if (!savePath) {
            let subDir = this.config.get("exportSubFolder") as boolean;
            let dir = diagram.dir;
            if (subDir) {
                dir = diagram.fileName.substr(0, diagram.fileName.lastIndexOf("."))
                if (!fs.existsSync(dir)) {
                    fs.mkdir(dir);
                }
            }
            savePath = path.join(dir, diagram.title + "." + format.split(":")[0])
        }
        return this.doExport(diagram, format, savePath, bar);
    }
    exportToBuffer(diagram: Diagram, format: string, bar?: vscode.StatusBarItem) {
        return this.doExport(diagram, format, null, bar);
    }
    private doExport(diagram: Diagram, format: string, savePath?: string, bar?: vscode.StatusBarItem) {
        if (!this.javeInstalled) {
            return Promise.reject("java not installed!");
        }
        if (bar) {
            bar.show();
            bar.text = "PlantUML exporting: " + diagram.title + "." + format.split(":")[0];
        }
        let params = [
            '-Duser.dir=' + diagram.dir,
            '-Djava.awt.headless=true',
            '-jar',
            this.jar,
            "-t" + format,
            '-pipe',
            '-charset',
            'utf-8'
        ];
        var process = child_process.spawn(this.java, params);
        if (diagram.content !== null) {
            process.stdin.write(diagram.content);
            process.stdin.end();
        }
        return new Promise((resolve, reject) => {
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
                if (!stderror) {
                    let stdout = Buffer.concat(buffs, bufflen)
                    resolve(stdout);
                } else {
                    reject(stderror);
                }
            })
            process.stderr.on('data', function (x) {
                stderror += x;
            });
        });
    }
    private doExports(diagrams: Diagram[], concurrency: number = 1, bar?: vscode.StatusBarItem) {
        let format = this.config.get("exportFormat") as string;
        concurrency = concurrency > diagrams.length ? diagrams.length : concurrency;
        let promises: Promise<{}>[] = [];
        for (let i = 0; i < concurrency; i++) {
            //each i starts a task chain, which export indexes like 0,3,6,9... (task 1, concurrency 3 for example.)
            promises.push(
                diagrams.reduce((prev: Promise<{}>, diagram: Diagram, index: number) => {
                    if (index % concurrency != i) {
                        // ignore indexes belongs to other task.chain
                        return prev;
                    }
                    return prev.then(
                        () => {
                            return this.exportToFile(diagram, format, null, bar);
                        },
                        err => {
                            return Promise.reject(err);
                        });
                }, Promise.resolve(""))
            );
        }
        return Promise.all(promises);
    }

}