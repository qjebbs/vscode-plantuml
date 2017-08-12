import * as markdowIt from 'markdown-it';
import { renderHtml } from './render';
import { plantumlWorker } from './rule';

export function plantumlPlugin(md: markdowIt.MarkdownIt) {
    md.renderer.rules.plantuml = renderHtml;
    md.core.ruler.push("plantuml", plantumlWorker);
}