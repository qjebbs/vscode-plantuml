import * as vscode from 'vscode';
import { formatRules } from './formatRules';
import { FormatType, FormatRule, FormatCapture } from './formatRuleCompiler';
import { MatchPositions, UnmatchedText } from './matchPositions';

interface matchLine {
    text: string,
    newText: string,
    matchPositions: MatchPositions
}
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
            let docLine = document.lineAt(i);
            let line = <matchLine>{
                text: docLine.text,
                newText: docLine.text,
                matchPositions: new MatchPositions(docLine.text)
            }
            let indentDelta = 0;
            for (let rule of formatRules) {
                //test match    
                if (rule.match) {
                    this.doMatch(line, rule.match, rule.captures);
                }
                //test block in
                else if (rule.begin && rule.end) {
                    if (this.doMatch(line, rule.begin, rule.beginCaptures)) {
                        this.blocks.push(rule);
                        indentDelta = -1;
                    } else {
                        //test 'again' line
                        if (rule.again && this.doMatch(line, rule.again, rule.againCaptures)) indentDelta = -1;
                    }
                }
            }
            //test block out
            if (this.blocks.length) {
                let rule = this.blocks[this.blocks.length - 1];
                if (this.doMatch(line, rule.end, rule.endCaptures)) {
                    this.blocks.pop();
                }
            }
            line.newText = this.indent(line.newText, spaceStr, this.blocks.length + indentDelta);
            edits.push(<vscode.TextEdit>{ range: docLine.range, newText: line.newText });
        }
        return edits;
    }
    private doMatch(line: matchLine, patt: RegExp, captures: FormatCapture[]): boolean {
        let match: RegExpMatchArray;
        let matched = false;
        for (let u of line.matchPositions.GetUnmatchedTexts()) {
            // console.log("test", u.text);
            patt.lastIndex = 0;
            while (match = patt.exec(u.text)) {
                matched = true;
                line.matchPositions.AddPosition(match.index, patt.lastIndex - 1, u.offset);
                if (captures) {
                    for (let capture of captures) {
                        if (match[capture.index]) line.newText = line.newText.replace(patt, this.formatString(match[capture.index], capture.type));
                    }
                }
            }
        }
        patt.lastIndex = 0;
        return matched;
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