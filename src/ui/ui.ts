import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { showMessagePanel } from '../plantuml/tools';
export class UI extends vscode.Disposable {
    _panel: vscode.WebviewPanel;
    _viewType: string;
    _base: string;
    _file: string;
    _title: string;
    _content: string;
    _disposables: { dispose: () => any }[] = [];
    _listener: (e: any) => any = undefined;

    constructor(viewType: string, title: string, file: string, listener: (e: any) => any) {
        super(() => this.dispose());
        this._viewType = viewType;
        this._title = title;
        this._base = path.dirname(file);
        this._file = file;
        this._listener = listener
    }

    show(env?: any, viewColumn?: vscode.ViewColumn) {
        this.createPanel();
        this.loadFile(env || {});
        this._panel.webview.html = this._content;
        if (!this._panel.visible) this._panel.reveal(viewColumn ? viewColumn : this._panel.viewColumn);
    }
    close() {
        this.dispose();
    }

    refresh(env?: any, viewColumn?: vscode.ViewColumn) {
        this.show(env, viewColumn);
    }
    postMessage(message: any) {
        this.createPanel();
        return this._panel.webview.postMessage(message);
    }
    private createPanel() {
        if (this._panel) return;
        this._panel = vscode.window.createWebviewPanel(
            this._viewType,
            this._title,
            vscode.ViewColumn.Two, <vscode.WebviewOptions>{
                enableScripts: true,
                enableCommandUris: false,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(this._base)],
            }
        );
        this.addMessageListener();
        this._panel.onDidDispose(() => {
            this.dispose();
            this._panel = undefined;
        }, null, this._disposables);
    }

    private addMessageListener() {
        if (this._panel && this._listener)
            this._panel.webview.onDidReceiveMessage(this.listenerCatch, this, this._disposables);
    }
    private listenerCatch(e: any): any {
        try {
            let pm = this._listener(e);
            if (pm instanceof Promise) {
                pm.catch(error => showMessagePanel(error))
            }
        } catch (error) {
            showMessagePanel(error);
        }
    }
    private loadFile(env: any) {
        this._content = this.evalHtml(fs.readFileSync(this._file).toString(), env);
    }
    private evalHtml(html: string, envObj: any): string {
        let envReg = /\$\{(\w+)\}/ig;
        html = html.replace(envReg, '${envObj.$1}');
        let result: string = eval('`' + html + '`');
        // convert relative "src", "href" paths to absolute
        let linkReg = /(src|href)\s*=\s*([`"'])(.+?)\2/ig;
        let base: string = this._base;
        result = result.replace(linkReg, (match, ...subs) => {
            let uri = subs[2] as string;
            if (!path.isAbsolute(uri)) uri = path.join(base, uri);
            if (!fs.existsSync(uri)) return match;
            uri = vscode.Uri.file(uri).with({ scheme: 'vscode-resource' }).toString();
            return `${subs[0]}=${subs[1]}${uri}${subs[1]}`;
        });
        return result;
    }
    dispose() {
        this._disposables.length && this._disposables.map(d => d && d.dispose());
        this._disposables = [];
    }
}