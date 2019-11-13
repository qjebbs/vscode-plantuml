import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import { makePlantumlURL } from '../plantumlURL';
import { Diagram, diagramStartReg } from '../diagram/diagram';
import { RenderError } from './interfaces';

export const ERROR_405 = new Error("HTTP method POST is not supported by this URL");

export function httpWrapper(method: string, server: string, diagram: Diagram, format: string, index: number, savePath?: string): Promise<Buffer> {
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

    let u = url.parse(requestUrl);
    let protocol = u.protocol == "http:" ? http : https;
    return new Promise<Buffer>((resolve, reject) => {
        let buffBody: Buffer[] = [];
        let buffBodyLen = 0;
        let response: http.IncomingMessage;
        let httpError: any;

        let options = <https.RequestOptions>{
            protocol: u.protocol,
            auth: u.auth,
            host: u.host,
            hostname: u.hostname,
            port: parseInt(u.port),
            path: u.path,
            method: method,
        };

        let req = protocol.request(options, function (res) {
            // console.log('STATUS: ' + res.statusCode);
            // console.log('HEADERS: ' + JSON.stringify(res.headers));
            response = res
            // res.setEncoding('utf8');
            res.on('data', function (chunk: Buffer) {
                buffBody.push(chunk);
                buffBodyLen += chunk.length;
            });
        });

        req.on('error', function (err: Error) {
            httpError = err;
        });

        req.on('close', () => {
            if (httpError) {
                reject(httpError);
                return;
            }

            let body = Buffer.concat(buffBody, buffBodyLen);
            if (response.statusCode === 200) {
                if (savePath) {
                    if (body.length) {
                        fs.writeFileSync(savePath, body);
                        body = Buffer.from(savePath);
                    } else {
                        body = Buffer.from("");
                    }
                }
            } else if (response.headers['x-plantuml-diagram-error']) {
                httpError = parsePlantumlError(
                    response.headers['x-plantuml-diagram-error'],
                    parseInt(response.headers['x-plantuml-diagram-error-line']),
                    response.headers['x-plantuml-diagram-description'],
                    diagram
                );
            } else if (response.statusCode === 405) {
                reject(ERROR_405);
                return;
            } else {
                httpError = response.statusCode + " " + response.statusMessage + "\n\n" +
                    method + " " + requestPath;
            }
            if (httpError) {
                reject(<RenderError>{ error: httpError, out: body });
                return;
            }
            resolve(body);
        });

        if (method == "POST") {
            req.write(diagram.contentWithInclude);
        }
        req.end();
    });
}

function parsePlantumlError(error: string, line: number, description: string, diagram: Diagram): any {
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