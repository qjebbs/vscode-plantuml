import * as vscode from 'vscode';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';

import { IRender, RenderTask, RenderError } from './interfaces'
import { Diagram } from '../diagram/diagram';
import { config } from '../config';
import { context, localize } from '../common';
import { addFileIndex } from '../tools';

class LocalRender implements IRender {
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
    /**
     * Indicates the exporter should limt concurrency or not.
     * @returns boolean
     */
    limitConcurrency(): boolean {
        return true;
    }
    /**
     * formats return an string array of formats that the exporter supports.
     * @returns an array of supported formats
     */
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
     * @returns ExportTask.
     */
    render(diagram: Diagram, format: string, savePath: string): RenderTask {
        if (!this.javeInstalled) {
            let pms = Promise.reject(localize(5, null));
            return <RenderTask>{ promise: pms };
        }
        if (!fs.existsSync(config.jar)) {
            let pms = Promise.reject(localize(6, null, context.extensionPath));
            return <RenderTask>{ promise: pms };
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
                if (diagram.dir && path.isAbsolute(diagram.dir)) params.unshift('-Duser.dir=' + diagram.dir);
                //add user args
                params.unshift(...config.commandArgs);
                let process = child_process.spawn(this.java, params);
                processes.push(process);
                return pChain.then(
                    () => {

                        if (process.killed) {
                            buffers = null;
                            return Promise.resolve(null);
                        }

                        if (diagram.content !== null) {
                            process.stdin.write(diagram.content);
                            process.stdin.end();
                        }
                        let savePath2 = savePath ? addFileIndex(savePath, index, diagram.pageCount) : "";

                        let pms = this.processWrapper(process, savePath2).then(
                            result => new Promise<Buffer>((resolve, reject) => {
                                let stdout = result[0];
                                let stderr = result[1].toString();
                                if (stderr.length) {
                                    stderr = localize(10, null, diagram.title, stderr);
                                    reject(<RenderError>{ error: stderr, out: stdout });
                                } else {
                                    buffers.push(stdout);
                                    resolve(null)
                                };
                            })
                        );
                        return pms;
                    },
                    err => {
                        return Promise.reject(err);
                    }
                )
            },
            Promise.resolve(new Buffer(""))
        );
        return <RenderTask>{
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

    getMapData(diagram: Diagram, savePath: string): RenderTask {
        let processes: child_process.ChildProcess[] = [];
        let maps: Buffer[] = [];
        let pms = [...Array(diagram.pageCount).keys()].reduce((pChain, index) => {
            if (!diagram.content) return Promise.resolve(null);
            let params = [
                '-Djava.awt.headless=true',
                '-jar',
                config.jar,
                '-pipemap',
                "-pipeimageindex",
                `${index}`,
                '-charset',
                'utf-8',
            ];
            //add user args
            params.unshift(...config.commandArgs);
            let process = child_process.spawn(this.java, params);
            processes.push(process);
            return pChain.then(
                () => {

                    if (process.killed) {
                        return Promise.resolve(null);
                    }

                    if (diagram.content !== null) {
                        process.stdin.write(diagram.content);
                        process.stdin.end();
                    }

                    let savePath2 = savePath ? addFileIndex(savePath, index, diagram.pageCount) : "";

                    return this.processWrapper(process, savePath2).then(
                        result => new Promise<Buffer>((resolve, reject) => {
                            let stdout = result[0];
                            let stderr = result[1].toString();
                            if (stderr.length) {
                                stderr = localize(10, null, diagram.title, stderr);
                                reject(stderr);
                            } else {
                                maps.push(stdout);
                                resolve(null)
                            };
                        })
                    );
                },
                err => {
                    return Promise.reject(err);
                });
        }, Promise.resolve(null));
        return <RenderTask>{
            processes: processes,
            promise: new Promise<Buffer[]>(
                (resolve, reject) => {
                    pms.then(
                        () => {
                            resolve(maps);
                        },
                        err => {
                            reject(err);
                        }
                    )
                }
            )
        }
    }
    private processWrapper(process: child_process.ChildProcess, pipeFilePath?: string): Promise<[Buffer, Buffer]> {
        return new Promise<[Buffer, Buffer]>((resolve, reject) => {
            let buffOut: Buffer[] = [];
            let buffOutLen = 0;
            let buffErr: Buffer[] = [];
            let buffErrLen = 0;

            // let pipeFile = pipeFilePath ? fs.createWriteStream(pipeFilePath) : null;
            // if (pipeFile) process.stdout.pipe(pipeFile);

            process.stdout.on('data', function (x: Buffer) {
                buffOut.push(x);
                buffOutLen += x.length;
            });

            process.stderr.on('data', function (x: Buffer) {
                buffErr.push(x);
                buffErrLen += x.length;
            });

            process.stdout.on('close', () => {
                let stdout = Buffer.concat(buffOut, buffOutLen);
                if (pipeFilePath && stdout.length) {
                    fs.writeFileSync(pipeFilePath, stdout);
                    stdout = new Buffer(pipeFilePath);
                }
                let stderr = Buffer.concat(buffErr, buffErrLen);
                resolve([stdout, stderr]);
            });
        });
    }
}
export const localRender = new LocalRender();