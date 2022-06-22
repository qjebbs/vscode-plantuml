import * as markdowIt from 'markdown-it';
import { Diagram } from '../plantuml/diagram/diagram';
import { DiagramType } from '../plantuml/diagram/type';
import { MakeDiagramURL } from '../plantuml/urlMaker/urlMaker';
import { config } from '../plantuml/config';
import { localize } from '../plantuml/common';

export function renderHtml(tokens: markdowIt.Token[], idx: number) {
    // console.log("request html for:", idx, tokens[idx].content);
    let token = tokens[idx];
    if (token.type !== "plantuml") return tokens[idx].content;
    let diagram = new Diagram(token.content);
    // Ditaa only supports png
    let format = diagram.type == DiagramType.Ditaa ? "png" : "svg";
    let mimeType = diagram.type == DiagramType.Ditaa ? "image/png" : "image/svg+xml";
    let result = MakeDiagramURL(diagram, format, null);
    let renderAsObject = token.tag == "object" && format == "svg";
    return config.server(null) ?
        result.urls.reduce((p, url) => {
            p += renderAsObject ?
                `\n<object type="${mimeType}" data="${url}"></object>` : // work with markdown extended export, solve #253
                `\n<img style="background-color:#FFF;" src="${url}">`;  // work with preview, solve #258
            return p;
        }, "") :
        `\n<pre><code><code>⚠️${localize(53, null)}\n\n${diagram.content}</code></code></pre>`;
}