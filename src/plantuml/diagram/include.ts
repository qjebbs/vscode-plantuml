import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Diagram } from "./diagram";
import { config } from "../config";

// http://plantuml.com/en/preprocessing
const INCLUDE_REG = /^\s*!(include(?:sub)?)\s+(.+?)(?:!(\w+))?$/i;
const STARTSUB_TEST_REG = /^\s*!startsub\s+(\w+)/i;
const ENDSUB_TEST_REG = /^\s*!endsub\b/i;

const START_DIAGRAM_REG = /(^|\r?\n)\s*@start.*\r?\n/i;
const END_DIAGRAM_REG = /\r?\n\s*@end.*(\r?\n|$)(?!.*\r?\n\s*@end.*(\r?\n|$))/i;

interface FileSubBlocks {
    [key: string]: string[];
}

interface DictIncluded {
    [key: string]: boolean;
}

let _included: DictIncluded = {};
let _route: string[] = []

export function getContentWithInclude(diagram: Diagram): string {
    _included = {};
    if (diagram.parentUri) {
        _route = [diagram.parentUri.fsPath];
    } else {
        _route = [];
    }
    // console.log('Start from:', _route[0]);
    let searchPaths = getSearchPaths(diagram.parentUri);
    return resolveInclude(diagram.lines, searchPaths);
}

function resolveInclude(content: string | string[], searchPaths: string[]): string {
    let lines = content instanceof Array ? content : content.replace(/\r\n|\r/g, "\n").split('\n');
    let processedLines = lines.map(line => line.replace(
        INCLUDE_REG,
        (match: string, ...args: string[]) => {
            let Action = args[0].toLowerCase();
            let target = args[1].trim();
            let sub = args[2];
            let file = path.isAbsolute(target) ? target : findFile(target, searchPaths);
            let result: string;
            if (Action == "include") {
                result = getIncludeContent(file);
            } else {
                result = getIncludesubContent(file, sub);
            }
            return result === undefined ? match : result;
        }
    ));
    return processedLines.join('\n');
}

function getSearchPaths(uri: vscode.Uri): string[] {
    let searchPaths: string[] = []
    if (uri) {
        searchPaths.push(path.dirname(uri.fsPath));
    }
    searchPaths.push(...config.includepaths(uri));
    let diagramsRoot = config.diagramsRoot(uri);
    if (diagramsRoot)
        searchPaths.push(diagramsRoot.fsPath);
    return Array.from(new Set(searchPaths));
}

function findFile(file: string, searchPaths: string[]): string {
    let found: string;
    for (let dir of searchPaths) {
        found = path.join(dir, file);
        if (fs.existsSync(found))
            return found
    }
    return undefined;
}

function getIncludeContent(file: string): string {
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return undefined
    // console.log('Entering:', file);
    if (_included[file]) {
        // console.log("Ignore file already included:", file);
        return "";
    }
    _route.push(file);
    // TODO: read from editor for unsave changes
    let content = fs.readFileSync(file).toString();
    _included[file] = true;
    let result = resolveInclude(content, getSearchPaths(vscode.Uri.file(file)));
    _route.pop();
    // console.log('Leaving:', file);

    result = result.replace(START_DIAGRAM_REG, "$1");
    result = result.replace(END_DIAGRAM_REG, "$1");

    return result;
}

function getIncludesubContent(file: string, sub: string): string {
    if (!file || !sub) return undefined
    let identifier = `${file}!${sub}`;
    // // Disable sub block duplication check, to keep same behavior with PlantUML project
    // if (included[file]) {
    //     // console.log("ignore block already included:", file);
    //     return "";
    // }
    // console.log('Entering:', identifier);
    let find = findInArray(_route, identifier);
    if (find >= 0) {
        throw 'Include loop detected!' + '\n\n' + makeLoopInfo(find);
    }
    _route.push(identifier);
    let result: string = undefined;
    let blocks = getSubBlocks(file);
    if (blocks) {
        // included[identifier] = true;
        result = resolveInclude(blocks[sub], getSearchPaths(vscode.Uri.file(file)));
    }
    _route.pop();
    // console.log('Leaving:', identifier);
    return result;
}

function getSubBlocks(file: string): FileSubBlocks {
    if (!file) return {};
    let blocks: FileSubBlocks = {};
    // TODO: read from editor for unsave changes
    let lines = fs.readFileSync(file).toString().split('\n');
    let subName = "";
    let match: RegExpMatchArray;
    for (let line of lines) {
        match = STARTSUB_TEST_REG.exec(line);
        if (match) {
            subName = match[1];
            continue;
        } else if (ENDSUB_TEST_REG.test(line)) {
            subName = "";
            continue;
        } else {
            if (subName) {
                if (!blocks[subName]) blocks[subName] = [];
                blocks[subName].push(line);
            }
        }
    }
    return blocks;
}

function findInArray<T>(arr: T[], find: T): number {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == find) return i;
    }
    return -1;
}

function makeLoopInfo(loopID: number): string {
    let lines: string[] = [];
    for (let i = 0; i < loopID; i++) {
        lines.push(_route[i]);
    }
    lines.push('|-> ' + _route[loopID]);
    for (let i = loopID + 1; i < _route.length - 1; i++) {
        lines.push('|   ' + _route[loopID]);
    }
    lines.push('|<- ' + _route[_route.length - 1]);
    return lines.join('\n');
}