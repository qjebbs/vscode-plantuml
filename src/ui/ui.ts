import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { showMessagePanel } from '../plantuml/tools';
import { UIEventMap, MessageEvent, UIListener, UIEvent } from './events';
export class UI extends vscode.Disposable {
    _panel: vscode.WebviewPanel;
    _viewType: string;
    _base: string;
    _file: string;
    _title: string;
    _content: string;
    _disposables: { dispose: () => any }[] = [];
    _listener: { [key: string]: UIListener<keyof UIEventMap>[] } = {
        "open": [],
        "close": [],
        "message": [],
    };

    constructor(viewType: string, title: string, file: string) {
        super(() => this.dispose());
        this._viewType = viewType;
        this._title = title;
        this._base = path.dirname(file);
        this._file = file;
    }

    get visible(): boolean {
        return this._panel.visible;
    }

    get open(): boolean {
        return !!this._panel;
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

    addEventListener<K extends keyof UIEventMap>(type: K, listener: (ev: UIEventMap[K]) => any): void {
        this._listener[type].push(listener);
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
        this.uiEventListerCatch("open");
        this._panel.onDidDispose(() => {
            this.dispose();
            this._panel = undefined;
        }, null, this._disposables);
    }

    private addMessageListener() {
        if (this._panel && this._listener)
            this._panel.webview.onDidReceiveMessage(this.messageListenerCatch, this, this._disposables);
    }
    private uiEventListerCatch(type: keyof UIEventMap) {
        try {
            let e = <UIEvent>{
                caller: this,
                panel: this._panel,
            }
            for (let listener of this._listener[type] as UIListener<"open">[]) {
                let pm = listener(e);
                if (pm instanceof Promise) {
                    pm.catch(error => showMessagePanel(error))
                }
            }
        } catch (error) {
            showMessagePanel(error);
        }
    }
    private messageListenerCatch(message: Object): any {
        try {
            let e = <MessageEvent>{
                caller: this,
                panel: this._panel,
                message: message,
            }
            for (let listener of this._listener["message"] as UIListener<"message">[]) {
                let pm = listener(e);
                if (pm instanceof Promise) {
                    pm.catch(error => showMessagePanel(error))
                }
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
        this.uiEventListerCatch("close");
        this._panel.dispose();
        this._disposables.length && this._disposables.map(d => d && d.dispose());
        this._disposables = [];
    }
}