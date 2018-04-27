import * as vscode from 'vscode';
import * as path from 'path';

import * as title from './title';
import { includer } from './includer';
import { config } from '../config';

export const diagramStartReg = /@start/i;
export const diagramEndReg = /@end/i;


export function currentDiagram(): Diagram {
    let editor = vscode.window.activeTextEditor;
    if (editor) return diagramAt(editor.document, editor.selection.anchor.line);
}

export function diagramAt(document: vscode.TextDocument, lineNumber: number): Diagram {
    let start: vscode.Position;
    let end: vscode.Position;
    let content: string = "";
    for (let i = lineNumber; i >= 0; i--) {
        let line = document.lineAt(i);
        if (diagramStartReg.test(line.text)) {
            start = line.range.start;
            break;
        } else if (i != lineNumber && diagramEndReg.test(line.text)) {
            return this;
        }
    }
    for (let i = lineNumber; i < document.lineCount; i++) {
        let line = document.lineAt(i);
        if (diagramEndReg.test(line.text)) {
            end = line.range.end
            break;
        } else if (i != lineNumber && diagramStartReg.test(line.text)) {
            return this;
        }
    }
    // if no diagram block found, add entire document
    if (
        !(start && end) &&
        document.getText().trim() &&
        document.languageId == "diagram"
    ) {
        start = document.lineAt(0).range.start;
        end = document.lineAt(document.lineCount - 1).range.end;
    }
    let diagram: Diagram = undefined;
    if (start && end) {
        content = document.getText(new vscode.Range(start, end));
        diagram = new Diagram(content, document, start, end);
    }
    return diagram ? includer.addIncludes(diagram) : undefined;
}

export function diagramsOf(document: vscode.TextDocument): Diagram[] {
    let diagrams: Diagram[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        let line = document.lineAt(i);
        if (diagramStartReg.test(line.text)) {
            let d = diagramAt(document, i);
            diagrams.push(d);
        }
    }
    // if no diagram block found, try add entire document
    if (!diagrams.length) {
        let d = diagramAt(document, 0);
        if (d) diagrams.push(d);
    }
    return diagrams;
}

export class Diagram {
    document: vscode.TextDocument;
    parentUri: vscode.Uri;
    path: string;
    fileName: string;
    dir: string;
    content: string;
    titleRaw: string;
    title: string;
    start: vscode.Position;
    end: vscode.Position;
    pageCount: number = 1;
    lines: string[];
    index: number = 0;
    constructor(content: string);
    constructor(content: string, document: vscode.TextDocument, start: vscode.Position, end: vscode.Position);
    constructor(content: string, ...para: any[]) {
        this.content = content;
        this.lines = content.replace(/\r/g, "").split('\n');
        if (para && para.length == 3) {
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
            this.getPageCount();
            this.getIndex();
            this.getTitle();
        }
    }
    isEqual(d: Diagram): boolean {
        if (this.dir !== d.dir) return false;
        if (this.fileName !== d.fileName) return false;
        if (!this.start || !d.start) return false;
        if (!this.start.isEqual(d.start)) return false;
        return true;
    }
    private getPageCount() {
        let regNewPage = /^\s*newpage\b/i;
        for (let text of this.lines) {
            if (regNewPage.test(text)) this.pageCount++;
        }
    }
    private getTitle() {
        let RegFName = /@start(\w+)\s+(.+?)\s*$/i;
        let matches: RegExpMatchArray;;
        if (matches = this.lines[0].match(RegFName)) {
            this.titleRaw = matches[2];
            this.title = title.Deal(this.titleRaw);
            return;
        }
        let inlineTitle = /^\s*title\s+(.+?)\s*$/i;
        let multLineTitle = /^\s*title\s*$/i;
        for (let text of this.lines) {
            if (inlineTitle.test(text)) {
                let matches = text.match(inlineTitle);
                this.titleRaw = matches[1];
            }
        }
        if (this.titleRaw) {
            this.title = title.Deal(this.titleRaw);
        } else if (this.start && this.end) {
            // this.title = `${this.fileName}@${this.start.line + 1}-${this.end.line + 1}`;
            if (this.index)
                this.title = `${this.fileName}-${this.index}`;
            else
                this.title = this.fileName;
        } else {
            this.title = "Untitled";
        }
    }
    private getIndex() {
        for (let i = 0; i < this.start.line; i++) {
            if (diagramStartReg.test(this.document.lineAt(i).text)) this.index++;
        }
    }
}