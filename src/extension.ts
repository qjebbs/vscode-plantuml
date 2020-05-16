'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as nls from "vscode-nls";

import { config } from './plantuml/config';
import { previewer } from './providers/previewer';
import { Symbol } from "./providers/symboler";
import { Completion } from "./providers/completion";
import { Signature } from "./providers/signature";
import { Formatter } from "./providers/formatter";
import { notifyOnNewVersion } from "./plantuml/messages";
import { outputPanel, bar } from "./plantuml/common";
import { contextManager } from './plantuml/context';

import { CommandExportCurrent } from './commands/exportCurrent';
import { CommandExportDocument } from './commands/exportDocument';
import { CommandExportWorkspace } from './commands/exportWorkspace';
import { CommandURLCurrent } from './commands/urlCurrent';
import { CommandURLDocument } from './commands/urlDocument';
import { CommandExtractSource } from './commands/extractSource';
import { plantumlPlugin } from './markdown-it-plantuml/index';
import { Diagnoser } from './providers/diagnoser';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    contextManager.set(context);
    try {
        const ext = vscode.extensions.getExtension("jebbs.plantuml");
        const version = ext.packageJSON.version;
        notifyOnNewVersion(context, version);

        context.subscriptions.push(
            new CommandExportCurrent(),
            new CommandExportDocument(),
            new CommandExportWorkspace(),
            new CommandURLCurrent(),
            new CommandURLDocument(),
            new CommandExtractSource(),
            new Formatter(),
            new Symbol(),
            new Completion(),
            new Signature(),
            new Diagnoser(ext),
            previewer,
            config,
            outputPanel,
            bar,
        );
        return {
            extendMarkdownIt(md: any) {
                return md.use(plantumlPlugin);
            }
        }
    } catch (error) {
        outputPanel.clear();
        outputPanel.append(error);
    }
}

// this method is called when your extension is deactivated
export function deactivate() { }
