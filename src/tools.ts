import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { ExportError } from './exporter';

export function mkdirs(dirname, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback);
            });
        }
    });
}

export function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

export function isSubPath(from: string, to: string): boolean {
    let rel = path.relative(to, from);
    return !(path.isAbsolute(rel) || rel.substr(0, 2) == "..")
}

export function parseError(error: any): ExportError[] {
    let nb = new Buffer("");
    if (typeof (error) === "string") {
        return [<ExportError>{ error: error, out: nb }];
    } else if (error instanceof TypeError || error instanceof Error) {
        let err = error as TypeError;
        return [<ExportError>{ error: err.stack, out: nb }];
    } else if (error instanceof Array) {
        let arr = error as any[];
        if (!arr || !arr.length) return [];
        if (instanceOfExportError(arr[0])) return error as ExportError[];
    } else {
        return [error as ExportError];
    }
    return null;
    function instanceOfExportError(object: any): object is ExportError {
        return 'error' in object;
    }
}

export function showMessagePanel(panel: vscode.OutputChannel, message: any) {
    panel.clear();
    let errs: ExportError[];
    if (typeof (message) === "string") {
        panel.appendLine(message);
    } else if (errs = parseError(message)) {
        for (let e of errs) {
            panel.appendLine(e.error);
        }
    } else {
        panel.appendLine(new Object(message).toString());
    }
    panel.show();
}

export class StopWatch {
    public startTime: Date
    public endTime: Date
    start() {
        this.startTime = new Date();
    }
    stop(): number {
        this.endTime = new Date();
        return this.runTime();
    }
    runTime(): number {
        return this.endTime.getTime() - this.startTime.getTime();
    }
}