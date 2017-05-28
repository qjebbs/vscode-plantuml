import * as vscode from 'vscode';
import { formatRules } from './rulesWriting';
import { Rule, Capture } from './rules';
import { MatchPositions, UnmatchedText } from './matchPositions';
import { config } from '../config';
import { outputPanel } from '../planuml';
import { showError, parseError } from '../tools';
import { MultiRegExp2, MultiRegExMatch } from './multiRegExp2';
import { ElementType, BlockElementType, Analyst } from './analyst';

interface Line {
    text: string,
    matchPositions: MatchPositions,
    elements: Elemet[]
}
interface Elemet {
    type: ElementType,
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

    formate(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
        let edits: vscode.TextEdit[] = [];
        const spaceStr = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";
        let lineTexts: string[] = [];
        let lines: vscode.TextLine[] = [];
        for (let i = 0; i < document.lineCount; i++) {
            lines.push(document.lineAt(i));
            lineTexts.push(lines[i].text);
        }
        let analyst = new Analyst(lineTexts, formatRules);
        analyst.analysis();
        let blockLevel = 0;
        analyst.lines.map((line, i) => {
            let delta = 0;
            let newText = this.formatLine(line);
            blockLevel = line.blockElements.reduce((p, c) => {
                switch (c.type) {
                    case BlockElementType.blockStart:
                        // p++;
                        if (++p > blockLevel) delta = -1;
                        break;
                    case BlockElementType.blockEnd:
                        --p;
                        delta = 0;
                        break;
                    case BlockElementType.blockAgain:
                        delta = -1;
                    default:
                        break;
                }
                return p;
            }, blockLevel);
            newText = this.indent(newText, spaceStr, blockLevel + delta);
            edits.push(new vscode.TextEdit(lines[i].range, newText));
        });
        return edits;
    }


    private indent(lineText: string, spaceStr: string, level: number): string {
        if (!lineText.trim()) return "";
        level = level < 0 ? 0 : level;
        return spaceStr.repeat(level) + lineText.trim();
    }
    private formatLine(line: Line): string {
        if (line.text.trim() && !line.elements.length)
            throw ("no element found for a non-empty line!");
        if (!line.elements.length) return "";
        let text = getElementText(line.elements[0]);
        // let formatType: FormatType;
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
                case ElementType.punctRightSpace:
                    switch (nextEl.type) {
                        case ElementType.none:
                        case ElementType.word:
                        case ElementType.punctLeftSpace:
                            text += " " + getElementText(nextEl);
                            break;
                        default:
                            text += getElementText(nextEl);
                            break;
                    }
                    break;
                case ElementType.punctLeftSpace:
                    text += getElementText(nextEl);
                    break;
                case ElementType.connector:
                    text += getElementText(nextEl);
                    break;
                default:
                    text += getElementText(nextEl);
                    break;
            }
        }
        return text;
        function getElementText(el: Elemet): string {
            if (el.type == ElementType.asIs) return el.text;
            return el.text.trim();
        }
    }
}

export const formatter = new Formatter();