import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import { RenderError } from './renders/interfaces';
import { Diagram } from './diagram/diagram';
import { config } from './config';

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

export function parseError(error: any): RenderError[] {
    let nb = new Buffer("");
    if (typeof (error) === "string") {
        return [<RenderError>{ error: error, out: nb }];
    } else if (error instanceof TypeError || error instanceof Error) {
        let err = error as TypeError;
        return [<RenderError>{ error: err.stack, out: nb }];
    } else if (error instanceof Array) {
        let arr = error as any[];
        if (!arr || !arr.length) return [];
        if (instanceOfExportError(arr[0])) return error as RenderError[];
    } else {
        return [error as RenderError];
    }
    return null;
    function instanceOfExportError(object: any): object is RenderError {
        return 'error' in object;
    }
}

export function showMessagePanel(panel: vscode.OutputChannel, message: any) {
    panel.clear();
    let errs: RenderError[];
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
export function calculateExportPath(diagram: Diagram, format: string): string {
    let outDirName = config.exportOutDirName;
    let subDir = config.exportSubFolder;
    let dir = "";
    let folder = vscode.workspace.getWorkspaceFolder(diagram.parentUri);
    let wkdir = folder ? folder.uri.fsPath : "";

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
export function addFileIndex(fileName: string, index: number, count: number): string {
    if (count == 1) return fileName;
    let bsName = path.basename(fileName);
    let ext = path.extname(fileName);
    return path.join(
        path.dirname(fileName),
        bsName.substr(0, bsName.length - ext.length) + " page " + (index + 1) + ext,
    );
}
export function processWrapper(process: child_process.ChildProcess, pipeFilePath?: string): Promise<[Buffer, Buffer]> {
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