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
        let rs: Rule[] = [];
        rs.push(...this.rules);
        rs.push(...this.getBlockRules(this.includes));
        return rs;
    }
    getPatternRules(patt: Patterns): Rule[] {
        if (!patt) return [];
        let rs = this.getBlockRules(patt.includes)
        if (patt.rules) rs.push(...patt.rules);
        return rs;
    }
    getBlockRules(blockNames: string[]): Rule[] {
        if (!blockNames || !blockNames.length) return [];
        let rs: Rule[] = [];
        for (let inc of blockNames) {
            if (inc == "*") {
                for (let block of this.blocks) {
                    rs.push(...block.rules);
                }
                return rs;
            }
        }
        for (let inc of blockNames) {
            for (let block of this.blocks) {
                if (block.name == inc) {
                    rs.push(...block.rules);
                    break;
                }
            }
        }
        return rs;
    }
}