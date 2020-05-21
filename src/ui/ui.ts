import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { showMessagePanel } from '../plantuml/tools';
import { UIEventMap, MessageEvent, UIListener, UIEvent } from './events';

const DEFAULT_VIEWCOLUMN = vscode.ViewColumn.Two;

export class UI extends vscode.Disposable {
    _panel: vscode.WebviewPanel;
    _viewType: string;
    _resourceRoot: string;
    _title: string;
    _disposables: { dispose: () => any }[] = [];
    _listener: { [key: string]: UIListener<keyof UIEventMap>[] } = {
        "open": [],
        "close": [],
        "message": [],
    };

    constructor(viewType: string, title: string, resourceRoot: string) {
        super(() => this.dispose());
        this._viewType = viewType;
        this._title = title;
        this._resourceRoot = resourceRoot;
    }

    dispose() {
        this.uiEventListerCatch("close");
        this._panel.dispose();
        this._disposables.length && this._disposables.map(d => d && d.dispose());
        this._disposables = [];
    }

    get visible(): boolean {
        return this._panel && this._panel.visible;
    }

    show(viewColumn: vscode.ViewColumn);
    show(file: string, env?: any, viewColumn?: vscode.ViewColumn);
    show(...args: any[]) {
        let viewColumn: vscode.ViewColumn;
        // FIXME: file name may conflict with viewColumn keys
        if (args.length == 1 && args[0] in vscode.ViewColumn) {
            if (!this._panel) return;
            viewColumn = args[0];
        } else {
            let file = args[0] as string;
            let env = args[1];
            viewColumn = args[2] || (this._panel ? this._panel.viewColumn : DEFAULT_VIEWCOLUMN);
            this.createIfNoPanel(viewColumn);
            this.update(file, env);
        }
        if (!this._panel.visible || viewColumn !== this._panel.viewColumn)
            this._panel.reveal(viewColumn ? viewColumn : this._panel.viewColumn);
    }
    close() {
        this.dispose();
    }

    update(file: string, env?: any) {
        if (!this._panel) return;
        this._panel.webview.html = this.loadFile(file, env || {});
    }
    postMessage(message: any) {
        if (!this._panel) return;
        return this._panel.webview.postMessage(message);
    }

    addEventListener<K extends keyof UIEventMap>(type: K, listener: (ev: UIEventMap[K]) => any): void {
        this._listener[type].push(listener);
    }

    private createIfNoPanel(viewColumn?: vscode.ViewColumn) {
        if (this._panel) return;
        this._panel = vscode.window.createWebviewPanel(
            this._viewType,
            this._title,
            viewColumn ? viewColumn : DEFAULT_VIEWCOLUMN,
            <vscode.WebviewOptions>{
                enableScripts: true,
                enableCommandUris: false,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(this._resourceRoot)],
            }
        );
        this.addMessageListener();
        this.uiEventListerCatch("open");
        this._panel.onDidDispose(() => {
            this.dispose();
            this._panel = undefined;
        }, this, this._disposables);
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
    private loadFile(file: string, env: any): string {
        file = path.join(this._resourceRoot, file);
        return this.evalHtml(fs.readFileSync(file).toString(), env);
    }
    private evalHtml(html: string, env: any): string {
        let envReg = /\$\{(.+?)\}/ig;
        html = html.replace(envReg, '${env.$1}');
        let result: string = eval('`' + html + '`');
        // convert relative "src", "href" paths to absolute
        let linkReg = /(src|href)\s*=\s*([`"'])(.+?)\2/ig;
        let base: string = this._resourceRoot;
        result = result.replace(linkReg, (match, ...subs) => {
            let file = subs[2] as string;
            if (!path.isAbsolute(file)) file = path.join(base, file);
            if (!fs.existsSync(file)) return match;
            let uri = this._panel.webview.asWebviewUri(vscode.Uri.file(file));
            return `${subs[0]}=${subs[1]}${uri}${subs[1]}`;
        });
        return result;
    }
}