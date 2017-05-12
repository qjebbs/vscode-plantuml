import { FormatRuleWriting, compile, FormatType } from './formatRuleCompiler';

let ruleVariables = {
    //line begin
    LB: /^\s*/.source,
    //line end
    LE: /\s*$/.source
}

let rules: FormatRuleWriting[] = [
    //blocks
    {
        comment: "block {}",
        blockBegin: /{{LB}}(.+)?\{[!#+-]?{{LE}}/i,
        blockEnd: /{{LB}}\}{{LE}}/i
    },
    {
        comment: "block multiple note",
        blockBegin: /{{LB}}note\s+(left|right){{LE}}/i,
        blockEnd: /{{LB}}end\s*note{{LE}}/i
    },
    {
        comment: "block multiple note of over",
        blockBegin: /{{LB}}([rh]?note)(?:\s+(right|left|top|bottom))?\s+(?:(?:(of|over)\s*(?:[^\s\w\d]([\w\s]+)[^\s\w\d]|(\w+)))|(on\s+link))\s*(#\w+)?{{LE}}/i,
        blockEnd: /{{LB}}end\s*note{{LE}}/i
    },
    {
        comment: "block multi-line header, legend, footer",
        blockBegin: /{{LB}}(header|legend|footer){{LE}}/i,
        blockEnd: /{{LB}}end\s*(header|legend|footer){{LE}}/i
    },
    {
        comment: "block if-else-if",
        blockBegin: /{{LB}}if\s*\(/i,
        blockAgain: /{{LB}}else\s*\(/i,
        blockEnd: /{{LB}}end\s*if{{LE}}/i
    },
    {
        comment: "block if-else-if",
        blockBegin: /{{LB}}(split|fork){{LE}}/i,
        blockAgain: /{{LB}}(split|fork)\s+again{{LE}}/i,
        blockEnd: /{{LB}}end\s*(split|fork){{LE}}/i
    },
    {
        comment: "block repeat while",
        blockBegin: /{{LB}}repeat{{LE}}/i,
        blockEnd: /{{LB}}repeat\s*while\s*\(/i
    },
    {
        comment: "block while",
        blockBegin: /{{LB}}while\s*\(/i,
        blockEnd: /{{LB}}end\s*while{{LE}}/i
    },
    //formats
    {
        comment: "@start,@end",
        match: /@(start|end)\w+/i,
        captures: {
            0: FormatType.word,
        }
    },
    {
        comment: "quoted string",
        match: /"[^"]*"/i,
        captures: {
            0: FormatType.word,
        }
    },
    {
        comment: "quoted activity definition",
        match: /{{LB}}:.*[;|<>/\]}]{{LE}}/i,
        captures: {
            0: FormatType.word,
        }
    },
    {
        comment: "link operater",
        match: new RegExp("((?:(?:(?:\\s+[ox]|[+*])?(?:<\\|?|<<|\\\\\\\\|\\\\|//|\\})?)(?=[-.]))[-.]+(\\[(?:\\#(?:[0-9a-f]{6}|[0-9a-f]{3}|\\w+)(?:[-\\\\/](?:[0-9a-f]{6}|[0-9a-f]{3}|\\w+))?\\b)\\])?(?:(left|right|up|down)(?:[-.]))?[-.]*(?:(?:\\|?>|>>|\\\\\\\\|\\\\|//|\\{)?(?:[ox]\\s+|[+*])?))", "i"),
        captures: {
            0: FormatType.operater,
        }
    },
    {
        comment: "variables",
        match: /\b[\w_]+/i,
        captures: {
            0: FormatType.word,
        }
    }
]
export const formatRules = compile(rules, ruleVariables);