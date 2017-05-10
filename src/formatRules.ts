import * as compiler from './formatRuleCompiler';

let ruleVariables = {
    //line begin
    LB: /^\s*/.source,
    //line end
    LE: /\s*$/.source
}

let rules: compiler.FormatRuleWriting[] = [
    //common
    //{} block
    {
        begin: /{{LB}}(.+)?\{[!#+-]?{{LE}}/i,
        end: /{{LB}}\}{{LE}}/i
    },
    //multiple note
    {
        begin: /{{LB}}note\s+(left|right){{LE}}/i,
        end: /{{LB}}end\s*note{{LE}}/i
    },
    //multiple note of over
    {
        begin: /{{LB}}([rh]?note)(?:\s+(right|left|top|bottom))?\s+(?:(?:(of|over)\s*(?:[^\s\w\d]([\w\s]+)[^\s\w\d]|(\w+)))|(on\s+link))\s*(#\w+)?{{LE}}/i,
        end: /{{LB}}end\s*note{{LE}}/i
    },
    //multi-line header, legend, footer
    {
        begin: /{{LB}}(header|legend|footer){{LE}}/i,
        end: /{{LB}}end\s*(header|legend|footer){{LE}}/i
    },
    //Activity
    //if-else-if
    {
        begin: /{{LB}}if\s*\(/i,
        again: /{{LB}}else\s*\(/i,
        end: /{{LB}}end\s*if{{LE}}/i
    },
    //split, fork
    {
        begin: /{{LB}}[split|fork]{{LE}}/i,
        again: /{{LB}}[split|fork]\s+again{{LE}}/i,
        end: /{{LB}}end\s*[split|fork]{{LE}}/i
    },
    //repeat while
    {
        begin: /{{LB}}repeat{{LE}}/i,
        end: /{{LB}}repeat\s*while\s*\(/i
    },
    //while
    {
        begin: /{{LB}}while\s*\(/i,
        end: /{{LB}}end\s*while{{LE}}/i
    }
]
export const formatRules = compiler.compile(rules, ruleVariables);