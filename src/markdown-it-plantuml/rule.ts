import * as markdowIt from 'markdown-it';

export function plantumlWorker(state: any) {
    // debugInfo(state.tokens);
    let blockTokens: markdowIt.Token[] = state.tokens;
    for (let blockToken of blockTokens) {
        if (blockToken.type == "fence" && blockToken.info == "plantuml") {
            blockToken.type = "plantuml";
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