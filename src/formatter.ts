import * as vscode from 'vscode';
import { formatRules } from './formatRules';
import { FormatType, FormatRule, FormatCapture } from './formatRuleCompiler';
import { MatchPositions, UnmatchedText } from './matchPositions';

interface matchLine {
    text: string,
    newText: string,
    matchPositions: MatchPositions,
    elements: formatElemet[]
}
interface formatElemet {
    type: FormatType,
    text: string,
    start: number,
    end: number
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
                matchPositions: new MatchPositions(docLine.text),
                elements: []
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
                //test block out
                if (this.blocks.length) {
                    let rule = this.blocks[this.blocks.length - 1];
                    if (this.doMatch(line, rule.end, rule.endCaptures)) {
                        this.blocks.pop();
                    }
                }
            }
            this.makeLineElements(line);
            this.formatLine(line);
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
                    let subPos: number[] = [];
                    let pos = 0;
                    subPos[0] = 0;
                    match.every((v, i) => {
                        pos = match[0].indexOf(v, pos);
                        subPos[i] = pos;
                        return true;
                    })
                    for (let capture of captures) {
                        if (match[capture.index]) line.elements.push(
                            <formatElemet>{
                                type: capture.type,
                                text: match[capture.index],
                                start: subPos[capture.index] + u.offset + match.index,
                                end: subPos[capture.index] + u.offset + match.index + match[capture.index].length,
                            }
                        );
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
    private formatLine(line: matchLine) {
        let text = line.elements[0].text;
        // let formatType: FormatType;
        for (let i = 0; i < line.elements.length - 1; i++) {
            let thisEl = line.elements[i];
            let nextEl = line.elements[i + 1];
            if (!nextEl.text.trim()) continue;
            switch (thisEl.type) {
                case FormatType.none:
                    text += nextEl.text;
                    break;
                case FormatType.word:
                    switch (nextEl.type) {
                        case FormatType.none:
                            text += nextEl.text;
                            break;
                        case FormatType.punct:
                            text += nextEl.text.trim();
                            break;
                        case FormatType.operater:
                        case FormatType.word:
                            text += " " + nextEl.text.trim();
                            break;
                        default:
                            text += nextEl.text;
                            break;
                    }
                    break;
                case FormatType.operater:
                case FormatType.punct:
                    text += " " + nextEl.text.trim();
                    break;
                default:
                    text += nextEl.text;
                    break;
            }
        }
        line.newText = text;
    }
    private makeLineElements(line: matchLine) {
        line.elements.sort((a, b) => a.start - b.start);
        let pos = 0;
        let els: formatElemet[] = [];
        for (let e of line.elements) {
            if (e.start > pos && line.text.substring(pos, e.start).trim()) els.push({
                type: FormatType.none,
                text: line.text.substring(pos, e.start),
                start: pos,
                end: e.start - 1
            });
            pos = e.end;
        }
        if (pos < line.text.length && line.text.substring(pos, line.text.length).trim()) {
            els.push({
                type: FormatType.none,
                text: line.text.substring(pos, line.text.length),
                start: pos,
                end: line.text.length - 1
            });
        }
        line.elements.push(...els);
        line.elements.sort((a, b) => a.start - b.start);
    }
}

export const formatter = new Formatter();