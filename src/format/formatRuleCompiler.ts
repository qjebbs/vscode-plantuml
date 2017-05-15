import { MultiRegExp2 } from './multiRegExp2';
export enum FormatType {
    none,
    word,
    operater,
    punctRightSpace,
    punctLeftSpace,
    connector,
    asIs
}
export interface FormatCapture {
    index: number,
    type: FormatType
}
export interface FormatRule {
    comment?: string,
    match?: MultiRegExp2,
    captures?: FormatCapture[],
    blockBegin?: MultiRegExp2,
    blockAgain?: MultiRegExp2,
    blockEnd?: MultiRegExp2,
    blockBeginCaptures?: FormatCapture[],
    blockAgainCaptures?: FormatCapture[],
    blockEndCaptures?: FormatCapture[],
}
export interface FormatRuleWriting {
    comment?: string,
    match?: RegExp,
    captures?: any,
    blockBegin?: RegExp,
    blockAgain?: RegExp,
    blockEnd?: RegExp,
    blockBeginCaptures?: any,
    blockAgainCaptures?: any,
    blockEndCaptures?: any,
}

export function compile(rules: FormatRuleWriting[], regVars: any): FormatRule[] {
    let compiled: FormatRule[] = [];
    for (let r of rules) {
        let c: FormatRule = {};
        c.comment = r.comment ? r.comment : "";
        if (r.blockBegin) c.blockBegin = compileRegExp(r.blockBegin);
        if (r.blockAgain) c.blockAgain = compileRegExp(r.blockAgain);
        if (r.blockEnd) c.blockEnd = compileRegExp(r.blockEnd);
        if (r.match) c.match = compileRegExp(r.match);
        if (r.captures) c.captures = compileCaptures(r.captures);
        if (r.blockBeginCaptures) c.blockBeginCaptures = compileCaptures(r.blockBeginCaptures);
        if (r.blockAgainCaptures) c.blockAgainCaptures = compileCaptures(r.blockAgainCaptures);
        if (r.blockEndCaptures) c.blockEndCaptures = compileCaptures(r.blockEndCaptures);
        compiled.push(c);
    }
    return compiled;

    function compileRegExp(reg: RegExp): MultiRegExp2 {
        let str = reg.source.replace(/\{\{(\w+)\}\}/g, "${regVars.$1}");
        str = str.replace(/\\/g, "\\\\");
        str = eval("`" + str + "`");
        let flags = "";
        flags += reg.ignoreCase ? "i" : "";
        flags += "g";
        let r = new MultiRegExp2(new RegExp(str, flags));
        return r;
    }
    function compileCaptures(captures: any): FormatCapture[] {
        let compiled: FormatCapture[] = [];
        let properties = Object.getOwnPropertyNames(captures);
        for (let i = 0; i < properties.length; i++) {
            let c: FormatCapture = {
                index: Number(properties[i]),
                type: captures[properties[i]]
            };
            compiled.push(c);
        }
        return compiled;
    }
}