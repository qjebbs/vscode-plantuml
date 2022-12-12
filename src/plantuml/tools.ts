import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import { RenderError } from './renders/interfaces';
import { Diagram } from './diagram/diagram';
import { config } from './config';
import { outputPanel } from './common';
import { HTTPError } from './renders/httpErrors';

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
    let nb = Buffer.alloc(0);
    if (typeof (error) === "string") {
        return [<RenderError>{ error: error, out: nb }];
    } else if (error instanceof TypeError || error instanceof Error) {
        let err = error as TypeError;
        return [<RenderError>{ error: err.stack, out: nb }];
    } else if (error instanceof HTTPError) {
        let err = error.originalError as TypeError;
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

export function showMessagePanel(message: any) {
    outputPanel.clear();
    let errs: RenderError[];
    if (typeof (message) === "string") {
        outputPanel.appendLine(message);
    } else if (errs = parseError(message)) {
        for (let e of errs) {
            outputPanel.appendLine(e.error);
        }
    } else {
        outputPanel.appendLine(new Object(message).toString());
    }
    outputPanel.show();
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
    // return "" if not saved.
    if (!path.isAbsolute(diagram.dir)) return "";

    let exportDir = "";
    let folder = vscode.workspace.getWorkspaceFolder(diagram.parentUri);
    if (!config.exportIncludeFolderHeirarchy(diagram.parentUri)) {
        exportDir = config.exportOutDir(diagram.parentUri).fsPath;
    } else if (folder) {
        let wkdir = folder ? folder.uri.fsPath : "";
        let diagramsRoot = config.diagramsRoot(diagram.parentUri).fsPath;
        let outDir = config.exportOutDir(diagram.parentUri).fsPath;
        if (diagramsRoot && isSubPath(diagram.path, diagramsRoot)) {
            // If current document is in diagramsRoot, organize exports in exportOutDir.
            exportDir = path.join(outDir, path.relative(diagramsRoot, diagram.dir));
        } else if (wkdir && isSubPath(diagram.path, wkdir)) {
            // If current document is in WorkspaceFolder, organize exports in %outDir%/_WorkspaceFolder_.
            exportDir = path.join(outDir, "__WorkspaceFolder__", path.relative(wkdir, diagram.dir));
        }
    } else {
        // export beside the document.
        exportDir = diagram.dir;
    }

    if (config.exportSubFolder(diagram.parentUri)) {
        exportDir = path.join(exportDir, diagram.fileName);
    }
    return path.join(exportDir, diagram.name + "." + format);
}
export function addFileIndex(fileName: string, index: number, count: number): string {
    if (count == 1) return fileName;
    let bsName = path.basename(fileName);
    let ext = path.extname(fileName);
    return path.join(
        path.dirname(fileName),
        bsName.substr(0, bsName.length - ext.length) + "-page" + (index + 1) + ext,
    );
}

export function testJava(java: string): boolean {
    try {
        let rt = child_process.spawnSync(java, ["-version"]);
        return rt.status == 0
    } catch (error) {
        return false
    }
}

let _javaExists: boolean = undefined;
export function javaCommandExists(): boolean {
    if (_javaExists) return _javaExists;
    if (process.platform == 'darwin') {
        _javaExists = isMacJavaInstalled();
    } else {
        let cmd = "which";
        if (process.platform == 'win32') cmd = "where";
        try {
            let rt = child_process.spawnSync(cmd, ["java"]);
            _javaExists = rt.stdout.toString().trim() !== "";
        } catch (error) {
            _javaExists = false
        }
    }
    return _javaExists;
}

function isMacJavaInstalled(): boolean {
    try {
        let rt = child_process.spawnSync("/usr/libexec/java_home");
        return rt.status == 0
    } catch (error) {
        return false
    }
}

export function fileToBase64(file: string): string {
    let mimeType = "";
    switch (path.extname(file)) {
        case '.svg':
            mimeType = 'image/svg+xml';
            break;
        case '.png':
            mimeType = 'image/png';
            break;
        default:
            break;
    }
    if (!mimeType) throw new Error("fileToBase64: Unsupported file type.");
    let b64 = fs.readFileSync(file).toString('base64');
    return `data:${mimeType};base64,${b64}`
}