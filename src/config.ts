import * as vscode from 'vscode';

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
    get exportOutDirName(): string {
        return this._read<string>('exportOutDirName');
    }

    get exportFormat(): string {
        return this._read<string>('exportFormat');
    }

    get exportSubFolder(): boolean {
        return this._read<boolean>('exportSubFolder');
    }

    get exportConcurrency(): number {
        return this._read<number>('exportConcurrency');
    }

    get autoUpdatePreview(): boolean {
        return this._read<boolean>('autoUpdatePreview');
    }

    get urlServer(): string {
        return this._read<string>('urlServer');
    }

    get urlFormat(): string {
        return this._read<string>('urlFormat');
    }

    get urlResult(): string {
        return this._read<string>('urlResult');
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

    get urlFormats(): string[] {
        return [
            "png",
            "svg",
            "txt"
        ];
    }

    get fileSuffixes(): string[] {
        return [
            ".wsd",
            ".pu",
            ".puml",
            ".plantuml",
            ".iuml"
        ];
    }
}

export const config = new ConfigReader();