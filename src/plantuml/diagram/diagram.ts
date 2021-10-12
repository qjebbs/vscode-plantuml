import * as vscode from 'vscode';
import * as path from 'path';

import * as title from './title';
import { DiagramType, getType } from './type';
import { getContentWithInclude } from './include';

export const diagramStartReg = /@start(\w+)/i;
export const diagramEndReg = /@end(\w+)/i;

export class Diagram {
    document: vscode.TextDocument;
    parentUri: vscode.Uri;
    path: string;
    fileName: string;
    dir: string;
    content: string;
    start: vscode.Position;
    end: vscode.Position;
    private _lines: string[] = undefined;
    private _type: DiagramType = undefined;
    private _nameRaw: string = undefined;
    private _name: string = undefined;
    private _index: number = undefined;
    private _pageCount: number = undefined;
    private _contentWithInclude: string = undefined;

    constructor(content: string);
    constructor(content: string, document: vscode.TextDocument, start: vscode.Position, end: vscode.Position);
    constructor(content: string, ...para: any[]) {
        this.content = content;
        if (!para || para.length < 3)
            return;
        this.document = para[0];
        this.start = para[1];
        this.end = para[2];
        this.parentUri = this.document.uri;
        this.path = this.document.uri.fsPath;
        this.fileName = path.basename(this.path);
        let i = this.fileName.lastIndexOf(".");
        if (i >= 0) this.fileName = this.fileName.substr(0, i);
        this.dir = path.dirname(this.path);
        if (!path.isAbsolute(this.dir)) this.dir = "";
    }
    public get index(): number {
        if (this._index !== undefined) {
            return this._index;
        }
        this._index = 0;
        if (this.document && this.start) {
            for (let i = 0; i < this.start.line; i++) {
                if (diagramStartReg.test(this.document.lineAt(i).text)) this._index++;
            }
        }
        return this._index;
    }
    public get pageCount(): number {
        if (this._pageCount !== undefined) {
            return this._pageCount;
        }
        this._pageCount = 1;
        if (this.lines) {
            let regNewPage = /^\s*newpage\b/i;
            for (let text of this.lines) {
                if (regNewPage.test(text)) this._pageCount++;
            }
        }
        return this._pageCount;
    }
    public get type(): DiagramType {
        return this._type || (this._type = getType(this));
    }
    public get name(): string {
        if (this._name == undefined) this.getTitle()
        return this._name
    }
    public get nameRaw(): string {
        if (this._name == undefined) this.getTitle()
        return this._nameRaw
    }
    public get lines(): string[] {
        return this._lines || (this._lines = this.content.replace(/\r\n|\r/g, "\n").split('\n'));
    }
    public get contentWithInclude(): string {
        return this._contentWithInclude || (this._contentWithInclude = getContentWithInclude(this));
    }
    isEqual(d: Diagram): boolean {
        if (this.parentUri.scheme !== d.parentUri.scheme) return false;
        if (this.dir !== d.dir) return false;
        if (this.fileName !== d.fileName) return false;
        if (!this.start || !d.start) return false;
        if (!this.start.isEqual(d.start)) return false;
        return true;
    }
    private getTitle() {
        let RegFName = /@start(\w+)\s+(.+?)\s*$/i;
        let matches: RegExpMatchArray;;
        if (matches = this.lines[0].match(RegFName)) {
            this._nameRaw = matches[2];
            this._name = title.Deal(this._nameRaw);
            return;
        }
        // // don't use title as diagram name, #438, #400, #409
        // let inlineTitle = /^\s*title\s+(.+?)\s*$/i;
        // let multLineTitle = /^\s*title\s*$/i;
        // for (let text of this.lines) {
        //     if (inlineTitle.test(text)) {
        //         let matches = text.match(inlineTitle);
        //         this._titleRaw = matches[1];
        //     }
        // }
        // if (this._titleRaw) {
        //     this._title = title.Deal(this._titleRaw);
        //     return
        // }
        if (this.start && this.end) {
            // this.title = `${this.fileName}@${this.start.line + 1}-${this.end.line + 1}`;
            if (this.index)
                this._name = `${this.fileName}-${this.index}`;
            else
                this._name = this.fileName;
        } else {
            this._name = "";
        }
    }
}