import * as vscode from 'vscode';
import * as path from 'path';

import * as title from './title';
import { includer } from './includer';
import { config } from '../config';

export const diagramStartReg = /@start/i;
export const diagramEndReg = /@end/i;

export function diagramsOf(document: vscode.TextDocument): Diagram[] {
    let diagrams: Diagram[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        let line = document.lineAt(i);
        if (diagramStartReg.test(line.text)) {
            let d = new Diagram().DiagramAt(i, document);
            diagrams.push(d);
        }
    }
    // if no diagram block found, try add entire document
    if (!diagrams.length) {
        let d = new Diagram().DiagramAt(0, document);
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
    constructor(content?: string) {
        if (!content) return;
        this.content = content;
        this.lines = content.split('\n');
        this.getTitle();
        this.getPageCount();
    }
    GetCurrent(): Diagram {
        let editor = vscode.window.activeTextEditor;
        if (editor) this.DiagramAt(editor.selection.anchor.line);
        return this;
    }
    DiagramAt(lineNumber: number, document?: vscode.TextDocument): Diagram {
        if (!document) document = vscode.window.activeTextEditor.document;
        this.document = document;
        this.parentUri = document.uri;
        this.path = document.uri.fsPath;
        this.fileName = path.basename(this.path);
        let i = this.fileName.lastIndexOf(".");
        if (i >= 0) this.fileName = this.fileName.substr(0, i);
        this.dir = path.dirname(this.path);
        if (!path.isAbsolute(this.dir)) this.dir = "";

        for (let i = lineNumber; i >= 0; i--) {
            let line = document.lineAt(i);
            if (diagramStartReg.test(line.text)) {
                this.start = line.range.start;
                break;
            } else if (i != lineNumber && diagramEndReg.test(line.text)) {
                return this;
            }
        }
        for (let i = lineNumber; i < document.lineCount; i++) {
            let line = document.lineAt(i);
            if (diagramEndReg.test(line.text)) {
                this.end = line.range.end
                break;
            } else if (i != lineNumber && diagramStartReg.test(line.text)) {
                return this;
            }
        }
        // if no diagram block found, add entire document
        if (
            !(this.start && this.end) &&
            document.getText().trim() &&
            document.languageId == "diagram"
        ) {
            this.start = document.lineAt(0).range.start;
            this.end = document.lineAt(document.lineCount - 1).range.end;
        }
        if (this.start && this.end) {
            this.lines = [];
            this.content = document.getText(new vscode.Range(this.start, this.end));
            this.content = includer.addIncludes(this);
            for (let i = this.start.line; i <= this.end.line; i++) {
                this.lines.push(document.lineAt(i).text);
            }
            this.getIndex();
            this.getTitle();
            this.getPageCount();
        }
        return this.content ? this : undefined;
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
        if (!this.document) return;
        for (let i = 0; i < this.start.line; i++) {
            if (diagramStartReg.test(this.document.lineAt(i).text)) this.index++;
        }
    }
}