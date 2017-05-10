import * as vscode from 'vscode';
import { formatRules } from './formatRules';
import { FormatType, FormatRule } from './formatRuleCompiler';

class Formatter implements vscode.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        return this.formate(document, options, token);
    }
    register(): vscode.Disposable[] {
        let ds: vscode.Disposable[] = [];
        let d = vscode.languages.registerDocumentFormattingEditProvider(
            <vscode.DocumentFilter>{ language: "diagram" },
            this
        );
        ds.push(d);
        return ds;
    }
    private blocks: FormatRule[] = [];
    formate(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
        let edits: vscode.TextEdit[] = [];
        this.blocks = [];
        const spaceStr = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";

        for (let i = 0; i < document.lineCount; i++) {
            if (token.isCancellationRequested) return [];
            let line = document.lineAt(i);
            let newLineText = line.text;
            let curIndentDelta = 0;
            for (let rule of formatRules) {
                //test match
                if (rule.match) {
                    let match = rule.match.exec(line.text);
                    if (match && rule.captures) {
                        for (let capture of rule.captures) {
                            if (match[capture.index]) newLineText = newLineText.replace(rule.match, this.formatString(match[capture.index], capture.type));
                        }
                    }
                }
                //test block in
                else if (rule.begin && rule.end) {
                    let match = rule.begin.exec(line.text);
                    if (match) {
                        if (rule.beginCaptures) {
                            for (let capture of rule.beginCaptures) {
                                if (match[capture.index]) newLineText = newLineText.replace(rule.match, this.formatString(match[capture.index], capture.type));
                            }
                        }
                        this.blocks.push(rule);
                        curIndentDelta = -1;
                    } else {
                        //test 'again' line
                        if (rule.begin && rule.again && rule.end) {
                            let match = rule.again.exec(line.text);
                            if (match) {
                                if (rule.againCaptures) {
                                    for (let capture of rule.againCaptures) {
                                        if (match[capture.index]) newLineText = newLineText.replace(rule.match, this.formatString(match[capture.index], capture.type));
                                    }
                                }
                                curIndentDelta = -1;
                            }
                        }
                    }
                }

            }
            //test block out
            if (this.blocks.length) {
                let rule = this.blocks[this.blocks.length - 1];
                let match = rule.end.exec(line.text);
                if (match) {
                    if (rule.endCaptures) {
                        for (let capture of rule.endCaptures) {
                            if (match[capture.index]) newLineText = newLineText.replace(rule.match, this.formatString(match[capture.index], capture.type));
                        }
                    }
                    this.blocks.pop();
                }
            }
            newLineText = this.indent(newLineText, spaceStr, this.blocks.length + curIndentDelta);
            edits.push(<vscode.TextEdit>{ range: line.range, newText: newLineText });
        }
        return edits;
    }
    private indent(lineText: string, spaceStr: string, level: number): string {
        level = level < 0 ? 0 : level;
        return spaceStr.repeat(level) + lineText.trim();
    }
    private formatString(str: string, type: FormatType): string {
        str = str.trim()
        switch (type) {
            case FormatType.operaterBinary:
                break
            case FormatType.operaterUnary:
                break
        }
        return str;
    }
}

export const formatter = new Formatter();