import * as vscode from 'vscode';
import * as path from 'path';
import * as title from './title';

export class Diagrams {
    diagrams: Diagram[] = [];
    Add(diagram: Diagram) {
        this.diagrams.push(diagram);
        return this;
    }
    AddCurrent() {
        let d = new Diagram();
        d.GetCurrent();
        this.diagrams.push(d);
    }
    AddAll() {
        let editor = vscode.window.activeTextEditor;
        let RegStart = /@start/;
        for (let i = 0; i < editor.document.lineCount; i++) {
            let line = editor.document.lineAt(i);
            if (RegStart.test(line.text)) {
                let d = new Diagram().DiagramAt(i);
                this.diagrams.push(d);
            }
        }
    }
}

export class Diagram {
    editor: vscode.TextEditor;
    path: string;
    fileName: string;
    dir: string;
    content: string;
    titleRaw: string;
    title: string;
    start: vscode.Position;
    end: vscode.Position;
    GetCurrent() {
        let editor = vscode.window.activeTextEditor;
        if (editor) this.DiagramAt(editor.selection.anchor.line);
        return this;
    }
    DiagramAt(lineNumber: number) {
        let editor = vscode.window.activeTextEditor;
        let RegStart = /@start/;
        let RegEnd = /@end/;

        this.editor = editor
        // this.start = editor.document.lineAt(0).range.start;
        // this.end = editor.document.lineAt(editor.document.lineCount - 1).range.end;
        this.path = editor.document.uri.fsPath;
        this.fileName = path.basename(this.path)
        let i = this.fileName.lastIndexOf(".");
        if (i >= 0) this.fileName = this.fileName.substr(0, i);
        this.dir = path.dirname(this.path);
        if (!path.isAbsolute(this.dir)) {
            if (vscode.workspace.rootPath) {
                this.dir = vscode.workspace.rootPath;
            }
        }

        for (let i = lineNumber; i >= 0; i--) {
            let line = editor.document.lineAt(i);
            if (RegStart.test(line.text)) {
                this.start = line.range.start;
                break;
            } else if (i != lineNumber && RegEnd.test(line.text)) {
                return this;
            }
        }
        for (let i = lineNumber; i < editor.document.lineCount; i++) {
            let line = editor.document.lineAt(i);
            if (RegEnd.test(line.text)) {
                this.end = line.range.end
                break;
            } else if (i != lineNumber && RegStart.test(line.text)) {
                return this;
            }
        }
        if (this.start && this.end) {
            this.content = editor.document.getText(new vscode.Range(this.start, this.end));
            this.getTitle();
        }
        return this;
    }

    private getTitle() {
        let inlineTitle = /^\s*title\s+(.+?)\s*$/i;
        let multLineTitle = /^\s*title\s*$/i;
        let editor = this.editor;
        for (let i = this.start.line; i <= this.end.line; i++) {
            let text = editor.document.lineAt(i).text;
            if (inlineTitle.test(text)) {
                let matches = text.match(inlineTitle);
                this.titleRaw = matches[1];
            }
        }
        if (this.titleRaw) {
            this.title = title.Deal(this.titleRaw);
        } else {
            this.title = `${this.fileName}@${this.start.line + 1}-${this.end.line + 1}`;
        }

    }
}