import * as vscode from 'vscode';
import * as nls from "vscode-nls";
import { join } from "path";

export var outputPanel = vscode.window.createOutputChannel("PlantUML");
export var context: vscode.ExtensionContext;
export var localize: nls.LocalizeFunc;

export function setContext(ctx: vscode.ExtensionContext) {
    context = ctx;
    nls.config(<nls.Options>{ locale: vscode.env.language });
    localize = nls.loadMessageBundle(join(context.extensionPath, "langs", "lang.json"));
}