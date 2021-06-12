interface regReplaceBF {
    find: RegExp;
    replace: string;
}

const regs: regReplaceBF[] = [
    // PlantUML Builtin functions
    // https://plantuml.com/de/preprocessing#291cabbe982ff775
    // Replace %darken("red", 20)
    { find: /(\%darken\(.+?(?=\))\))/mg, replace: '' },
    // Replace %date("yyyy.MM.dd' at 'HH:mm")
    { find: /(\%date\(.+?(?=\))\))/mg, replace: (function () { let today = new Date().toLocaleDateString(); return today; }()) },
    // Replace %dirpath()
    // Not working in VSCode preview in title tag
    // { find: /(\%dirpath\(\))/mg, replace: 'dirpath' },
    // Replace %feature("theme")
    { find: /(\%feature\(.+?(?=\))\))/mg, replace: 'feature' },
    // Replace %false()
    { find: /(\%false\(\))/mg, replace: 'false' },
    // Replace %file_exists("c:/foo/dummy.txt")
    { find: /(\%file_exists\(.+?(?=\))\))/mg, replace: 'file_exists' },
    // Replace %filename()
    { find: /(\%filename\(\))/mg, replace: 'filename' },
    // Replace %function_exists("$some_function")
    { find: /(\%function_exists\(.+?(?=\))\))/mg, replace: 'function_exists' },
    // Replace %get_variable_value("$my_variable")
    // Not working in VSCode preview in title tag
    // { find: /(\%get_variable_value\(.+?(?=\))\))/mg, replace: 'get_variable_value' },
    // Replace %getenv("OS")
    { find: /(\%getenv\(.+?(?=\))\))/mg, replace: 'getenv' },
    // Replace %intval("42")
    { find: /(\%intval\(.+?(?=\))\))/mg, replace: 'intval' },
    // Replace %is_dark("#000000")
    { find: /(\%is_dark\(.+?(?=\))\))/mg, replace: 'is_dark' },
    // Replace %is_light("#000000")
    { find: /(\%is_light\(.+?(?=\))\))/mg, replace: 'is_light' },
    // Replace %lighten("red", 20)
    { find: /(\%lighten\(.+?(?=\))\))/mg, replace: 'lighten' },
    // Replace %lower("Hello")
    { find: /(\%lower\(.+?(?=\))\))/mg, replace: 'lower' },
    // Replace %newline()
    // Not working in VSCode preview in title tag
    // { find: /(\%newline\(\))/mg, replace: ' ' },
    // Replace %not(2+2==4)
    { find: /(\%not\(.+?(?=\))\))/mg, replace: 'not' },
    // Replace %reverse_color("#FF7700")
    { find: /(\%reverse_color\(.+?(?=\))\))/mg, replace: 'reverse_color' },
    // Replace %reverse_hsluv_color("#FF7700")
    { find: /(\%reverse_hsluv_color\(.+?(?=\))\))/mg, replace: 'reverse_hsluv_color' },
    // Replace %set_variable_value("$my_variable", "some_value")
    // Not working in VSCode preview in title tag
    // { find: /(\%set_variable_value\(.+?(?=\))\))/mg, replace: 'set_variable_value' },
    // Replace %string(1 + 2)
    { find: /(\%string\(.+?(?=\))\))/mg, replace: 'string' },
    // Replace %strlen("foo")
    { find: /(\%strlen\(.+?(?=\))\))/mg, replace: 'strlen' },
    // Replace %strpos("abcdef", "ef")
    { find: /(\%strpos\(.+?(?=\))\))/mg, replace: 'strpos' },
    // Replace %substr("abcdef", 3, 2)
    { find: /(\%substr\(.+?(?=\))\))/mg, replace: 'substr' },
    // Replace %true()
    { find: /(\%true\(\))/mg, replace: 'true' },
    // Replace %upper("Hello")
    { find: /(\%upper\(.+?(?=\))\))/mg, replace: 'upper' },
    // Replace %variable_exists("$my_variable")
    { find: /(\%variable_exists\(.+?(?=\))\))/mg, replace: 'variable_exists' },
    // Replace %version()
    { find: /(\%version\(\))/mg, replace: 'version' },
]

export function Deal(instring: string): string {
    let workstring = instring;
    for (let rp of regs) {
        workstring = workstring.replace(rp.find, rp.replace).trim();
    }
    return workstring;
}