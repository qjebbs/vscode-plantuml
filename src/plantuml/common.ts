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

export function javaInstalled(): boolean {
    if (!_javaInstalled){
        try {
            child_process.execSync(java + " -version");
            _javaInstalled = true
        } catch (error) {
            _javaInstalled = false
        }}
    return _javaInstalled;
}
