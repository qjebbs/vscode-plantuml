import * as vscode from 'vscode';
import * as fs from 'fs';
import * as zlib from 'zlib';

import { IRender, RenderTask, RenderError } from './interfaces'
import { Diagram, diagramStartReg } from '../diagram/diagram';
import { config } from '../config';
import { localize } from '../common';
import { addFileIndex } from '../tools';
import { httpConfig } from './httpConfig';
const request = require('request');

interface PlantumlServerError {
    error: string
    line: number
    description: string
}

class PlantumlServer implements IRender {
    /**
     * Indicates the exporter should limt concurrency or not.
     * @returns boolean
     */
    limitConcurrency(): boolean {
        return false;
    }
    /**
     * formats return an string array of formats that the exporter supports.
     * @returns an array of supported formats
     */
    formats(): string[] {
        return [
            "png",
            "svg",
            "txt"
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
        if (!config.server) {
            return <RenderTask>{
                processes: [],
                promise: Promise.reject(localize(53, null)),
            };
        }
        let allPms = [...Array(diagram.pageCount).keys()].map(
            (index) => {
                let requestUrl = this.makeURL(diagram, format, index);
                let savePath2 = savePath ? addFileIndex(savePath, index, diagram.pageCount) : "";
                return this.httpWrapper(requestUrl, savePath2).then(
                    result => new Promise<Buffer>(
                        (resolve, reject) => {
                            let stdout = result[0];
                            let stderr = result[1];
                            if (stderr) {
                                let err = stderr.plantumlError ?
                                    this.parsePlantumlError(stderr.plantumlError, diagram) :
                                    stderr.message
                                err = localize(10, null, diagram.title, err);
                                reject(err);
                            } else {
                                resolve(stdout)
                            };
                        }
                    )
                );
            },
            Promise.resolve(Buffer.alloc(0))
        );
        return <RenderTask>{
            processes: [],
            promise: Promise.all(allPms),
        }
    }
    getMapData(diagram: Diagram, savePath: string): RenderTask {
        return this.render(diagram, "map", savePath);
    }
    private httpWrapper(requestUrl: string, savePath?: string): Promise<[Buffer, any]> {
        return new Promise<[Buffer, any]>((resolve, reject) => {
            request(
                {
                    method: 'GET'
                    , uri: requestUrl
                    , encoding: null // for byte encoding. Otherwise string.
                    , gzip: true
                    , proxy: httpConfig.proxy()
                    , strictSSL: false
                }
                , (error, response, body) => {
                    let stdout = "";
                    let stderr = undefined;
                    if (!error) {
                        if (response.statusCode === 200) {
                            if (savePath) {
                                if (body.length) {
                                    fs.writeFileSync(savePath, body);
                                    stdout = savePath;
                                } else {
                                    stdout = "";
                                }
                            } else {
                                stdout = body
                            }
                        } else if (response.headers['x-plantuml-diagram-error']) {
                            stderr = {
                                plantumlError: <PlantumlServerError>{
                                    error: response.headers['x-plantuml-diagram-error'],
                                    line: parseInt(response.headers['x-plantuml-diagram-error-line']),
                                    description: response.headers['x-plantuml-diagram-description']
                                }
                            }
                            stdout = body
                        } else {
                            stderr = "Unexpected Error: "
                                + response.statusCode + "\n"
                                + "for GET " + requestUrl;
                        }
                    } else {
                        stderr = error;
                    }
                    resolve([Buffer.from(stdout), stderr]);
                })
        });
    }
    /**
     * make url for a diagram
     * @param diagram diagram to make the URL
     * @param format url format
     * @return string of URL
     */
    makeURL(diagram: Diagram, format: string, index: number): string {
        return [config.server.replace(/^\/|\/$/g, ""), format, index, this.urlTextFrom(diagram.content)].join("/");
    }
    private urlTextFrom(s: string): string {
        let opt: zlib.ZlibOptions = { level: 9 };
        let d = zlib.deflateRawSync(Buffer.from(s), opt) as Buffer;
        let b = encode64(String.fromCharCode(...d.subarray(0)));
        return b;
        // from synchro.js
        /* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
         * Version: 1.0.1
         * LastModified: Dec 25 1999
         */
        function encode64(data) {
            let r = "";
            for (let i = 0; i < data.length; i += 3) {
                if (i + 2 == data.length) {
                    r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
                } else if (i + 1 == data.length) {
                    r += append3bytes(data.charCodeAt(i), 0, 0);
                } else {
                    r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
                }
            }
            return r;
        }

        function append3bytes(b1, b2, b3) {
            let c1 = b1 >> 2;
            let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
            let c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
            let c4 = b3 & 0x3F;
            let r = "";
            r += encode6bit(c1 & 0x3F);
            r += encode6bit(c2 & 0x3F);
            r += encode6bit(c3 & 0x3F);
            r += encode6bit(c4 & 0x3F);
            return r;
        }
        function encode6bit(b) {
            if (b < 10) {
                return String.fromCharCode(48 + b);
            }
            b -= 10;
            if (b < 26) {
                return String.fromCharCode(65 + b);
            }
            b -= 26;
            if (b < 26) {
                return String.fromCharCode(97 + b);
            }
            b -= 26;
            if (b == 0) {
                return '-';
            }
            if (b == 1) {
                return '_';
            }
            return '?';
        }
    }

    private parsePlantumlError(error: PlantumlServerError, diagram: Diagram): any {
        let fileLine = error.line;
        if (diagramStartReg.test(diagram.lines[0])) fileLine += 1;
        let blankLineCount = 0;
        for (let i = 1; i < diagram.lines.length; i++) {
            if (diagram.lines[i].trim()) break;
            blankLineCount++;
        }
        fileLine += blankLineCount;
        let lineContent = diagram.lines[fileLine - 1];
        fileLine += diagram.start.line;
        return `${error.error} (@ Diagram Line ${error.line}, File Line ${fileLine})\n"${lineContent}"\n${error.description}\n`;
    }
}
export const plantumlServer = new PlantumlServer();