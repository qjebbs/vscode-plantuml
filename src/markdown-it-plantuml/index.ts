import { renderHtml } from './render';
import { plantumlWorker } from './rule';

export function plantumlPlugin(md: any) {
    md.renderer.rules.plantuml = renderHtml;
    md.core.ruler.push("plantuml", plantumlWorker);
}