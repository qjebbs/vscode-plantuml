import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { Diagram, Diagrams } from './diagram';
import { config } from './config';
import { outputPanel, context, localize } from './planuml';
import { mkdirsSync, isSubPath, showMessagePanel, parseError, StopWatch } from './tools';

export interface ExportError {
    error: string;
    out: Buffer;
}

export interface ExportTask {
    processes: child_process.ChildProcess[];
    promise: Promise<Buffer[]>;
}

class Exporter {
    private java: string = "java";
    private javeInstalled: boolean = true;

    initialize() {
        this.testJava();
    }
    private testJava() {
        var process = child_process.exec(this.java + " -version", (e, stdout, stderr) => {
            if (e instanceof Error) {
                this.javeInstalled = false;
            }
        });
    }
    register(): vscode.Disposable[] {
        this.initialize();
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
    async exportURI(uri: vscode.Uri, format: string, concurrency?: number, bar?: vscode.StatusBarItem): Promise<Buffer[][]> {
        let doc = await vscode.workspace.openTextDocument(uri);
        let ds = new Diagrams().AddDocument(doc)
        if (!ds.diagrams.length) return Promise.resolve(<Buffer[][]>[]);
        return this.doExports(ds.diagrams, format, concurrency, bar);
    }
    exportToFile(diagram: Diagram, format: string, savePath: string, bar?: vscode.StatusBarItem): ExportTask {
        return this.doExport(diagram, format, savePath, bar);
    }
    exportToBuffer(diagram: Diagram, format: string, bar?: vscode.StatusBarItem): ExportTask {
        return this.doExport(diagram, format, "", bar);
    }
    calculateExportPath(diagram: Diagram, format: string): string {
        let outDirName = config.exportOutDirName;
        let subDir = config.exportSubFolder;
        let dir = "";
        let wkdir = vscode.workspace.rootPath;
        //if current document is in workspace, organize exports in 'out' directory.
        //if not, export beside the document.
        if (wkdir && isSubPath(diagram.path, wkdir)) dir = path.join(wkdir, outDirName);

        let exportDir = diagram.dir;
        if (!path.isAbsolute(exportDir)) return "";
        if (dir && wkdir) {
            let temp = path.relative(wkdir, exportDir);
            exportDir = path.join(dir, temp);
        }
        if (subDir) {
            exportDir = path.join(exportDir, diagram.fileName);
        }
        return path.join(exportDir, diagram.title + "." + format);
    }
    addFileIndex(fileName: string, index: number, count: number): string {
        if (count == 1) return fileName;
        let bsName = path.basename(fileName);
        let ext = path.extname(fileName);
        return path.join(
            path.dirname(fileName),
            bsName.substr(0, bsName.length - ext.length) + "-" + (index + 1) + ext,
        );
    }
    private async exportDocument(all: boolean) {
        try {
            let stopWatch = new StopWatch();
            stopWatch.start();
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage(localize(0, null));
                return;
            }
            if (!path.isAbsolute(editor.document.fileName)) {
                vscode.window.showInformationMessage(localize(1, null));
                return;
            };
            let format = config.exportFormat;
            if (!format) {
                format = await vscode.window.showQuickPick(config.exportFormats);
                if (!format) return;
            }
            outputPanel.clear();
            let ds = new Diagrams();
            if (all) {
                ds.AddDocument();
                if (!ds.diagrams.length) {
                    vscode.window.showInformationMessage(localize(2, null));
                    return;
                }
            } else {
                let dg = new Diagram().GetCurrent();
                if (!dg.content) {
                    vscode.window.showInformationMessage(localize(3, null));
                    return;
                }
                ds.Add(dg);
                editor.selections = [new vscode.Selection(dg.start, dg.end)];
            }
            let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            let concurrency = config.exportConcurrency;
            this.doExports(ds.diagrams, format, concurrency, bar).then(
                async results => {
                    stopWatch.stop();
                    bar.dispose();
                    if (!results.length) return;
                    let viewReport = localize(26, null);
                    let btn = await vscode.window.showInformationMessage(localize(4, null), viewReport);
                    if (btn !== viewReport) return;
                    let fileCnt = 0;
                    let fileLst = results.reduce((p, c) => {
                        fileCnt += c.length;
                        return p + "\n" + c.join("\n");
                    }, "");
                    showMessagePanel(
                        outputPanel,
                        localize(27, null, ds.diagrams.length, fileCnt, stopWatch.runTime() / 1000) + fileLst
                    );
                },
                error => {
                    bar.dispose();
                    showMessagePanel(outputPanel, error);
                }
            );
        } catch (error) {
            showMessagePanel(outputPanel, error);
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
            let pms = Promise.reject(localize(5, null));
            return <ExportTask>{ promise: pms };
        }
        if (!fs.existsSync(config.jar)) {
            let pms = Promise.reject(localize(6, null, context.extensionPath));
            return <ExportTask>{ promise: pms };
        }
        if (bar) {
            bar.show();
            bar.text = localize(7, null, diagram.title + "." + format.split(":")[0]);
        }

        let processes: child_process.ChildProcess[] = [];
        let buffers: Buffer[] = [];
        //make a promise chain that export only one page at a time
        //but processes are all started at the begining, and recorded for later process.
        let pms = [...Array(diagram.pageCount).keys()].reduce(
            (pChain, index) => {
                let params = [
                    '-Djava.awt.headless=true',
                    '-jar',
                    config.jar,
                    "-pipeimageindex",
                    `${index}`,
                    "-t" + format,
                    '-pipe',
                    '-charset',
                    'utf-8',
                ];
                if (path.isAbsolute(diagram.dir)) params.unshift('-Duser.dir=' + diagram.dir);
                //add user args
                params.unshift(...config.commandArgs);
                let process = child_process.spawn(this.java, params);
                processes.push(process);
                return pChain.then(
                    result => {

                        if (process.killed) {
                            buffers = null;
                            return Promise.resolve(null);
                        }

                        if (diagram.content !== null) {
                            process.stdin.write(diagram.content);
                            process.stdin.end();
                        }

                        let pms = new Promise<Buffer>((resolve, reject) => {
                            let buffs: Buffer[] = [];
                            let bufflen = 0;
                            let stderror = '';
                            let savePath2 = "";
                            if (savePath) {
                                savePath2 = this.addFileIndex(savePath, index, diagram.pageCount);
                                let f = fs.createWriteStream(savePath2);
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
                                    if (!savePath) {
                                        buffers.push(stdout);
                                    } else {
                                        buffers.push(new Buffer(savePath2));
                                    }
                                    resolve(null);
                                } else {
                                    stderror = localize(10, null, diagram.title, stderror);
                                    reject(<ExportError>{ error: stderror, out: stdout });
                                }
                            })
                            process.stderr.on('data', function (x) {
                                stderror += x;
                            });
                        });
                        return pms;
                    },
                    err => {
                        return Promise.reject(err);
                    }
                )
            },
            Promise.resolve(new Buffer(""))
        );
        return <ExportTask>{
            processes: processes,
            promise: new Promise<Buffer[]>(
                (resolve, reject) => {
                    pms.then(
                        () => {
                            resolve(buffers);
                        },
                        err => {
                            reject(err);
                        }
                    )
                }
            )
        }
    }
    /**
     * export diagrams to file.
     * @param diagrams The diagrams array to export.
     * @param format format of export file.
     * @param dir if dir is given, it exports files to this dir which has same structure to files in workspace. Or, directly to workspace dir.
     * @returns A Promise of Buffer array.
     */
    private doExports(diagrams: Diagram[], format: string, concurrency: number, bar: vscode.StatusBarItem): Promise<Buffer[][]> {
        concurrency = concurrency > 0 ? concurrency : 1
        concurrency = concurrency > diagrams.length ? diagrams.length : concurrency;
        let promises: Promise<Buffer[]>[] = [];
        let errors: ExportError[] = [];
        for (let i = 0; i < concurrency; i++) {
            //each i starts a task chain, which export indexes like 0,3,6,9... (task 1, concurrency 3 for example.)
            promises.push(
                diagrams.reduce((prev: Promise<Buffer[]>, diagram: Diagram, index: number) => {
                    if (index % concurrency != i) {
                        // ignore indexes belongs to other task chain
                        return prev;
                    }
                    if (!path.isAbsolute(diagram.dir)) return Promise.reject(localize(1, null));

                    let savePath = this.calculateExportPath(diagram, format.split(":")[0]);
                    mkdirsSync(path.dirname(savePath));
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
                }, Promise.resolve(<Buffer[]>[])).then(
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

export const exporter = new Exporter();