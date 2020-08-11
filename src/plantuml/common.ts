import * as vscode from 'vscode';
import * as nls from "vscode-nls";
import { join } from "path";

export const languageid = "plantuml";

export var outputPanel = vscode.window.createOutputChannel("PlantUML");
export var bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
export const extensionPath = vscode.extensions.getExtension("jebbs.plantuml").extensionPath;

nls.config(<nls.Options>{ locale: vscode.env.language });
export var localize: any = nls.loadMessageBundle(join(extensionPath, "langs", "lang.json"));
