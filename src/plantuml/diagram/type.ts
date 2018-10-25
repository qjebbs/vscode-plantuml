import { Diagram, diagramStartReg } from "./diagram";

export enum DiagramType {
    UML,
    Ditaa,
    Dot,
    Gantt,
    Salt,
}

export function getType(diagram: Diagram): DiagramType {
    let lineOne = undefined;
    let lineTwo = undefined;
    let match: RegExpExecArray;
    let type: DiagramType = undefined;
    if (match = diagramStartReg.exec(diagram.lines[0])) {
        lineOne = diagram.lines[0];
        lineTwo = diagram.lines[1];
        switch (match[1].toLocaleLowerCase()) {
            case "uml":
                type = DiagramType.UML;
                break;
            case "ditaa":
                type = DiagramType.Ditaa;
                break;
            case "dot":
                type = DiagramType.Dot;
                break;
            case "gantt":
                type = DiagramType.Gantt;
                break;
            case "salt":
                type = DiagramType.Salt;
                break;
            default:
                type = DiagramType.UML;
        }
    } else {
        lineOne = undefined;
        lineTwo = diagram.lines[0];
    }
    if (type === DiagramType.UML) {
        if (/^\s*salt\s*/i.test(lineTwo)) type = DiagramType.Salt;
        else if (/^\s*ditaa/i.test(lineTwo)) type = DiagramType.Ditaa;
        else if (/^\s*digraph\s+[0-9a-z_]+\s*\{\s*/i.test(lineTwo)) type = DiagramType.Dot;
    }
    return type;
}