import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';

import { IRender, RenderTask, RenderError } from './interfaces'
import { Diagram, diagramStartReg } from '../diagram/diagram';
import { config } from '../config';
import { localize } from '../common';
import { addFileIndex } from '../tools';
import { httpConfig } from './httpConfig';
import { makePlantumlURL } from '../plantumlURL';

const ERROR_405 = new Error("HTTP method POST is not supported by this URL");

interface Dictionary<T> {
    [key: string]: T;
}
let noPOSTServers: Dictionary<boolean> = {};

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
        let server = config.server;
        if (!server) {
            return <RenderTask>{
                processes: [],
                promise: Promise.reject(localize(53, null)),
            };
        }
        let allPms = [...Array(diagram.pageCount).keys()].map(
            (index) => {
                let savePath2 = savePath ? addFileIndex(savePath, index, diagram.pageCount) : "";
                if (noPOSTServers[server]) {
                    // Servers like the official one doesn't support POST
                    return this.httpWrapper("GET", server, diagram, format, index, savePath2);
                } else {
                    return this.httpWrapper("POST", server, diagram, format, index, savePath2)
                        .catch(
                            err => {
                                if (err === ERROR_405) {
                                    // do not retry POST again with this server
                                    noPOSTServers[server] = true
                                    // fallback to GET
                                    return this.httpWrapper("GET", server, diagram, format, index, savePath2)
                                }
                                return Promise.reject(err)
                            }
                        )
                }
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
    private httpWrapper(method: string, server: string, diagram: Diagram, format: string, index: number, savePath?: string): Promise<Buffer> {
        let requestPath: string, requestUrl: string;
        requestPath = [server, format, index, "..."].join("/");
        switch (method) {
            case "GET":
                requestUrl = makePlantumlURL(server, diagram, format, index);
                break;
            case "POST":
                // "om80" is used to bypass the pagination bug of the POST method.
                // https://github.com/plantuml/plantuml-server/pull/74#issuecomment-551061156
                requestUrl = [server, format, index, "om80"].join("/");
                break;
            default:
                return Promise.reject("Unsupported request method: " + method);
        }
        return new Promise<Buffer>((resolve, reject) => {
            request(
                {
                    method: method,
                    uri: requestUrl,
                    gzip: true,
                    proxy: httpConfig.proxy(),
                    strictSSL: false,
                    body: (method == "POST") ? Buffer.from(diagram.content) : null,
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
                                stdout = body;
                            }
                        } else if (response.headers['x-plantuml-diagram-error']) {
                            stderr = this.parsePlantumlError(
                                response.headers['x-plantuml-diagram-error'],
                                parseInt(response.headers['x-plantuml-diagram-error-line']),
                                response.headers['x-plantuml-diagram-description'],
                                diagram
                            );
                            stdout = body;
                        } else if (response.statusCode === 405) {
                            reject(ERROR_405);
                            return;
                        } else {
                            stderr = response.statusCode + " " + response.statusMessage + "\n\n" +
                                method + " " + requestPath;
                        }
                    } else {
                        stderr = error.code + " " + error.message + "\n" +
                            error.stack + "\n\n" +
                            method + " " + requestPath;
                    }
                    if (stderr) {
                        stderr = localize(10, null, diagram.title, stderr);
                        reject(<RenderError>{ error: stderr, out: Buffer.from(stdout) });
                    } else {
                        resolve(Buffer.from(stdout));
                    }
                })
        });
    }

    private parsePlantumlError(error: string, line: number, description: string, diagram: Diagram): any {
        if (diagramStartReg.test(diagram.lines[0])) line += 1;
        let fileLine = line;
        let blankLineCount = 0;
        for (let i = 1; i < diagram.lines.length; i++) {
            if (diagram.lines[i].trim()) break;
            blankLineCount++;
        }
        fileLine += blankLineCount;
        let lineContent = diagram.lines[fileLine - 1];
        fileLine += diagram.start.line;
        return `${error} (@ Diagram Line ${line}, File Line ${fileLine})\n"${lineContent}"\n${description}\n`;
    }
}
export const plantumlServer = new PlantumlServer();