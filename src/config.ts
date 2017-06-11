import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { localize, context } from './planuml';

let conf = vscode.workspace.getConfiguration('plantuml');

class ConfigReader {
    private _jar: string;

    private _read<T>(key: string): T {
        return conf.get<T>(key);
    }

    watch(): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(() => {
            conf = vscode.workspace.getConfiguration('plantuml');
            this._jar = "";
        })
    }

    get jar(): string {
        return this._jar || (() => {
            let jar = this._read<string>('jar');
            let intJar = path.join(context.extensionPath, "plantuml.jar");
            if (!jar) {
                jar = intJar;
            } else {
                if (!fs.existsSync(jar)) {
                    vscode.window.showWarningMessage(localize(19, null));
                    jar = intJar;
                }
            }
            this._jar = jar;
            return jar;
        })();
    }

    get fileExtensions(): string {
        let extReaded = this._read<string>('fileExtensions').replace(/\s/g, "");
        let exts = extReaded || ".*";
        if (exts.indexOf(",") > 0) exts = `{${exts}}`;
        //REG: .* | .wsd | {.wsd,.java}
        if (!exts.match(/^(.\*|\.\w+|\{\.\w+(,\.\w+)*\})$/)) {
            throw new Error(localize(18, null, extReaded));
        }
        return exts;
    }

    get exportOutDirName(): string {
        return this._read<string>('exportOutDirName') || "out";
    }

    get exportFormat(): string {
        return this._read<string>('exportFormat');
    }

    get exportInPlace(): boolean {
        return this._read<boolean>('exportInPlace');
    }

    get exportSubFolder(): boolean {
        return this._read<boolean>('exportSubFolder');
    }

    get exportConcurrency(): number {
        // note: node-plantuml is single-threaded, but that's OK because it is fast!
        //return this._read<number>('exportConcurrency') || 3;
        return 1;
    }

    get exportFormats(): string[] {
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

    get previewAutoUpdate(): boolean {
        return this._read<boolean>('previewAutoUpdate');
    }

    get previewFileType(): string {
        return this._read<string>('previewFileType') || "png";
    }

    get urlServer(): string {
        return this._read<string>('urlServer') || "http://www.plantuml.com/plantuml";
    }

    get urlFormat(): string {
        return this._read<string>('urlFormat');
    }

    get urlResult(): string {
        return this._read<string>('urlResult') || "MarkDown";
    }

    get urlFormats(): string[] {
        return [
            "png",
            "svg",
            "txt"
        ];
    }

    get previewFromUrlServer(): boolean {
        return this._read<boolean>('previewFromUrlServer');
    }

    get includes(): string[] {
        return this._read<string[]>('includes') || [];
    }
    get commandArgs(): string[] {
        return this._read<string[]>('commandArgs') || [];
    }
    get formatInLine(): boolean {
        return this._read<boolean>('experimental.formatInLine');
    }
}

export const config = new ConfigReader();