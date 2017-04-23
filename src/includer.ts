import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { config } from './config';
import { context } from './planuml';

class Includer {
    private _calculated: string
    private _includes: string

    addIncludes(content: string): string {
        if (this._calculated != config.includes.sort().toString()) this._calcIncludes();
        if (!this._includes) return content;
        return content.replace(/(@start.+)/i, `$1${this._includes}`);
    }
    private _calcIncludes() {
        let includes = "";
        let confs = config.includes;
        let paths = [];
        for (let i in confs) {
            let c = confs[i];
            if (!c) continue;
            if (!path.isAbsolute(c)) {
                paths.push(...(this._findWorkspace(c) || this._findIntegrated(c) || []));
                continue;
            }
            if (fs.existsSync(c)) paths.push(c);
        }
        this._includes = paths.reduce((pre, cur) => `${pre}\n!include ${cur}`, "");
        this._calculated = confs.sort().toString();
    }
    private _findWorkspace(p: string): string[] {
        if (!vscode.workspace.rootPath) return null;
        p = path.join(vscode.workspace.rootPath, p);
        if (fs.existsSync(p)) {
            if (fs.statSync(p).isDirectory) return fs.readdirSync(p).map(f => path.join(p, f));
            return [p];
        }
        return null;
    }
    private _findIntegrated(p: string): string[] {
        p = path.join(context.extensionPath, "includes", p + ".wsd");
        if (fs.existsSync(p)) return [p];
        return null;
    }
}
export const includer = new Includer();