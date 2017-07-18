import * as vscode from 'vscode';
import { Rules } from './rules';
import { Line, Element, BlockElement, ElementType, BlockElementType, Analyst } from './analyst';
export interface FormatterConfig {
    allowInlineFormat: boolean,
    allowSplitLine: boolean,
    newLineForBlockStart: boolean,
}
export class Formatter {
    constructor(
        public rules: Rules,
        public config: FormatterConfig,
    ) {
        if (!config) this.config = {
            allowInlineFormat: true,
            allowSplitLine: true,
            newLineForBlockStart: false
        }
    }
    formate(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
        let edits: vscode.TextEdit[] = [];
        const spaceStr = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";
        let lineTexts: string[] = [];
        let lines: vscode.TextLine[] = [];
        for (let i = 0; i < document.lineCount; i++) {
            lines.push(document.lineAt(i));
            lineTexts.push(lines[i].text);
        }
        let analyst = new Analyst(lineTexts, this.rules, !this.config.allowInlineFormat);
        analyst.analysis();
        return this.getEdits(analyst.lines, lines, spaceStr, this.config.allowInlineFormat, this.config.allowSplitLine);
    }

    private getEdits(lines: Line[], rangeLines: vscode.TextLine[], spaceStr: string, allowInlineFormat: boolean, allowSplitLine: boolean): vscode.TextEdit[] {
        let edits: vscode.TextEdit[] = [];
        let blockLevel = 0;
        if (!allowSplitLine) {
            lines.map((line, i) => {
                let delta = 0;
                let newText = allowInlineFormat ? this.formatLine(line) : line.text;
                let appliedLevel = blockLevel;
                // apply level of first blockElement
                if (line.blockElements.length) {
                    switch (line.blockElements[0].type) {
                        case BlockElementType.blockStart:
                            appliedLevel = appliedLevel + 1;
                            delta = -1;
                            break;
                        case BlockElementType.blockEnd:
                            appliedLevel = appliedLevel - 1;
                            delta = 0;
                            break;
                        case BlockElementType.blockAgain:
                            delta = -1;
                        default:
                            break;
                    }
                }
                //calc level change
                blockLevel = line.blockElements.reduce((p, c) => {
                    switch (c.type) {
                        case BlockElementType.blockStart:
                            p++;
                            break;
                        case BlockElementType.blockEnd:
                            p--;
                            break;
                        default:
                            break;
                    }
                    return p;
                }, blockLevel);

                newText = this.indent(newText, spaceStr, appliedLevel + delta);
                edits.push(new vscode.TextEdit(rangeLines[i].range, newText));
            });
        } else {
            let splitedLines = lines.map(v => {
                // p.push(...this.splitLine(v));
                return this.splitLine(v, this.config.newLineForBlockStart);
            })
            let blockLevel = 0;
            for (let i = 0; i < splitedLines.length; i++) {
                let newText = "";
                splitedLines[i].map((line, i) => {
                    let delta = 0;
                    if (line.blockElements.length) {
                        switch (line.blockElements[0].type) {
                            case BlockElementType.blockStart:
                                blockLevel++;
                                delta = -1;
                                break;
                            case BlockElementType.blockEnd:
                                blockLevel--;
                                delta = 0;
                                break;
                            case BlockElementType.blockAgain:
                                delta = -1;
                            default:
                                break;
                        }
                    }
                    newText += (newText ? "\n" : "") + this.indent(this.formatLine(line), spaceStr, blockLevel + delta);
                });
                edits.push(new vscode.TextEdit(rangeLines[i].range, newText));
            }
        }
        return edits;
    }

