import * as markdowIt from 'markdown-it';
import { Diagram } from '../plantuml/diagram/diagram';
import { config } from '../plantuml/config';
import { plantumlServer } from '../plantuml/renders/plantumlServer';
import { DiagramType } from '../plantuml/diagram/type';

export function renderHtml(tokens: markdowIt.Token[], idx: number) {
    // console.log("request html for:", idx, tokens[idx].content);
    let token = tokens[idx];
    if (token.type !== "plantuml") return tokens[idx].content;
    let diagram = new Diagram(token.content);
    // Ditaa only supports png
    let format = diagram.type == DiagramType.Ditaa ? "png" : "svg";
    return [...Array(diagram.pageCount).keys()].reduce((p, index) => {
        let requestUrl = plantumlServer.makeURL(diagram, format);
        if (config.serverIndexParameter) {
            requestUrl += "?" + config.serverIndexParameter + "=" + index;
        }
        p += `\n<img id="image" src="${requestUrl}">`;
        return p;
    }, "");
}