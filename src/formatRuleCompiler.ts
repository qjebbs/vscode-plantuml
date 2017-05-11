export enum FormatType {
    none,
    word,
    operater,
    punct
}
export interface FormatCapture {
    index: number,
    type: FormatType
}
export interface FormatRule {
    match?: RegExp,
    captures?: FormatCapture[],
    begin?: RegExp,
    again?: RegExp,
    end?: RegExp,
    beginCaptures?: FormatCapture[],
    againCaptures?: FormatCapture[],
    endCaptures?: FormatCapture[],
}
export interface FormatRuleWriting {
    match?: RegExp,
    captures?: any,
    begin?: RegExp,
    again?: RegExp,
    end?: RegExp,
    beginCaptures?: any,
    againCaptures?: any,
    endCaptures?: any,
}

export function compile(rules: FormatRuleWriting[], regVars: any): FormatRule[] {
    let compiled: FormatRule[] = [];
    for (let r of rules) {
        let c: FormatRule = {};
        if (r.begin) c.begin = compileRegExp(r.begin);
        if (r.again) c.again = compileRegExp(r.again);
        if (r.end) c.end = compileRegExp(r.end);
        if (r.match) c.match = compileRegExp(r.match);
        if (r.captures) c.captures = compileCaptures(r.captures);
        if (r.beginCaptures) c.beginCaptures = compileCaptures(r.beginCaptures);
        if (r.againCaptures) c.beginCaptures = compileCaptures(r.beginCaptures);
        if (r.endCaptures) c.endCaptures = compileCaptures(r.endCaptures);
        compiled.push(c);
    }
    return compiled;

    function compileRegExp(reg: RegExp): RegExp {
        let str = reg.source.replace(/\{\{(\w+)\}\}/g, "${regVars.$1}");
        str = str.replace(/\\/g, "\\\\");
        str = eval("`" + str + "`");
        let flags = "";
        flags += reg.ignoreCase ? "i" : "";
        flags += "g";
        let r = new RegExp(str, flags);
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