import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { localize, extensionPath } from './common';
import { ConfigReader, ConfigCache } from './configReader';
import { javaCommandExists, testJava } from './tools';
import { contextManager } from './context';

const WORKSPACE_IS_TRUSTED_KEY = 'WORKSPACE_IS_TRUSTED_KEY';
const SECURITY_SENSITIVE_CONFIG: string[] = [
    'java', 'jar'
];

export const RenderType = {
    Local: 'Local',
    PlantUMLServer: 'PlantUMLServer'
};

class Config extends ConfigReader {
    private _jar: ConfigCache<string> = {};
    private _java: string;
    private _workspaceState: vscode.Memento;
    private _workspaceIsTrusted: boolean;

    constructor(workspaceState: vscode.Memento) {
        super('plantuml');
        this._workspaceState = workspaceState;
        this._workspaceIsTrusted = this._workspaceState.get<boolean>(WORKSPACE_IS_TRUSTED_KEY);
    }

    onChange() {
        this._jar = {};
        this._java = "";
    }

    jar(uri: vscode.Uri): string {
        let folder = uri ? vscode.workspace.getWorkspaceFolder(uri) : undefined;
        let folderPath = folder ? folder.uri.fsPath : "";
        return this._jar[folderPath] || (() => {
            let jar: string;
            if (this._workspaceIsTrusted) {
                jar = this.read<string>('jar', uri, (folderUri, value) => {
                    if (!value) return "";
                    if (!path.isAbsolute(value))
                        value = path.join(folderUri.fsPath, value);
                    return value;
                });
            } else {
                jar = this.readGlobal<string>('jar');
            }
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
        return this.read<string>('server').trim().replace(/\/+$/g, "");
    }

    get urlFormat(): string {
        return this.read<string>('urlFormat');
    }

    get urlResult(): string {
        return this.read<string>('urlResult') || "MarkDown";
    }

    get render(): string {
        return this.read<string>('render') || "Local";
    }

    includepaths(uri: vscode.Uri): string[] {
        return this.read<string[]>('includepaths', uri);
    }
    commandArgs(uri: vscode.Uri): string[] {
        return this.read<string[]>('commandArgs', uri) || [];
    }
    jarArgs(uri: vscode.Uri): string[] {
        return this.read<string[]>('jarArgs', uri) || [];
    }
    get java(): string {
        return this._java || (() => {
            let java: string;
            if (this._workspaceIsTrusted) {
                java = this.read<string>('java');
            } else {
                java = this.readGlobal<string>('java');
            }
            if (java == "java") {
                if (javaCommandExists()) this._java = java;
            } else {
                if (testJava(java)) {
                    this._java = java;
                } else {
                    vscode.window.showWarningMessage(localize(54, null, java));
                }
            }
            return this._java;
        })();
    }
    ignoredWorkspaceSettings(keys: string[]): string[] {
        if (this._workspaceIsTrusted){
            return [];
        }
        let conf = vscode.workspace.getConfiguration('plantuml');
        return keys.filter((key) => {
            const inspect = conf.inspect(key);
            return inspect.workspaceValue !== undefined || inspect.workspaceFolderValue !== undefined;
        });
    }
    async toggleWorkspaceIsTrusted() {
        this._workspaceIsTrusted = !this._workspaceIsTrusted;
        this.onChange();
        await this._workspaceState.update(WORKSPACE_IS_TRUSTED_KEY, this._workspaceIsTrusted);
    }
}


export var config: Config

contextManager.addInitiatedListener(async ctx => {
    config = new Config(ctx.workspaceState);
    let ignoredSettings = config.ignoredWorkspaceSettings(SECURITY_SENSITIVE_CONFIG);
    if (ignoredSettings.length == 0) {
        return;
    }
    const trustButton=localize(57, null);
    const val = await vscode.window.showWarningMessage(
        localize(55, null, ignoredSettings),
        localize(56, null),
        trustButton);
    switch (val) {
        case trustButton:
            await config.toggleWorkspaceIsTrusted();
            break;
        default:
            break;
    }
});
