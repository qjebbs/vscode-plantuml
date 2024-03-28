import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { localize, extensionPath } from './common';
import { ConfigReader, ConfigCache } from './configReader';
import { javaCommandExists, testJava } from './tools';

export const RenderType = {
    Local: 'Local',
    PlantUMLServer: 'PlantUMLServer'
};

class Config extends ConfigReader {
    private _jar: ConfigCache<string> = {};
    private _java: ConfigCache<string> = {};

    constructor() {
        super('plantuml');
    }

    onChange(e) {
        this._jar = {};
        this._java = {};
    }

    jar(uri: vscode.Uri): string {
        let folder = uri ? vscode.workspace.getWorkspaceFolder(uri) : undefined;
        let folderPath = folder ? folder.uri.fsPath : "";
        return this._jar[folderPath] || (() => {
            let jar = this.read<string>('jar', uri, (folderUri, value) => {
                if (!value) return "";
                if (!path.isAbsolute(value))
                    value = path.join(folderUri.fsPath, value);
                return value;
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
        let folder = uri ? vscode.workspace.getWorkspaceFolder(uri) : undefined;
        if (!folder) return undefined;
        let fsPath = path.join(
            folder.uri.fsPath,
            this.read<string>("diagramsRoot", uri)
        );
        return vscode.Uri.file(fsPath);
    }

    exportOutDir(uri: vscode.Uri): vscode.Uri {
        let folder = uri ? vscode.workspace.getWorkspaceFolder(uri) : undefined;
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

    exportIncludeFolderHeirarchy(uri: vscode.Uri): boolean {
        return this.read<boolean>('exportIncludeFolderHeirarchy', uri);
    }

     exportConcurrency(uri: vscode.Uri): number {
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

    get previewSwapMouseButtons(): boolean {
        return this.read<boolean>('previewSwapMouseButtons');
    }

    server(uri: vscode.Uri): string {
        return this.read<string>('server').trim().replace(/\/+$/g, "");
    }

    get urlFormat(): string {
        return this.read<string>('urlFormat');
    }

    get urlResult(): string {
        return this.read<string>('urlResult') || "MarkDown";
    }

    render(uri: vscode.Uri): string {
        return this.read<string>('render') || "Local";
    }

    includepaths(uri: vscode.Uri): string[] {
        return this.read<string[]>('includepaths', uri);
    }
    lintDiagramNoName(uri: vscode.Uri): boolean {
        return this.read<boolean>('lintDiagramNoName', uri);
    }
    commandArgs(uri: vscode.Uri): string[] {
        return this.read<string[]>('commandArgs', uri) || [];
    }
    jarArgs(uri: vscode.Uri): string[] {
        return this.read<string[]>('jarArgs', uri) || [];
    }
    java(uri: vscode.Uri): string {
        let folder = uri ? vscode.workspace.getWorkspaceFolder(uri) : undefined;
        let folderPath = folder ? folder.uri.fsPath : "";
        return this._java[folderPath] || (() => {
            let java = this.read<string>('java') || "java";
            if (java == "java") {
                if (javaCommandExists()) this._java[folderPath] = java;
            } else {
                if (testJava(java)) {
                    this._java[folderPath] = java;
                } else {
                    vscode.window.showWarningMessage(localize(54, null, java));
                }
            }
            return java;
        })();
    }
}

export const config = new Config();