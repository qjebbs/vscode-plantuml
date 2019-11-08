import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Diagram } from "./diagram";
import { config } from "../config";

// http://plantuml.com/en/preprocessing
const INCLUDE_REG = /^\s*!(include(?:sub)?)\s+(.+?)(?:!(\w+))?$/i;
const STARTSUB_TEST_REG = /^\s*!startsub\s+(\w+)/i;
const ENDSUB_TEST_REG = /^\s*!endsub\b/i;

interface FileSubBlocks {
    [key: string]: string[];
}

export function getContentWithInclude(diagram: Diagram): string {
    let searchPaths = getSearchPaths(diagram.parentUri);
    return resolveInclude(diagram.lines, searchPaths);
}

function resolveInclude(content: string | string[], searchPaths: string[]): string {
    let lines = content instanceof Array ? content : content.split('\n');
    let processedLines = lines.map(line => line.replace(
        INCLUDE_REG,
        (match: string, ...args: string[]) => {
            let Action = args[0].toLowerCase();
            let target = args[1].trim();
            let sub = args[2];
            let file = path.isAbsolute(target) ? target : findFile(target, searchPaths);
            if (!file) return match;
            if (Action == "include") {
                return getIncludeContent(file) || match;
            }
            if (sub) {
                return getIncludesubContent(file, sub) || match;
            }
            return match;
        }
    ));
    return processedLines.join('\n');
}

// TODO: remove duplicated paths.
function getSearchPaths(uri: vscode.Uri): string[] {
    let searchPaths = [path.dirname(uri.fsPath)];
    searchPaths.push(...config.includepaths(uri));
    let diagramsRoot = config.diagramsRoot(uri);
    if (diagramsRoot)
        searchPaths.push(diagramsRoot.fsPath);
    return searchPaths;
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
    if (!file) return undefined
    let content = fs.readFileSync(file).toString();
    return resolveInclude(content, getSearchPaths(vscode.Uri.file(file)));
}

function getIncludesubContent(file: string, sub: string): string {
    if (!file) return undefined
    let blocks = getSubBlocks(file);
    if (!blocks) return undefined;
    return resolveInclude(blocks[sub], getSearchPaths(vscode.Uri.file(file)));
}

function getSubBlocks(file: string): FileSubBlocks {
    if (!file) return {};
    let blocks: FileSubBlocks = {};
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