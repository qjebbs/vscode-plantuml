import * as vscode from 'vscode';
import { localize } from './planuml';

let conf = vscode.workspace.getConfiguration('plantuml');

class ConfigReader {
    private _read<T>(key: string): T {
        return conf.get<T>(key);
    }
    watch(): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(() => {
            conf = vscode.workspace.getConfiguration('plantuml');
        })
    }

    get fileExtensions(): string {
        let extReaded = this._read<string>('fileExtensions').replace(/\s/g, "")
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

    get exportSubFolder(): boolean {
        return this._read<boolean>('exportSubFolder');
    }

    get exportConcurrency(): number {
        return this._read<number>('exportConcurrency') || 3;
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
}

export const config = new ConfigReader();