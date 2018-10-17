import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { localize, extensionPath } from './common';
import { ConfigReader, ConfigCache } from './configReader';
import { testJava } from './tools';

export const RenderType = {
    Local: 'Local',
    PlantUMLServer: 'PlantUMLServer'
};

export enum IncludeSearchType {
    DiagramsRoot,
    SourceFileDir,
}

class Config extends ConfigReader {
    private _jar: ConfigCache<string> = {};
    private _java: string;

    constructor() {
        super('plantuml');
    }

    onChange() {
        this._jar = {};
        this._java = "";
    }

    jar(uri: vscode.Uri): string {
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        let folderPath = folder ? folder.uri.fsPath : "";
        return this._jar[folderPath] || (() => {
            let jar = this.read<string>('jar', uri, (folderUri: vscode.Uri, value) => {
                if (!value) return "";
                const workspaceFolder = folderUri.fsPath;
                let result = eval('`' + value + '`');
                if (!path.isAbsolute(result))
                    result = path.join(workspaceFolder, result);
                return result;
            });
            let intJar = path.join(extensionPath, "plantuml.jar");
            if (!jar) {
                jar = intJar;
            } else {
                if (!fs.existsSync(jar)) {
                    vscode.window.showWarningMessage(localize(19, null));
                    jar = intJar;
                }
            }
            this._jar[folderPath] = jar;
            return jar;
        })();
    }

    fileExtensions(uri: vscode.Uri): string {
        let extReaded = this.read<string>('fileExtensions', uri).replace(/\s/g, "");
        let exts = extReaded || ".*";
        if (exts.indexOf(",") > 0) exts = `{${exts}}`;
        //REG: .* | .wsd | {.wsd,.java}
        if (!exts.match(/^(.\*|\.\w+|\{\.\w+(,\.\w+)*\})$/)) {
            throw new Error(localize(18, null, extReaded));
        }
        return exts;
    }

    diagramsRoot(uri: vscode.Uri): vscode.Uri {
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder) return undefined;
        let fsPath = path.join(
            folder.uri.fsPath,
            this.read<string>("diagramsRoot", uri)
        );
        return vscode.Uri.file(fsPath);
    }

    includeSearch(uri: vscode.Uri): IncludeSearchType {
        return IncludeSearchType[this.read<string>('includeSearch', uri)];
    }

    exportOutDir(uri: vscode.Uri): vscode.Uri {
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder) return undefined;
        let fsPath = path.join(
            folder.uri.fsPath,
            this.read<string>("exportOutDir", uri) || "out"
        );
        return vscode.Uri.file(fsPath);
    }

    exportFormat(uri: vscode.Uri): string {
        return this.read<string>('exportFormat', uri);
    }

    exportSubFolder(uri: vscode.Uri): boolean {
        return this.read<boolean>('exportSubFolder', uri);
    }

    get exportConcurrency(): number {
        return this.read<number>('exportConcurrency') || 3;
    }

    exportMapFile(uri: vscode.Uri): boolean {
        return this.read<boolean>('exportMapFile', uri) || false;
    }

    get previewAutoUpdate(): boolean {
        return this.read<boolean>('previewAutoUpdate');
    }

    get previewSnapIndicators(): boolean {
        return this.read<boolean>('previewSnapIndicators');
    }

    get server(): string {
        return this.read<string>('server') || "http://www.plantuml.com/plantuml";
    }

    get serverIndexParameter(): string {
        return this.read<string>('serverIndexParameter');
    }

    get urlFormat(): string {
        return this.read<string>('urlFormat');
    }

    get urlResult(): string {
        return this.read<string>('urlResult') || "MarkDown";
    }

    get render(): string {
        return this.read<string>('render');
    }

    includes(uri: vscode.Uri): string[] {
        return this.read<string[]>('includes', uri);
    }
    get commandArgs(): string[] {
        return this.read<string[]>('commandArgs') || [];
    }
    jarArgs(uri: vscode.Uri): string[] {
        return this.read<string[]>('jarArgs', uri) || [];
    }
    get java(): string {
        return this._java || (() => {
            let java = this.read<string>('java') || "java";
            if (testJava(java)) {
                this._java = java;
            }
            return this._java;
        })();
    }
}

export const config = new Config();