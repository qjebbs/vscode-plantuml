import * as markdowIt from 'markdown-it';
import { Diagram } from '../plantuml/diagram/diagram';
import { config } from '../plantuml/config';
import { plantumlServer } from '../plantuml/renders/plantumlServer';

export function renderHtml(tokens: markdowIt.Token[], idx: number) {
    // console.log("request html for:", idx, tokens[idx].content);
    let token = tokens[idx];
    if (token.type !== "plantuml") return tokens[idx].content;
    let diagram = new Diagram(token.content);
    return [...Array(diagram.pageCount).keys()].reduce((p, index) => {
        let requestUrl = plantumlServer.makeURL(diagram, "svg");
        if (config.serverIndexParameter) {
            requestUrl += "?" + config.serverIndexParameter + "=" + index;
        }
        p += `\n<img id="image" src="${requestUrl}">`;
        return p;
    }, "");
}