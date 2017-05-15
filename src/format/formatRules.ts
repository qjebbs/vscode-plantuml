import { FormatRuleWriting, compile, FormatType } from './formatRuleCompiler';

let ruleVariables = {
    //line begin
    LB: /^\s*/.source,
    //line end
    LE: /\s*$/.source,
    ArrowLeft: /(?:(?:(?:\s+[ox]|[+*])|(?:<\|?|<<|\\\\|\\|\/\/|\})|(?:\s+[ox]|[+*])(?:<\|?|<<|\\\\|\\|\/\/|\}))(?=[-.]))/.source,
    ArrowRight: /(?:(?:\|?>|>>|\\\\|\\|\/\/|\{)|(?:[ox]\s+|[+*])|(?:\|?>|>>|\\\\|\\|\/\/|\{)(?:[ox]\s+|[+*]))/.source,
    Color: /(?:\#(?:[0-9a-f]{6}|[0-9a-f]{3}|\w+)(?:[-\\\/](?:[0-9a-f]{6}|[0-9a-f]{3}|\w+))?)/.source
}

let rules: FormatRuleWriting[] = [
    //blocks
    {
        comment: "block {}",
        blockBegin: /{{LB}}(.+)?\{[!#+-T]?{{LE}}/i,
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
        blockBegin: /{{LB}}if\s*(\()/i,
        blockAgain: /{{LB}}else\s*(\()/i,
        blockEnd: /{{LB}}endif{{LE}}/i,
        blockBeginCaptures: {
            1: FormatType.punctLeftSpace
        },
        blockAgainCaptures: {
            1: FormatType.punctLeftSpace
        },
        blockEndCaptures: {
            0: FormatType.word,
        }
    },
    {
        comment: "block split fork",
        blockBegin: /{{LB}}(split|fork){{LE}}/i,
        blockAgain: /{{LB}}(split|fork)\s+(again){{LE}}/i,
        blockEnd: /{{LB}}(end)\s*(split|fork){{LE}}/i,
        blockAgainCaptures: {
            1: FormatType.word,
            2: FormatType.word,
        },
        blockEndCaptures: {
            1: FormatType.word,
            2: FormatType.word,
        }
    },
    {
        comment: "block repeat while",
        blockBegin: /{{LB}}repeat{{LE}}/i,
        blockEnd: /{{LB}}(repeat)\s*(while)\s*(\()/i,
        blockEndCaptures: {
            1: FormatType.word,
            2: FormatType.word,
            3: FormatType.punctLeftSpace
        }
    },
    {
        comment: "block while",
        blockBegin: /{{LB}}(while)\s*(\()/i,
        blockEnd: /{{LB}}(end)\s*(while){{LE}}/i,
        blockBeginCaptures: {
            1: FormatType.word,
            2: FormatType.punctLeftSpace
        },
        blockEndCaptures: {
            1: FormatType.word,
            2: FormatType.word
        }
    },
    {
        comment: "link operator",
        match: /(?:{{ArrowLeft}}?[-.]+(\[{{Color}}\])(?:(left|right|up|down)(?:[-.]))?[-.]+{{ArrowRight}}?)|(?:{{ArrowLeft}}[-.]+)|(?:[-.]+{{ArrowRight}})|(?:[-.]{2,})/i,
        captures: {
            0: FormatType.operater,
        }
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
        comment: "quoted usecase user definition",
        match: /:[^:]+:/i,
        captures: {
            0: FormatType.word,
        }
    },
    {
        comment: "quoted component definition",
        match: /\[[^\[\]]+\]/i,
        captures: {
            0: FormatType.word,
        }
    },
    {
        comment: "quoted <> <<>>",
        match: /<<?[^<>]+>>?/i,
        captures: {
            0: FormatType.word,
        }
    },
    {
        comment: "preprocessing",
        match: /{{LB}}!\w+/i,
        captures: {
            0: FormatType.word,
        }
    },
    {
        comment: "operators",
        match: /[-+=/|*&]/i,
        captures: {
            0: FormatType.operater,
        }
    },
    {
        comment: "punct right",
        match: /[:,?;)}]/i,
        captures: {
            0: FormatType.punctRightSpace,
        }
    },
    {
        comment: "punct left",
        match: /[({]/i,
        captures: {
            0: FormatType.punctLeftSpace,
        }
    },
    {
        comment: "connectors",
        match: /@/i,
        captures: {
            0: FormatType.connector,
        }
    },
    {
        comment: "as is: a.b|a.|\\n",
        match: /(\.|\\\w)\s?/i,
        captures: {
            0: FormatType.asIs,
        }
    },
    {
        comment: "variables",
        match: /[\w_]+/i,
        captures: {
            0: FormatType.word,
        }
    }
]
export const formatRules = compile(rules, ruleVariables);