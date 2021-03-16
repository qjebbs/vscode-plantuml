import * as vscode from 'vscode';

export type ConfigCache<T> = {
    [key: string]: T;
}

export abstract class ConfigReader extends vscode.Disposable {

    private _section: string;
    private _disposable: vscode.Disposable;

    constructor(section: string) {
        super(() => this.dispose());
        this._section = section;
        this._disposable = vscode.workspace.onDidChangeConfiguration(
            e => {
                this.onChange(e);
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
     * @param resource target uri to get setting for
     */
    read<T>(key: string, resource: vscode.Uri): T;

    /**
     * read and convert the value of a source scope setting.
     * @param key the key name of a setting
     * @param resource target uri to get setting for
     * @param func the function to convert the setting value. eg.: convert a relative path to absolute.
     */
    read<T>(key: string, resource: vscode.Uri, func: (workspaceFolder: vscode.Uri, value: T) => T): T;
    read<T>(key: string, ...para: any[]): T {
        let resource = para.shift() as vscode.Uri;
        let folder = resource ? vscode.workspace.getWorkspaceFolder(resource) : undefined;
        let conf = vscode.workspace.getConfiguration(this._section, resource);

        let value: T = conf.get<T>(key);

        let func: (settingRoot: vscode.Uri, settingValue: T) => T = undefined;
        if (para.length) func = para.shift();
        if (func && folder && folder.uri) {
            value = func(folder.uri, value);
        }
        // console.log(key, "=", value, ":", resource ? resource.fsPath : "undefined");
        return value;
    }
    /**
     * read the value of a window scope setting.
     * @param key the key name of a setting
     */
    readGlobal<T>(key: string): T{
        let conf = vscode.workspace.getConfiguration(this._section);
        let results = conf.inspect<T>(key);
        let value: T = undefined;
        if (results.globalValue !== undefined)
            value = results.globalValue;
        else
            value = results.defaultValue;
        return value;
    }
    abstract onChange(...args: any[]): any;
}