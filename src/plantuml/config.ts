import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { localize, context } from './common';

export const RenderType = {
    Local: 'Local',
    PlantUMLServer: 'PlantUMLServer'
};

type ConfigMap = {
    [key: string]: vscode.WorkspaceConfiguration;
}

let conf = vscode.workspace.getConfiguration('plantuml');

class ConfigReader {
    private _folderConfs: ConfigMap = {};
    private _jar: string;

    private _read<T>(key: string, uri?: vscode.Uri) {
        if (!uri) return conf.get<T>(key);
        let folderConf = this._folderConfs[uri.fsPath];
        if (!folderConf) folderConf = vscode.workspace.getConfiguration('plantuml', uri);
        this._folderConfs[uri.fsPath] = folderConf;
        let results = folderConf.inspect<T>(key);
        if (results.workspaceFolderValue !== undefined) return results.workspaceFolderValue;
        if (results.workspaceValue !== undefined) return results.workspaceValue;
        if (results.globalValue !== undefined) return results.globalValue;
        return results.defaultValue;
    }

    watch(): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(() => {
            conf = vscode.workspace.getConfiguration('plantuml');
            this._jar = "";
            if (!vscode.workspace.workspaceFolders) return;
            this._folderConfs = {};
            vscode.workspace.workspaceFolders.map(
                f => this._folderConfs[f.uri.fsPath] = vscode.workspace.getConfiguration('plantuml', f.uri)
            );
        });
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

    fileExtensions(uri: vscode.Uri): string {
        let extReaded = this._read<string>('fileExtensions', uri).replace(/\s/g, "");
        let exts = extReaded || ".*";
        if (exts.indexOf(",") > 0) exts = `{${exts}}`;
        //REG: .* | .wsd | {.wsd,.java}
        if (!exts.match(/^(.\*|\.\w+|\{\.\w+(,\.\w+)*\})$/)) {
            throw new Error(localize(18, null, extReaded));
        }
        return exts;
    }

    exportOutDirName(uri: vscode.Uri): string {
        return this._read<string>('exportOutDirName', uri) || "out";
    }

    exportFormat(uri: vscode.Uri): string {
        return this._read<string>('exportFormat', uri);
    }

    exportSubFolder(uri: vscode.Uri): boolean {
        return this._read<boolean>('exportSubFolder', uri);
    }

    get exportConcurrency(): number {
        return this._read<number>('exportConcurrency') || 3;
    }

    exportMapFile(uri: vscode.Uri): boolean {
        return this._read<boolean>('exportMapFile', uri) || false;
    }

    get previewAutoUpdate(): boolean {
        return this._read<boolean>('previewAutoUpdate');
    }

    get previewFileType(): string {
        return this._read<string>('previewFileType') || "png";
    }

    get server(): string {
        return this._read<string>('server') || "http://www.plantuml.com/plantuml";
    }

    get serverIndexParameter(): string {
        return this._read<string>('serverIndexParameter');
    }

    get urlFormat(): string {
        return this._read<string>('urlFormat');
    }

    get urlResult(): string {
        return this._read<string>('urlResult') || "MarkDown";
    }

    get render(): string {
        return this._read<string>('render');
    }

    includes(uri: vscode.Uri): string[] {
        return this._read<string[]>('includes', uri);
    }
    get commandArgs(): string[] {
        return this._read<string[]>('commandArgs') || [];
    }
}

export const config = new ConfigReader();