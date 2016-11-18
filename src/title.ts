interface regReplace {
    find: RegExp;
    replace: string;
}

var regs = [
    // trim and remove Creole in head
    { find: /\s*[\*#=\|]*\s*(.+?)\s*$/m, replace: '$1' },
    // \t to space
    // { find: /(?<!\\)\\t/, replace: ' ' },
    { find: /([^\\])\\[tn]/, replace: '$1' },
    // \\ to \
    { find: /\\\\/, replace: '\\' },
    // *=|
    { find: /\|(\s*[\*#=\|]*)?\s*/, replace: ' ' },
    // |$
    { find: /\|\s*$/, replace: '' },
    // \text\
    { find: /\*{2}(.+)\*{2}/, replace: '$1' },
    // __text__
    { find: /_{2}(.+)_{2}/, replace: '$1' },
    // //text//
    { find: /\/{2}(.+)\/{2}/, replace: '$1' },
    // ""text""
    { find: /"{2}(.+)"{2}/, replace: '$1' },
    // --text--
    { find: /-{2}(.+)-{2}/, replace: '$1' },
    // ~~text~~
    { find: /~{2}(.+)~{2}/, replace: '$1' },
    // remove invalid chrs
    { find: /[\\/:*?"<>|]/, replace: ' ' }
]

export function Deal(value: string): string {
    let title=value;
    for (let rp of regs){
        title=title.replace(rp.find,rp.replace);
    }
    return title;
}