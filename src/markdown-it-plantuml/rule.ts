import * as markdowIt from 'markdown-it';

export function plantumlWorker(state: any) {
    // debugInfo(state.tokens);
    let blockTokens: markdowIt.Token[] = state.tokens;
    for (let blockToken of blockTokens) {
        if (blockToken.type == "fence" &&( blockToken.info.startsWith("plantuml")|| blockToken.info.startsWith("puml")|| blockToken.info.startsWith("{uml}"))) {
            blockToken.type = "plantuml";
            // always render as <img> for maximum compatibility:
            // https://github.com/qjebbs/vscode-markdown-extended/issues/67#issuecomment-554996262
            blockToken.tag = "img";
            // if (state.env && state.env.htmlExporter) { // work with markdown extended export, solve #253
            //     blockToken.tag = "object";
            // } else {
            //     blockToken.tag = "img";
            // }
        }
    }
}

function debugInfo(blockTokens: markdowIt.Token[]) {
    for (let blockToken of blockTokens) {
        console.log(blockToken.type, blockToken.info, blockToken.tag, blockToken.content);
        if (!blockToken.children) continue;
        for (let token of blockToken.children) {
            console.log("children:", token.type, token.info, token.tag, token.content);
        }
    }
}