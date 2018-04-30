import * as vscode from 'vscode';

class ContextManager {
    private _ctx: vscode.ExtensionContext;
    private _listeners: ((ctx: vscode.ExtensionContext) => void)[] = [];
    set(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        for (let callback of this._listeners) {
            callback(ctx);
        }
    }
    addInitiatedListener(listener: (ctx: vscode.ExtensionContext) => void): void {
        this._listeners.push(listener);
    }
    get context() {
        return this._ctx
    }
}

export var contextManager = new ContextManager();