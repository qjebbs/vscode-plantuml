import { config, RenderType } from "../../config";
import * as child_process from 'child_process';
import * as vscode from 'vscode';
import { processWrapper } from "../../renders/processWrapper";
import { LanguageWord, REG_CLEAN_LABEL } from "./shared";

export function getLanguageWords(): Promise<LanguageWord[]> {
    let java = config.java(undefined);
    if (config.render(undefined) !== RenderType.Local || !java) {
        return Promise.resolve([]);
    }
    let params = [
        '-Djava.awt.headless=true',
        '-jar',
        config.jar(null),
        "-language",
    ];
    let ps = child_process.spawn(java, params);
    return processWrapper(ps).then(
        buf => processWords(buf.toString()),
        () => []
    )
}

function processWords(value: string): LanguageWord[] {
    let results: LanguageWord[] = [];
    let words = value.split('\n').map(w => w.trim());
    let curKind: vscode.CompletionItemKind = undefined;
    words.forEach(
        word => {
            if (!word) return;
            let label = word.replace(REG_CLEAN_LABEL, "");
            if (!label) return;
            if (word.substr(0, 1) == ';') {
                switch (word) {
                    case ";type":
                        curKind = vscode.CompletionItemKind.Struct
                        return;
                    case ";keyword":
                        curKind = vscode.CompletionItemKind.Keyword
                        return;
                    case ";preprocessor":
                        curKind = vscode.CompletionItemKind.Function
                        return;
                    case ";skinparameter":
                        curKind = vscode.CompletionItemKind.Field
                        return;
                    case ";color":
                        curKind = vscode.CompletionItemKind.Color
                        return;
                    default:
                        return;
                }
            }
            if (!curKind) return;
            results.push(<LanguageWord>{ label: label, name: word, kind: curKind });
        }
    )
    return results;
}
