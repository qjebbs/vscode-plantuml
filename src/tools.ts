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
        return [<ExportError>{ error: err.message, out: nb }];
    } else if (error instanceof Array) {
        return error as ExportError[];
    } else {
        return [error as ExportError];
    }
}

export function showError(panel: vscode.OutputChannel, errors: ExportError[]) {
    panel.clear();
    for (let e of errors) {
        panel.appendLine(e.error);
    }
    panel.show();
}