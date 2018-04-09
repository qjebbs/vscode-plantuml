import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

type ConfigMap = {
    [key: string]: vscode.WorkspaceConfiguration;
}

export abstract class ConfigReader extends vscode.Disposable {

    private _section: string;
    private _disposable: vscode.Disposable;
    private _conf: vscode.WorkspaceConfiguration;
    private _folderConfs: ConfigMap = {};

    constructor(section: string) {
        super(() => this.dispose());
        this._section = section;
        this.getConfObjects(section);
        this._disposable = vscode.workspace.onDidChangeConfiguration(
            e => {
                this.onChange(e);
                this.getConfObjects(section);
            }
        );
    }
    /**
     * read the value of a window scope setting.
     * @param key the key name of a setting
     */
    read<T>(key: string): T;

    /**
     * read the value of a source scope setting.
     * @param key the key name of a setting
     * @param uri target uri to get setting for
     * @param func the function to convert the setting value. eg.: convert a relative path to absolute.
     */
    read<T>(key: string, uri: vscode.Uri, func?: (settingRoot: vscode.Uri, settingValue: T) => T): T;
    read<T>(key: string, ...para: any[]): T {
        if (!para || !para.length) return this._conf.get<T>(key);
        let uri = para.shift() as vscode.Uri;
        let folderConf = this._folderConfs[uri.fsPath];
        if (!folderConf) {
            folderConf = vscode.workspace.getConfiguration(this._section, uri);
            this._folderConfs[uri.fsPath] = folderConf;
        }
        let results = folderConf.inspect<T>(key);

        let func: (settingRoot: vscode.Uri, settingValue: T) => T = undefined;
        if (para.length) func = para.shift();

        let folder = vscode.workspace.getWorkspaceFolder(uri);
        let value: T = undefined;
        if (results.workspaceFolderValue !== undefined)
            value = results.workspaceFolderValue;
        else if (results.workspaceValue !== undefined)
            value = results.workspaceValue;
        else if (results.globalValue !== undefined)
            value = results.globalValue;
        else
            value = results.defaultValue;
        if (func && folder && folder.uri) return func(folder.uri, value);
        return value;
    }

    abstract onChange(...args: any[]): any;

    private getConfObjects(configName: string) {
        this._conf = vscode.workspace.getConfiguration(configName);
        this._folderConfs = {};
        if (!vscode.workspace.workspaceFolders) return;
        vscode.workspace.workspaceFolders.map(
            f => this._folderConfs[f.uri.fsPath] = vscode.workspace.getConfiguration(configName, f.uri)
        );
    }
}