    private indent(lineText: string, spaceStr: string, level: number): string {
        if (!lineText.trim()) return "";
        level = level < 0 ? 0 : level;
        return spaceStr.repeat(level) + lineText.trim();
    }
    private formatLine(line: Line): string {
        if (line.text && line.text.trim() && !line.elements.length)
            throw ("no element found for a non-empty line!");
        if (!line.elements.length) return "";
        if (!this.config.allowInlineFormat) return line.elements.reduce((p, c) => p + c.text, "");
        let text = getElementText(line.elements[0]);
        for (let i = 0; i < line.elements.length - 1; i++) {
            let thisEl = line.elements[i];
            let nextEl = line.elements[i + 1];
            switch (thisEl.type) {
                case ElementType.none:
                case ElementType.word:
                    switch (nextEl.type) {
                        case ElementType.none:
                        case ElementType.punctLeftSpace:
                        case ElementType.operater:
                        case ElementType.word:
                            text += " " + getElementText(nextEl);
                            break;
                        default:
                            text += getElementText(nextEl);
                            break;
                    }
                    break;
                case ElementType.operater:
                    text += " " + getElementText(nextEl);
                    break;
                case ElementType.punctRightSpace:
                    switch (nextEl.type) {
                        case ElementType.none:
                        case ElementType.word:
                        case ElementType.operater:
                        case ElementType.punctLeftSpace:
                            text += " " + getElementText(nextEl);
                            break;
                        default:
                            text += getElementText(nextEl);
                            break;
                    }
                    break;
                case ElementType.punctLeftSpace:
                case ElementType.connector:
                default:
                    switch (nextEl.type) {
                        case ElementType.operater:
                            text += " " + getElementText(nextEl);
                            break;
                        default:
                            text += getElementText(nextEl);
                            break;
                    }
                    break;
            }
        }
        return text;
        function getElementText(el: Element): string {
            if (el.type == ElementType.asIs) return el.text;
            return el.text.trim();
        }
    }
    private splitLine(line: Line, newLineForBlockStart: boolean): Line[] {
        let splitedLine: Line = null;
        let splitedLines: Line[] = [];
        let newLineElements: BlockElement[] = [];
        let lastNewLineBlockElementEnd = -1;
        //Previously pushed elements are part of a blockElement or not
        let inBlockElement = false;
        for (let b of line.blockElements) {
            if (!isInlineBlock(b, line.blockElements)) {
                for (let e of line.elements) {
                    //do not deal with elements after this blockElement
                    if (e.start > b.end) break;
                    //ignore elements before last blockElement
                    if (e.end <= lastNewLineBlockElementEnd) continue;
                    //deal with elements before this blockElement
                    if (e.end < b.start) {
                        if (inBlockElement) pushSplitLine();
                        pushElement(e, null);
                        inBlockElement = false;
                    }
                    if (e.start >= b.start && e.end <= b.end) {
                        //deal with elements of this blockElement
                        if (b.type == BlockElementType.blockStart && !newLineForBlockStart) {
                            pushElement(e, b);
                        } else {
                            if (!inBlockElement) pushSplitLine();
                            pushElement(e, b);
                        }
                        inBlockElement = true;
                    }
                }
                lastNewLineBlockElementEnd = b.end;
            }
        }
        pushSplitLine();
        for (let e of line.elements) {
            if (e.end <= lastNewLineBlockElementEnd) continue;
            pushElement(e, null);
        }
        pushSplitLine();

        return splitedLines;
        function pushSplitLine() {
            if (splitedLine) { splitedLines.push(splitedLine); splitedLine = null }
        }
        function pushElement(el: Element, bl: BlockElement) {
            if (!splitedLine) splitedLine = <Line>{ elements: [], blockElements: [] };
            if (el) splitedLine.elements.push(el);
            if (bl) splitedLine.blockElements.push(bl);
        }
        function isInlineBlock(element: BlockElement, elements: BlockElement[]): boolean {
            let findBegin = false;
            let findEnd = false;
            return elements.reduce((p, e) => {
                //if already true, or not target block, or is self, return previous value.
                if (p || element.level != e.level || element.index != e.index || element.start == e.start) return p;
                if (element.type == BlockElementType.blockStart || element.type == BlockElementType.blockEnd) {
                    if (e.type == (element.type == BlockElementType.blockStart ? BlockElementType.blockEnd : BlockElementType.blockStart)) {
                        return true;
                    }
                } else {
                    if (e.type == BlockElementType.blockStart) findBegin = true;
                    if (e.type == BlockElementType.blockEnd) findEnd = true;
                    if (findBegin && findEnd) return true;
                }
                return false;
            }, false);
        }
    }
}
