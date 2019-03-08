import * as vscode from 'vscode';

import { Diagram } from '../diagram/diagram';
import { localize } from '../common';
import { plantumlServer } from '../renders/plantumlServer';

export interface DiagramURL {
    name: string;
    urls: string[];
}

export function MakeDiagramsURL(diagrams: Diagram[], format: string, bar: vscode.StatusBarItem): DiagramURL[] {
    return diagrams.map<DiagramURL>((diagram: Diagram) => {
        return MakeDiagramURL(diagram, format, bar);
    })
}
export function MakeDiagramURL(diagram: Diagram, format: string, bar: vscode.StatusBarItem): DiagramURL {
    if (bar) {
        bar.show();
        bar.text = localize(16, null, diagram.title);
    }
    return <DiagramURL>{
        name: diagram.title,
        urls: [...Array(diagram.pageCount).keys()].map(index => plantumlServer.makeURL(diagram, format, index))
    }
}