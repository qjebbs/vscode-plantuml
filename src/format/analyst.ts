import * as vscode from 'vscode';
import { Rules, Rule, Capture } from './rules';
import { MatchPositions, UnmatchedText } from './matchPositions';
import { MultiRegExp2, MultiRegExMatch } from './multiRegExp2';

interface Line {
    text: string,
    newText: string,
    matchPositions: MatchPositions,
    elements: Elemet[],
    blockElements: BlockElemet[]
}

interface Elemet {
    type: ElementType,
    text: string,
    start: number,
    end: number
}

interface BlockElemet {
    type: BlockElementType,
    text: string,
    start: number,
    end: number
}

export enum ElementType {
    none,
    word,
    operater,
    punctRightSpace,
    punctLeftSpace,
    connector,
    asIs,
}

export enum BlockElementType {
    blockStart,
    blockAgain,
    blockEnd,
}

interface Position {
    line: number,
    position: number
}
export class Analyst {
    private _lines: Line[];
    private _rules: Rules;
    constructor(lines: string[], rules: Rules) {
        this._lines = lines.map(v => {
            return <Line>{
                text: v,
                newText: "",
                matchPositions: new MatchPositions(v),
                elements: [],
                blockElements: []
            }
        });
        this._rules = rules;
    }
    get lines(): Line[] {
        return this._lines;
    }
    analysis() {
        let rules: Rule[] = this._rules.rootRules;
        this.match(rules);
        this._lines.map(v => {
            makeLineElements(v);
        });
        function makeLineElements(line: Line) {
            if (line.elements.length) line.elements.sort((a, b) => a.start - b.start);
            let pos = 0;
            let els: Elemet[] = [];
            for (let e of line.elements) {
                if (e.start > pos && line.text.substring(pos, e.start).trim()) els.push({
                    type: ElementType.none,
                    text: line.text.substring(pos, e.start),
                    start: pos,
                    end: e.start - 1
                });
                pos = e.end + 1;
            }
            if (pos < line.text.length && line.text.substring(pos, line.text.length).trim()) {
                els.push({
                    type: ElementType.none,
                    text: line.text.substring(pos, line.text.length),
                    start: pos,
                    end: line.text.length - 1
                });
            }
            line.elements.push(...els);
            if (line.elements.length) line.elements.sort((a, b) => a.start - b.start);
        }
    }
    //TODO: start stop range
    private doMatch(rule: Rule) {
        if (!rule.match) return;
        this._lines.map(line => {
            for (let u of line.matchPositions.GetUnmatchedTexts()) {
                if (!u.text.trim()) continue;
                // console.log("test", u.text, "with", patt.regExp.source);
                let matches: MultiRegExMatch[] = [];
                rule.match.regExp.lastIndex = 0;
                while (matches = rule.match.execForAllGroups(u.text, false)) {
                    // console.log("TEST", u.text, "MATCH", matches[0].match, "WITH", rule.match.regExp.source);
                    this.markElement(line, matches, rule.captures, u.offset);
                }
                rule.match.regExp.lastIndex = 0;
            }
        });
    }
    private markElement(line: Line, matches: MultiRegExMatch[], captures: Capture[], offset: number) {
        line.matchPositions.AddPosition(matches[0].start, matches[0].end, offset);
        if (captures) {
            for (let capture of captures) {
                if (matches[capture.index]) line.elements.push(
                    <Elemet>{
                        type: capture.type,
                        text: matches[capture.index].match,
                        start: matches[capture.index].start + offset,
                        end: matches[capture.index].end + offset,
                    }
                );
            }
        }
    }
    private markBlockElement(line: Line, rule: Rule, type: BlockElementType, matches: MultiRegExMatch[], offset: number) {
        if (!rule.isBlock) return;
        line.blockElements.push(
            <BlockElemet>{
                type: type,
                text: matches[0].match,
                start: matches[0].start + offset,
                end: matches[0].end + offset,
            }
        );
    }
    private match(rules: Rule[], start?: Position, stopRule?: Rule): Position {
        for (let rule of rules) {
            //test match    
            if (rule.match) {
                //TODO: start
                this.doMatch(rule);
            }
            //test block in
            else if (rule.begin && rule.end) {
                this.doBeginMatch(rule, start, stopRule);
            }
        }
        return this.doEndMatch(stopRule, start);
    }
    private doEndMatch(rule: Rule, start: Position): Position {
        if (!rule || !rule.begin || !rule.end) return start;
        for (let i = 0; i < this._lines.length; i++) {
            if (start && start.line > i) continue;
            let line = this._lines[i];
            for (let u of line.matchPositions.GetUnmatchedTexts()) {
                rule.end.regExp.lastIndex = 0;
                // console.log("test rule", u.text, "with", rule.comment);
                let matches: MultiRegExMatch[] = [];
                if (matches = rule.end.execForAllGroups(u.text, false)) {
                    this.markElement(line, matches, rule.endCaptures, u.offset);
                    this.markBlockElement(line, rule, BlockElementType.blockEnd, matches, u.offset);
                    // console.log("Find end:", matches[0].match, "at", i, ":", matches[0].start + u.offset - 1);
                    let endAt = {
                        line: i,
                        position: matches[0].end + u.offset + 1
                    }
                    if (endAt.position > line.text.length - 1) endAt = {
                        line: i + 1,
                        position: 0
                    }
                    console.log("LEAVE RECURSIVE LEVEL", this._TEST_RECURSIVE_COUNT--, "FROM", rule.comment, "BY", matches[0].match, "AT", endAt.line, endAt.position);
                    return endAt;
                }
            }
        }
        console.log("WARNING: LEAVE RECURSIVE LEVEL", this._TEST_RECURSIVE_COUNT--, "FROM", rule.comment, "DUE TO EOF.");
    }
    private _TEST_RECURSIVE_COUNT = 0;
    private doBeginMatch(rule: Rule, start: Position, stopRule?: Rule) {
        if (!rule.begin || !rule.end) return;
        let beginAt: Position;
        for (let i = 0; i < this._lines.length; i++) {
            if (start && start.line > i) continue;
            let line = this._lines[i];
            for (let u of line.matchPositions.GetUnmatchedTexts()) {
                rule.begin.regExp.lastIndex = 0;
                if (rule.again) rule.again.regExp.lastIndex = 0;
                rule.end.regExp.lastIndex = 0;
                if (start && start.line == i && start.position > u.offset + u.text.length) continue;
                if (!u.text.trim()) continue;
                let matches: MultiRegExMatch[] = [];
                let matched = false;

                //find begin
                if (matches = rule.begin.execForAllGroups(u.text, false)) {
                    matched = true;
                    beginAt = {
                        line: i,
                        position: matches[0].end + u.offset + 1
                    }
                    if (beginAt.position > line.text.length - 1) beginAt = {
                        line: i + 1,
                        position: 0
                    }
                    this.markElement(line, matches, rule.beginCaptures, u.offset);
                    this.markBlockElement(line, rule, BlockElementType.blockStart, matches, u.offset);
                    // console.log("Find begin:", matches[0].match, "at", beginAt.line, ":", beginAt.position);
                    console.log("ENTER RECURSIVE LEVEL", ++this._TEST_RECURSIVE_COUNT, "OF", rule.comment, "BY", matches[0].match, "AT", beginAt.line, beginAt.position);
                    let blockRules = this._rules.getPatternRules(rule.patterns)
                    if (blockRules.length) this.match(blockRules, beginAt, rule);
                }

                //find again
                if (!matched && rule.again) {
                    if (matches = rule.again.execForAllGroups(u.text, false)) {
                        matched = true;
                        this.markElement(line, matches, rule.beginCaptures, u.offset);
                        this.markBlockElement(line, rule, BlockElementType.blockAgain, matches, u.offset);
                        console.log("Find again:", matches[0].match, "at", i, ":", matches[0].start + u.offset)
                    }
                }
                // return if find stop
                if (stopRule) {
                    stopRule.end.regExp.lastIndex = 0;
                    if (matches = stopRule.end.execForAllGroups(u.text, false)) {
                        // console.log("stop:", rule.comment, "by:", matches[0].match, "at", i, ":", matches[0].start + u.offset - 1);
                        return;
                    }
                }
            }
        }
    }
    private markBlockElements(lineStart: number, posStart: number, lineEnd: number, posEnd: number) {
        console.log("mark!!!!!!!!");
    }
}