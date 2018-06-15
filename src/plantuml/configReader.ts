import * as vscode from 'vscode';

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
    dispose() {
        this._disposable && this._disposable.dispose();
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
     */
    read<T>(key: string, uri: vscode.Uri): T;

    /**
     * read and convert the value of a source scope setting.
     * @param key the key name of a setting
     * @param uri target uri to get setting for
     * @param func the function to convert the setting value. eg.: convert a relative path to absolute.
     */
    read<T>(key: string, uri: vscode.Uri, func: (workspaceFolder: vscode.Uri, value: T) => T): T;
    read<T>(key: string, ...para: any[]): T {
        if (!para || !para.length || !para[0]) return this._conf.get<T>(key); // no uri? return global value.
        let uri = para.shift() as vscode.Uri;
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder || !folder.uri) return this._conf.get<T>(key); // new file or not current workspace file? return global value.
        let folderConf = this._folderConfs[folder.uri.fsPath];
        if (!folderConf) {
            folderConf = vscode.workspace.getConfiguration(this._section, folder.uri);
            this._folderConfs[folder.uri.fsPath] = folderConf;
        }
        let results = folderConf.inspect<T>(key);

        let func: (settingRoot: vscode.Uri, settingValue: T) => T = undefined;
        if (para.length) func = para.shift();

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