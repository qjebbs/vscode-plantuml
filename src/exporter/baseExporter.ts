import * as vscode from 'vscode';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';

import { IBaseExporter, ExportTask, ExportError } from './interfaces'
import { Diagram } from '../diagram';
import { context, localize } from '../planuml';
import { config } from '../config';
import { addFileIndex } from '../tools';

class BaseExporter implements IBaseExporter {
    private java: string = "java";
    private javeInstalled: boolean = true;

    constructor() {
        this.testJava();
    }
    private testJava() {
        var process = child_process.exec(this.java + " -version", (e, stdout, stderr) => {
            if (e instanceof Error) {
                this.javeInstalled = false;
            }
        });
    }
    limtConcurrency(): boolean {
        return true;
    }
    formats(): string[] {
        return [
            "png",
            "svg",
            "eps",
            "pdf",
            "vdx",
            "xmi",
            "scxml",
            "html",
            "txt",
            "utxt",
            "latex",
            "latex:nopreamble"
        ];
    }
    /**
     * export a diagram to file or to Buffer.
     * @param diagram The diagram to export.
     * @param format format of export file.
     * @param savePath if savePath is given, it exports to a file, or, to Buffer.
     * @returns A Promise of Buffer[], represents export file contents or export file paths
     */
    export(diagram: Diagram, format: string, savePath: string): ExportTask {
        if (!this.javeInstalled) {
            let pms = Promise.reject(localize(5, null));
            return <ExportTask>{ promise: pms };
        }
        if (!fs.existsSync(config.jar)) {
            let pms = Promise.reject(localize(6, null, context.extensionPath));
            return <ExportTask>{ promise: pms };
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
                                savePath2 = addFileIndex(savePath, index, diagram.pageCount);
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
}
export const baseExporter = new BaseExporter();