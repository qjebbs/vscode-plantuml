import * as vscode from 'vscode';
import * as nls from "vscode-nls";
import { join } from "path";
import { contextManager } from './context';

export const languageid = "diagram";

export var outputPanel = vscode.window.createOutputChannel("PlantUML");
// export var context: vscode.ExtensionContext;
export var localize: nls.LocalizeFunc;
export var bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

contextManager.addInitiatedListener(ctx=>{
    nls.config(<nls.Options>{ locale: vscode.env.language });
    localize = nls.loadMessageBundle(join(ctx.extensionPath, "langs", "lang.json"));
});