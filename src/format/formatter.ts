import * as vscode from 'vscode';
import { formatRules } from './formatRules';
import { FormatType, FormatRule, FormatCapture } from './formatRuleCompiler';
import { MatchPositions, UnmatchedText } from './matchPositions';
import { config } from '../config';
import { outputPanel } from '../planuml';
import { showError, parseError } from '../tools';

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
        try {
            return this.formate(document, options, token);
        } catch (error) {
            showError(outputPanel, parseError(error));
        }
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
            //test block out
            if (this.blocks.length) {
                let rule = this.blocks[this.blocks.length - 1];
                if (this.doMatch(line, rule.blockEnd, rule.blockEndCaptures)) {
                    this.blocks.pop();
                }
            }
            for (let rule of formatRules) {
                //test match    
                if (config.formatInLine && rule.match) {
                    this.doMatch(line, rule.match, rule.captures);
                }
                //test block in
                else if (rule.blockBegin && rule.blockEnd) {
                    if (this.doMatch(line, rule.blockBegin, rule.blockBeginCaptures)) {
                        this.blocks.push(rule);
                        indentDelta = -1;
                    } else {
                        //test 'again' line
                        if (rule.blockAgain && this.doMatch(line, rule.blockAgain, rule.blockAgainCaptures)) indentDelta = -1;
                    }
                }
            }
            if (config.formatInLine) {
                this.makeLineElements(line);
                this.formatLine(line);
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
            if (!u.text.trim()) continue;
            // console.log("test", u.text, "with", patt.source);
            patt.lastIndex = 0;
            while (match = patt.exec(u.text)) {
                // console.log("TEST", u.text, "MATCH", match[0], "WITH", patt.source);
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
        if (!lineText.trim()) return "";
        level = level < 0 ? 0 : level;
        return spaceStr.repeat(level) + lineText.trim();
    }
    private formatLine(line: matchLine) {
        if (line.text.trim() && !line.elements.length)
            throw ("no element found for a non-empty line!");
        if (!line.elements.length) {
            line.newText = "";
            return;
        }
        let text = getElementText(line.elements[0]);
        // let formatType: FormatType;
        for (let i = 0; i < line.elements.length - 1; i++) {
            let thisEl = line.elements[i];
            let nextEl = line.elements[i + 1];
            switch (thisEl.type) {
                case FormatType.none:
                case FormatType.word:
                    switch (nextEl.type) {
                        case FormatType.none:
                        case FormatType.punctLeftSpace:
                        case FormatType.operater:
                        case FormatType.word:
                            text += " " + getElementText(nextEl);
                            break;
                        default:
                            text += getElementText(nextEl);
                            break;
                    }
                    break;
                case FormatType.operater:
                case FormatType.punctRightSpace:
                    switch (nextEl.type) {
                        case FormatType.none:
                        case FormatType.word:
                        case FormatType.punctLeftSpace:
                            text += " " + getElementText(nextEl);
                            break;
                        default:
                            text += getElementText(nextEl);
                            break;
                    }
                    break;
                case FormatType.punctLeftSpace:
                    text += getElementText(nextEl);
                    break;
                case FormatType.connector:
                    text += getElementText(nextEl);
                    break;
                default:
                    text += getElementText(nextEl);
                    break;
            }
        }
        line.newText = text;
        function getElementText(el: formatElemet): string {
            if (el.type == FormatType.asIs) return el.text;
            return el.text.trim();
        }
    }
    private makeLineElements(line: matchLine) {
        if (line.elements.length) line.elements.sort((a, b) => a.start - b.start);
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
        if (line.elements.length) line.elements.sort((a, b) => a.start - b.start);
    }
}

export const formatter = new Formatter();