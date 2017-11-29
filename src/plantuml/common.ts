import * as vscode from 'vscode';
import * as nls from "vscode-nls";
import * as child_process from 'child_process';
import { join } from "path";

export const languageid = "diagram";
export const java: string = "java";

export var outputPanel = vscode.window.createOutputChannel("PlantUML");
export var context: vscode.ExtensionContext;
export var localize: nls.LocalizeFunc;
export var bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

let _javaInstalled: boolean = undefined;

export function setContext(ctx: vscode.ExtensionContext) {
    context = ctx;
    nls.config(<nls.Options>{ locale: vscode.env.language });
    localize = nls.loadMessageBundle(join(context.extensionPath, "langs", "lang.json"));
}

export async function javaInstalled(): Promise<boolean> {
    if (_javaInstalled === undefined)
        _javaInstalled = await new Promise<boolean>((resolve, reject) => {
            child_process.exec(java + " -version", (e, stdout, stderr) => {
                if (e instanceof Error) {
                    resolve(false);
                }
                resolve(true);
            });
        });
    return _javaInstalled;
}
