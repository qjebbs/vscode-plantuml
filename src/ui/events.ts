import * as vscode from 'vscode';
import { UI } from './ui';

export interface UIEvent {
    caller: UI;
    panel: vscode.WebviewPanel;
}

export interface MessageEvent extends UIEvent {
    message: any;
}

export interface UIEventMap {
    "open": UIEvent;
    "close": UIEvent;
    "message": MessageEvent;
}

export type UIListener<K extends keyof UIEventMap> = (ev: UIEventMap[K]) => any;