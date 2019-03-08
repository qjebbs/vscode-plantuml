import * as markdowIt from 'markdown-it';
import { Diagram } from '../plantuml/diagram/diagram';
import { config } from '../plantuml/config';
import { plantumlServer } from '../plantuml/renders/plantumlServer';
import { DiagramType } from '../plantuml/diagram/type';
import { MakeDiagramURL } from '../plantuml/urlMaker/urlMaker';

export function renderHtml(tokens: markdowIt.Token[], idx: number) {
    // console.log("request html for:", idx, tokens[idx].content);
    let token = tokens[idx];
    if (token.type !== "plantuml") return tokens[idx].content;
    let diagram = new Diagram(token.content);
    // Ditaa only supports png
    let format = diagram.type == DiagramType.Ditaa ? "png" : "svg";
    let result = MakeDiagramURL(diagram, format, null);
    return result.urls.reduce((p, url) => {
        p += `\n<img id="image" src="${url}" title=${diagram.title}>`;
        return p;
    }, "");
}