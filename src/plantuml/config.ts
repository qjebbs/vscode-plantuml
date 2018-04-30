import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { localize } from './common';
import { ConfigReader } from './configReader';
import { testJava } from './tools';
import { contextManager } from './context';

export const RenderType = {
    Local: 'Local',
    PlantUMLServer: 'PlantUMLServer'
};

class Config extends ConfigReader {
    private _jar: string;
    private _java: string;

    constructor() {
        super('plantuml');
    }

    onChange() {
        this._jar = "";
        this._java = "";
    }

    get jar(): string {
        return this._jar || (() => {
            let jar = this.read<string>('jar');
            let intJar = path.join(contextManager.context.extensionPath, "plantuml.jar");
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
        let extReaded = this.read<string>('fileExtensions', uri).replace(/\s/g, "");
        let exts = extReaded || ".*";
        if (exts.indexOf(",") > 0) exts = `{${exts}}`;
        //REG: .* | .wsd | {.wsd,.java}
        if (!exts.match(/^(.\*|\.\w+|\{\.\w+(,\.\w+)*\})$/)) {
            throw new Error(localize(18, null, extReaded));
        }
        return exts;
    }

    exportOutDirName(uri: vscode.Uri): string {
        return this.read<string>('exportOutDirName', uri) || "out";
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

    get previewFileType(): string {
        return this.read<string>('previewFileType') || "png";
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
    get jarArgs(): string[] {
        return this.read<string[]>('jarArgs') || [];
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