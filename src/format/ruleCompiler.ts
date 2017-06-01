import { MultiRegExp2 } from './multiRegExp2';
import { Rules, Capture, Rule, RuleBlock } from './rules';
import { ElementType } from './analyst';

export interface RuleWriting {
    comment?: string,
    match?: RegExp,
    captures?: any,
    isBlock?: boolean,
    begin?: RegExp,
    again?: RegExp,
    end?: RegExp,
    beginCaptures?: any,
    againCaptures?: any,
    endCaptures?: any,
    patterns?: PatternsWriting,
}
export interface PatternsWriting {
    includes?: string[],
    rules?: RuleWriting[],
    type?: ElementType,
}
export interface RuleBlockWriting {
    name: string,
    rules: RuleWriting[]
}
export interface RulesWriting {
    includes?: string[],
    blocks?: RuleBlockWriting[],
    rules?: RuleWriting[],
}

export function compile(rules: RulesWriting, regVars: any): Rules {
    let compiled = new Rules([], [], []);
    compiled.includes = rules.includes;
    if (rules.rules) compiled.rules = compileBlockRules(rules.rules);
    if (rules.blocks) compiled.blocks = compileBlocks(rules.blocks);
    return compiled;
    function compileBlocks(blocks: RuleBlockWriting[]): RuleBlock[] {
        let compiled: RuleBlock[] = [];
        for (let b of blocks) {
            let c: RuleBlock = {
                name: b.name,
                rules: compileBlockRules(b.rules)
            };
            compiled.push(c)
        }
        return compiled;
    }
    function compileBlockRules(rules: RuleWriting[]): Rule[] {
        let compiled: Rule[] = [];
        for (let r of rules) {
            let c: Rule = {};
            c.comment = r.comment ? r.comment : "";
            c.isBlock = r.isBlock ? true : false;
            if (r.begin) c.begin = compileRegExp(r.begin);
            if (r.again) c.again = compileRegExp(r.again);
            if (r.end) c.end = compileRegExp(r.end);
            if (r.match) c.match = compileRegExp(r.match);
            if (r.captures) c.captures = compileCaptures(r.captures);
            if (r.beginCaptures) c.beginCaptures = compileCaptures(r.beginCaptures);
            if (r.againCaptures) c.againCaptures = compileCaptures(r.againCaptures);
            if (r.endCaptures) c.endCaptures = compileCaptures(r.endCaptures);
            if (r.patterns) {
                c.patterns = {};
                if (r.patterns.includes) c.patterns.includes = r.patterns.includes;
                if (r.patterns.type) c.patterns.type = r.patterns.type;
                if (r.patterns.rules) c.patterns.rules = compileBlockRules(r.patterns.rules);
            }
            compiled.push(c);
        }
        return compiled;
    }
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
    function compileCaptures(captures: any): Capture[] {
        let compiled: Capture[] = [];
        let properties = Object.getOwnPropertyNames(captures);
        for (let i = 0; i < properties.length; i++) {
            let c: Capture = {
                index: Number(properties[i]),
                type: captures[properties[i]]
            };
            compiled.push(c);
        }
        return compiled;
    }
}