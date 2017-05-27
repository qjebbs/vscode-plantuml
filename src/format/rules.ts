import { MultiRegExp2 } from './multiRegExp2';
import { ElementType } from './analyst';
export interface Capture {
    index: number,
    type: ElementType
}
export interface Patterns {
    includes?: string[],
    rules?: Rule[],
    type?: ElementType,
}
export interface Rule {
    comment?: string,
    match?: MultiRegExp2,
    captures?: Capture[],
    isBlock?: boolean,
    begin?: MultiRegExp2,
    again?: MultiRegExp2,
    end?: MultiRegExp2,
    beginCaptures?: Capture[],
    againCaptures?: Capture[],
    endCaptures?: Capture[],
    patterns?: Patterns,
}

export interface RuleBlock {
    name: string,
    rules: Rule[]
}
export class Rules {
    constructor(
        public includes: string[],
        public blocks: RuleBlock[],
        public rules: Rule[]
    ) { }
    get rootRules(): Rule[] {
        let rules: Rule[] = this.rules || [];
        rules.push(...this.getBlockRules(this.includes));
        return rules;
    }
    getPatternRules(patt: Patterns): Rule[] {
        if (!patt) return [];
        let rules = this.getBlockRules(patt.includes)
        if (patt.rules) rules.push(...patt.rules);
        return rules;
    }
    getBlockRules(blockNames: string[]): Rule[] {
        if (!blockNames || !blockNames.length) return [];
        let rules: Rule[] = [];
        for (let inc of blockNames) {
            if (inc == "*") {
                for (let block of this.blocks) {
                    rules.push(...block.rules);
                }
                return rules;
            }
        }
        for (let inc of blockNames) {
            for (let block of this.blocks) {
                if (block.name == inc) {
                    rules.push(...block.rules);
                    break;
                }
            }
        }
        return rules;
    }
}