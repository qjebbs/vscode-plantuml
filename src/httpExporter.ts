'use strict';

import * as vscode from 'vscode';
import * as request from 'request';

import { Diagram, Diagrams } from './diagram';
import { config } from './config';
import { urlMaker } from './urlMaker';
import { ExportError, ExportTask } from './exporter';
import { localize } from './planuml';



class HttpExporter {

    /**
     * export a diagram to Buffer.
     * @param diagram The diagram to export.
     * @param format format of export file.
     * @returns A Promise of Buffer.
     */
    exportToBuffer(diagram: Diagram, format: string): ExportTask {
        return this.doExport(diagram, format);
    }

    private doExport(diagram: Diagram, format: string): ExportTask {
        
        let pURL = urlMaker.makeURL(diagram, config.urlServer, format, null);

        // console.log("Exporting preview image from %s", pURL.url);
        let pms = new Promise<Buffer>((resolve, reject) => {

            request(
                { method: 'GET'
                , uri: "pURL.url"
                , encoding: null // for byte encoding. Otherwise string.
                , gzip: true
                }
            , function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(body);
                } else {
                    let stderror;
                    if (!error) {
                        stderror = "Unexpected Statuscode: " 
                            + response.statusCode + "\n"
                            + "for GET " + pURL.url;
                    } else {
                        stderror = error.message;
                        body = new Buffer("");
                    }
                    stderror = localize(10, null, diagram.title, stderror);
                    reject(<ExportError>{ error: stderror, out: body });
                }
            })
        });
        return <ExportTask>{ promise: pms };

    }
}

export const httpExporter = new HttpExporter();

