import * as vscode from 'vscode';
import * as linq from 'linq-collections'
import { diagramAt } from '../diagram/tools';
import { Diagram } from '../diagram/diagram';

const macroDefRegex = /!(?:define|definelong) (\w+)(?:\(((?:,? *(?:\w)+ *(?:= *".+")?)+)\))?/i;
const macroCallRegex = /(!(?:define|definelong) )?(\w+)\(([\w, "]*)\)?/gi

export function macrosOf(target: vscode.TextDocument | Diagram, position: vscode.Position): linq.List<MacroDefinition> {
    let rawDefinitions = new linq.List<MacroDefinition>();
    
    if (!target) return rawDefinitions;
    let diagram = target instanceof Diagram ? target : diagramAt(target, position);

    for (let line of diagram.lines) {
        const match = macroDefRegex.exec(line);
        if (!match) {
            continue;
        }

        const name = match[1];
        const params = splitParams(match[2]);

        var existingDef = rawDefinitions.singleOrDefault(d => d.name == name);
        if (!existingDef) {
            existingDef = new MacroDefinition(name);
            rawDefinitions.push(existingDef);
        }

        existingDef.addSignature(params);
    }

    return rawDefinitions;
}

function splitParams(paramsString: string): string[] {
    return (paramsString || "")
        .split(",")
        .map(p => p.trim())
        .filter(p => p);
}

export function macroCallOf(line: vscode.TextLine, position: number): MacroCallInfo {
    let match: RegExpExecArray;

    macroCallRegex.lastIndex = 0;
    while (match = macroCallRegex.exec(line.text)) {
        var start = match.index;
        var end = match.index + match[0].length;

        if (start <= position && position <= end) {
            break;
        }
    }

    if (!match || match[1]) {
        return null
    }

    const macroName = match[2];
    const availableParameters = match[3].split(",").length;
    const activeParameter = line.text.substring(start, position).split(",").length - 1;

    return new MacroCallInfo(macroName, availableParameters, activeParameter);
}

export class MacroCallInfo {
    macroName: string;
    availableParameters: number;
    activeParameter: number;

    constructor(macroName: string, availableParameters: number, activeParameter: number) {
        this.macroName = macroName;
        this.availableParameters = availableParameters;
        this.activeParameter = activeParameter;
    }
}

export class MacroDefinition {
    name: string;
    private signatures: linq.IList<string[]>;

    constructor(name: string) {
        this.name = name;
        this.signatures = new linq.List<string[]>();
    }

    public addSignature(params: string[]) {
        this.signatures.push(params);
        this.signatures = this.signatures.orderBy(s => s.length).toList();
    }

    public getSignatures(): linq.IReadOnlyList<string[]> {
        return this.signatures.asReadOnly();
    }

    public getDetailLabel(): string {
        const firstSignature = this.signatures.first();

        const signatureLabel = this.getSignatureLabel(firstSignature);

        let overloadLabel = "";
        if (this.signatures.count() == 2) {
            overloadLabel = " (+1 overload)";
        } else if (this.signatures.count() > 2) {
            overloadLabel = ` (+${this.signatures.count() - 1} overloads)`;
        }

        return signatureLabel + overloadLabel;
    }

    public getSignatureLabel(params: string[]): string {
        let paramsLabel = "";
        if (params.length > 0) {
            paramsLabel = "(" + params.join(", ") + ")";
        }

        return this.name + paramsLabel;
    }
}