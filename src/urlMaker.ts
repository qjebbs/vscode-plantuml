import * as vscode from 'vscode';
import * as nls from "vscode-nls";
import * as zlib from 'zlib';

import { Diagram, Diagrams } from './diagram';
import { config } from './config';
import { outputPanel, context, localize } from './planuml';

interface pURL {
    name: string;
    url: string;
}
class URLMaker {
    register(): vscode.Disposable[] {
        function showError(error) {
            let err = error as TypeError;
            vscode.window.showErrorMessage(err.message);
        }
        //register url maker
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.URLCurrent', () => {
            try {
                this.makeDocumentURL(false);
            } catch (error) {
                showError(error);
            }
        });
        ds.push(d);
        d = vscode.commands.registerCommand('plantuml.URLDocument', () => {
            try {
                this.makeDocumentURL(true);
            } catch (error) {
                showError(error);
            }
        });
        ds.push(d);
        return ds;
    }
    private async makeDocumentURL(all: boolean) {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage(localize(14, null));
            return;
        }

        let format = config.urlFormat;
        if (!format) {
            format = await vscode.window.showQuickPick(config.urlFormats);
            if (!format) return;
        }
        let ds = new Diagrams();
        if (all) {
            ds.AddDocument();
            if (!ds.diagrams.length) {
                vscode.window.showWarningMessage(localize(15, null));
                return;
            }
        } else {
            let dg = new Diagram().GetCurrent();
            if (!dg.content) {
                vscode.window.showWarningMessage(localize(3, null));
                return;
            }
            ds.Add(dg);
            editor.selections = [new vscode.Selection(dg.start, dg.end)];
        }
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        let urls = this.makeURLs(ds.diagrams, config.urlServer, format, bar)
        bar.dispose();

        outputPanel.clear();
        urls.map(url => {
            outputPanel.appendLine(url.name);
            if (config.urlResult == "MarkDown") {
                outputPanel.appendLine(`\n![${url.name}](${url.url} "${url.name}")`);
            } else {
                outputPanel.appendLine(url.url);
            }
            outputPanel.appendLine("");
        });
        outputPanel.show();

        return urls;
    }
    makeURL(diagram: Diagram, server: string, format: string, bar: vscode.StatusBarItem): pURL {
        if (bar) {
            bar.show();
            bar.text = localize(16, null, diagram.title);
        }
        let c = this.urlTextFrom(diagram.content);

        return <pURL>{ name: diagram.title, url: [server.replace(/^\/|\/$/g, ""), format, c].join("/") };
    }
    private makeURLs(diagrams: Diagram[], server: string, format: string, bar: vscode.StatusBarItem): pURL[] {
        return diagrams.map<pURL>((diagram: Diagram) => {
            return this.makeURL(diagram, server, format, bar);
        })
    }
    private urlTextFrom(s: string): string {
        let opt: zlib.ZlibOptions = { level: 9 };
        let d = zlib.deflateRawSync(new Buffer(s), opt) as Buffer;
        let b = encode64(String.fromCharCode(...d.subarray(0)));
        return b;
        // from synchro.js
        /* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
         * Version: 1.0.1
         * LastModified: Dec 25 1999
         */
        function encode64(data) {
            let r = "";
            for (let i = 0; i < data.length; i += 3) {
                if (i + 2 == data.length) {
                    r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
                } else if (i + 1 == data.length) {
                    r += append3bytes(data.charCodeAt(i), 0, 0);
                } else {
                    r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
                }
            }
            return r;
        }

        function append3bytes(b1, b2, b3) {
            let c1 = b1 >> 2;
            let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
            let c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
            let c4 = b3 & 0x3F;
            let r = "";
            r += encode6bit(c1 & 0x3F);
            r += encode6bit(c2 & 0x3F);
            r += encode6bit(c3 & 0x3F);
            r += encode6bit(c4 & 0x3F);
            return r;
        }
        function encode6bit(b) {
            if (b < 10) {
                return String.fromCharCode(48 + b);
            }
            b -= 10;
            if (b < 26) {
                return String.fromCharCode(65 + b);
            }
            b -= 26;
            if (b < 26) {
                return String.fromCharCode(97 + b);
            }
            b -= 26;
            if (b == 0) {
                return '-';
            }
            if (b == 1) {
                return '_';
            }
            return '?';
        }
    }
}
export const urlMaker = new URLMaker();