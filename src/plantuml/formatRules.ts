import { RulesWriting, RuleBlockWriting, RuleWriting, compile } from './formatter/ruleCompiler';
import { ElementType } from './formatter/analyst';

let ruleVariables = {
    //line begin
    LB: /^\s*/.source,
    //line end
    LE: /\s*$/.source,
    ArrowLeft: /(?:(?:(?:\s+[ox]|[+*])|(?:<\|?|<<|\\\\|\\|\/\/|\})|(?:\s+[ox]|[+*])(?:<\|?|<<|\\\\|\\|\/\/|\}))(?=[-.]))/.source,
    ArrowRight: /(?:(?:\|?>|>>|\\\\|\\|\/\/|\{)|(?:[ox]\s+|[+*])|(?:\|?>|>>|\\\\|\\|\/\/|\{)(?:[ox]\s+|[+*]))/.source,
    Color: /(?:\#(?:[0-9a-f]{6}|[0-9a-f]{3}|\w+)(?:[-\\\/](?:[0-9a-f]{6}|[0-9a-f]{3}|\w+))?)/.source
}

let rules = <RulesWriting>{
    includes: ["Quoted", "Block"],
    blocks: [
        {
            name: "Quoted",
            rules: [
                {
                    comment: "quoted string",
                    begin: /"/i,
                    end: /"/i,
                    beginCaptures: {
                        0: ElementType.punctLeftSpace
                    },
                    endCaptures: {
                        0: ElementType.punctRightSpace
                    },
                    patterns: {
                        type: ElementType.asIs
                    }
                },
                {
                    comment: "quoted activity definition",
                    match: /{{LB}}(:)(.*)([;|<>/\]}]){{LE}}/i,
                    captures: {
                        1: ElementType.punctLeftSpace,
                        2: ElementType.asIs,
                        3: ElementType.punctRightSpace,
                    }
                },
                {
                    comment: "quoted usecase user definition",
                    match: /(:)([^:]+)(:)/i,
                    captures: {
                        1: ElementType.punctLeftSpace,
                        2: ElementType.asIs,
                        3: ElementType.punctRightSpace,
                    }
                },
                {
                    comment: "quoted component definition",
                    match: /(\[)([^\[\]]+)(\])/i,
                    captures: {
                        1: ElementType.punctLeftSpace,
                        2: ElementType.asIs,
                        3: ElementType.punctRightSpace,
                    }
                },
                {
                    comment: "quoted <> <<>>",
                    match: /(<<?)([^<>]+)(>>?)/i,
                    captures: {
                        1: ElementType.punctLeftSpace,
                        2: ElementType.asIs,
                        3: ElementType.punctRightSpace,
                    }
                },
            ]
        },
        {
            name: "Block",
            rules: [
                {
                    comment: "block {}",
                    isBlock: true,
                    begin: /\{[!#+T*-/]?/i,
                    end: /\}/i,
                    patterns: {
                        includes: ["Quoted", "Block"],
                    }
                },
                {
                    comment: "block multiple note",
                    isBlock: true,
                    begin: /{{LB}}note\s+(left|right){{LE}}/i,
                    end: /{{LB}}end\s*note{{LE}}/i,
                    patterns: {
                        type: ElementType.word,
                    }
                },
                {
                    comment: "block multiple note of over",
                    isBlock: true,
                    begin: /{{LB}}([rh]?note)(?:\s+(right|left|top|bottom))?\s+(?:(?:(of|over)\s*(?:[^\s\w\d]([\w\s]+)[^\s\w\d]|(\w+)))|(on\s+link))\s*(#\w+)?{{LE}}/i,
                    end: /{{LB}}end\s*note{{LE}}/i,
                    patterns: {
                        type: ElementType.word,
                    }
                },
                {
                    comment: "block multi-line header, legend, footer",
                    isBlock: true,
                    begin: /{{LB}}(header|legend|footer){{LE}}/i,
                    end: /{{LB}}end\s*(header|legend|footer){{LE}}/i,
                    patterns: {
                        type: ElementType.word,
                    }
                },
                {
                    comment: "block if-else-if",
                    isBlock: true,
                    begin: /{{LB}}(if)\s+\((.+?)?\)(?:\s+(then)(?:\s*\((.+?)?\))?)?/i,
                    again: /{{LB}}(else)(?:\s*\((.+?)?\))?/i,
                    end: /{{LB}}endif{{LE}}/i,
                    beginCaptures: {
                        1: ElementType.word,
                        2: ElementType.asIs,
                        3: ElementType.word,
                        4: ElementType.asIs,
                    },
                    againCaptures: {
                        1: ElementType.word,
                        2: ElementType.asIs,
                    },
                    endCaptures: {
                        0: ElementType.word,
                    },
                    patterns: {
                        includes: ["Quoted", "Block"],
                    }
                },
                {
                    comment: "block split fork",
                    isBlock: true,
                    begin: /{{LB}}(split|fork){{LE}}/i,
                    again: /{{LB}}(split|fork)\s+(again){{LE}}/i,
                    end: /{{LB}}(end)\s*(split|fork){{LE}}/i,
                    againCaptures: {
                        1: ElementType.word,
                        2: ElementType.word,
                    },
                    endCaptures: {
                        1: ElementType.word,
                        2: ElementType.word,
                    },
                    patterns: {
                        includes: ["Quoted", "Block"],
                    }
                },
                {
                    comment: "block repeat while",
                    isBlock: true,
                    begin: /{{LB}}repeat{{LE}}/i,
                    end: /{{LB}}(repeat)\s+(while)(?:\s+\((.+?)?\)(?:\s+(is)(?:\s*\((.+?)?\))?)?)?/i,
                    endCaptures: {
                        1: ElementType.word,
                        2: ElementType.word,
                        3: ElementType.asIs,
                        4: ElementType.word,
                        5: ElementType.asIs,
                    },
                    patterns: {
                        includes: ["Quoted", "Block"],
                    }
                },
                {
                    comment: "block while",
                    isBlock: true,
                    begin: /{{LB}}(while)(?:\s+\((.+?)?\)(?:\s+(is)(?:\s*\((.+?)?\))?)?)?/i,
                    end: /{{LB}}(?:(endwhile)|(end)\s*(while))(?:\s*\((.+)\))?{{LE}}/i,
                    beginCaptures: {
                        1: ElementType.word,
                        2: ElementType.asIs,
                        3: ElementType.word,
                        4: ElementType.asIs,
                    },
                    endCaptures: {
                        1: ElementType.word,
                        2: ElementType.word,
                        3: ElementType.word,
                        4: ElementType.asIs,
                    },
                    patterns: {
                        includes: ["Quoted", "Block"],
                    }
                }
            ]
        },
        {
            name: "Formats",
            rules: [
                {
                    comment: "link operator",
                    match: /(?:{{ArrowLeft}}?[-.]+(\[{{Color}}\])(?:(left|right|up|down)(?:[-.]))?[-.]+{{ArrowRight}}?)|(?:{{ArrowLeft}}[-.]+)|(?:[-.]+{{ArrowRight}})|(?:[-.]{2,})/i,
                    captures: {
                        0: ElementType.operater,
                    }
                },
                //formats
                {
                    comment: "@start,@end",
                    match: /(@(?:start|end)\w+)(?:\s+.+)?{{LE}}/i,
                    captures: {
                        1: ElementType.word,
                        2: ElementType.asIs,
                    }
                },
                {
                    comment: "preprocessing",
                    match: /{{LB}}!\w+/i,
                    captures: {
                        0: ElementType.word,
                    }
                },
                {
                    comment: "seprate line",
                    match: /[-.=]{2,}/i,
                    captures: {
                        0: ElementType.word,
                    }
                },
                {
                    comment: "tree indent",
                    match: /\+{2,}/i,
                    captures: {
                        0: ElementType.word,
                    }
                }
            ]
        },
        {
            name: "Other",
            rules: [
                {
                    comment: "operators",
                    match: /[|]/i,
                    captures: {
                        0: ElementType.operater,
                    }
                },
                {
                    comment: "punct right",
                    match: /[:,?;)}]/i,
                    captures: {
                        0: ElementType.punctRightSpace,
                    }
                },
                {
                    comment: "punct left",
                    match: /[({]/i,
                    captures: {
                        0: ElementType.punctLeftSpace,
                    }
                },
                {
                    comment: "connectors",
                    match: /@/i,
                    captures: {
                        0: ElementType.connector,
                    }
                },
                {
                    comment: "as is: a.b|a.|\\n",
                    match: /(\.|\\\w)\s?/i,
                    captures: {
                        0: ElementType.asIs,
                    }
                },
                {
                    comment: "variables",
                    match: /[\w_]+/i,
                    captures: {
                        0: ElementType.word,
                    }
                }
            ]
        }
    ]
}

export const formatRules = compile(rules, ruleVariables);