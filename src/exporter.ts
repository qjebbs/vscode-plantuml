import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as nls from "vscode-nls";
import { Diagram, Diagrams } from './diagram';
import { ExportFormats } from './settings';
import { mkdirsSync, isSubPath, showError, parseError } from './tools';

export interface ExportError {
    error: string;
    out: Buffer;
}

export interface ExportTask {
    process: child_process.ChildProcess;
    promise: Promise<Buffer>;
}

export class Exporter {
    private jar: string;
    private java: string = "java";
    private javeInstalled: boolean = true;

    constructor(
        public config: vscode.WorkspaceConfiguration,
        public context: vscode.ExtensionContext,
        public outputPanel: vscode.OutputChannel,
        public localize: nls.LocalizeFunc
    ) {
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
        //register export
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.exportCurrent', () => {
            this.exportDocument(false);
        });
        ds.push(d);
        d = vscode.commands.registerCommand('plantuml.exportDocument', () => {
            this.exportDocument(true);
        });
        ds.push(d);
        return ds;
    }
    async exportURI(uri: vscode.Uri, format: string, dir?: string, concurrency?: number, bar?: vscode.StatusBarItem) {
        let doc = await vscode.workspace.openTextDocument(uri);
        let ds = new Diagrams().AddDocument(doc)
        if (!ds.diagrams.length) return Promise.resolve(<Buffer[]>[]);
        let p = this.doExports(ds.diagrams, format, dir, concurrency, bar);
        return new Promise<Buffer[]>((resolve, reject) => {
            p.then(
                r => { resolve(r) },
                e => { reject(e) }
            )
        })
    }
    exportToFile(diagram: Diagram, format: string, savePath: string, bar?: vscode.StatusBarItem): ExportTask {
        return this.doExport(diagram, format, savePath, bar);
    }
    exportToBuffer(diagram: Diagram, format: string, bar?: vscode.StatusBarItem): ExportTask {
        return this.doExport(diagram, format, "", bar);
    }
    private async exportDocument(all: boolean) {
        try {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage(this.localize(0, null));
                return;
            }
            if (!path.isAbsolute(editor.document.fileName)) {
                vscode.window.showInformationMessage(this.localize(1, null));
                return;
            };
            let format = this.config.get("exportFormat") as string;
            if (!format) {
                format = await vscode.window.showQuickPick(ExportFormats);
                if (!format) return;
            }
            this.outputPanel.clear();
            let ds = new Diagrams();
            if (all) {
                ds.AddDocument();
                if (!ds.diagrams.length) {
                    vscode.window.showInformationMessage(this.localize(2, null));
                    return;
                }
            } else {
                let dg = new Diagram().GetCurrent();
                if (!dg.content) {
                    vscode.window.showInformationMessage(this.localize(3, null));
                    return;
                }
                ds.Add(dg);
                editor.selections = [new vscode.Selection(dg.start, dg.end)];
            }
            let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            let concurrency = this.config.get("exportConcurrency") as number;
            let outDirName = this.config.get("exportOutDirName") as number;
            let dir = "";
            let wkdir = vscode.workspace.rootPath;
            //if current document is in workspace, organize exports in 'out' directory.
            //if not, export beside the document.
            if (wkdir && isSubPath(editor.document.fileName, wkdir)) dir = path.join(wkdir, outDirName);
            this.doExports(ds.diagrams, format, dir, concurrency, bar).then(
                results => {
                    bar.dispose();
                    if (results.length) {
                        vscode.window.showInformationMessage(this.localize(4, null));
                    }
                },
                error => {
                    bar.dispose();
                    let err = parseError(error);
                    showError(this.outputPanel, err);
                }
            );
        } catch (error) {
            let err = parseError(error);
            showError(this.outputPanel, err);
        }
        return;
    }
    /**
     * export a diagram to file or to Buffer.
     * @param diagram The diagram to export.
     * @param format format of export file.
     * @param savePath if savePath is given, it exports to a file, or, to Buffer.
     * @returns A Promise of Buffer.
     */
    private doExport(diagram: Diagram, format: string, savePath: string, bar: vscode.StatusBarItem): ExportTask {
        if (!this.javeInstalled) {
            let pms = Promise.reject(this.localize(5, null));
            return <ExportTask>{ promise: pms };
        }
        if (!fs.existsSync(this.jar)) {
            let pms = Promise.reject(this.localize(6, null, this.context.extensionPath));
            return <ExportTask>{ promise: pms };
        }
        if (bar) {
            bar.show();
            bar.text = this.localize(7, null, diagram.title + "." + format.split(":")[0]);
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

        let process = child_process.spawn(this.java, params);
        if (diagram.content !== null) {
            process.stdin.write(diagram.content);
            process.stdin.end();
        }
        let pms = new Promise<Buffer>((resolve, reject) => {
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
            process.stdout.on('close', () => {
                let stdout = Buffer.concat(buffs, bufflen)
                if (!stderror) {
                    resolve(stdout);
                } else {
                    stderror = this.localize(10, null, diagram.title, stderror);
                    reject(<ExportError>{ error: stderror, out: stdout });
                }
            })
            process.stderr.on('data', function (x) {
                stderror += x;
            });
        });
        return <ExportTask>{ process: process, promise: pms };
    }
    /**
     * export diagrams to file.
     * @param diagrams The diagrams array to export.
     * @param format format of export file.
     * @param dir if dir is given, it exports files to this dir which has same structure to files in workspace. Or, directly to workspace dir.
     * @returns A Promise of Buffer array.
     */
    private doExports(diagrams: Diagram[], format: string, dir: string, concurrency: number, bar: vscode.StatusBarItem): Promise<Buffer[]> {
        concurrency = concurrency > 0 ? concurrency : 1
        concurrency = concurrency > diagrams.length ? diagrams.length : concurrency;
        let promises: Promise<Buffer>[] = [];
        let errors: ExportError[] = [];
        for (let i = 0; i < concurrency; i++) {
            //each i starts a task chain, which export indexes like 0,3,6,9... (task 1, concurrency 3 for example.)
            promises.push(
                diagrams.reduce((prev: Promise<Buffer>, diagram: Diagram, index: number) => {
                    if (index % concurrency != i) {
                        // ignore indexes belongs to other task chain
                        return prev;
                    }
                    let exportDir = diagram.dir;
                    if (!path.isAbsolute(exportDir)) return Promise.reject(this.localize(1, null));
                    let wkDir = vscode.workspace.rootPath;
                    if (dir && wkDir) {
                        let temp = path.relative(wkDir, exportDir);
                        exportDir = path.join(dir, temp);
                    }
                    let subDir = this.config.get("exportSubFolder") as boolean;
                    if (subDir) {
                        exportDir = path.join(exportDir, diagram.fileName);
                    }
                    mkdirsSync(exportDir);
                    let savePath = path.join(exportDir, diagram.title + "." + format.split(":")[0])
                    return prev.then(
                        () => {
                            return this.exportToFile(diagram, format, savePath, bar).promise;
                        },
                        err => {
                            errors.push(...parseError(err));
                            // return Promise.reject(err);
                            //continue next diagram
                            return this.exportToFile(diagram, format, savePath, bar).promise;
                        });
                }, Promise.resolve(new Buffer(""))).then(
                    //to push last error of a chain
                    r => {
                        return r;
                    },
                    err => {
                        errors.push(...parseError(err));
                        return;
                    })
            );
        }
        let all = Promise.all(promises);
        return new Promise((resolve, reject) => {
            all.then(
                r => {
                    if (errors.length) reject(errors); else resolve(r)
                }
            );
        });
    }
}