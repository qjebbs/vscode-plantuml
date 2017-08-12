'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as nls from "vscode-nls";

import { config } from './plantuml/config';
import { previewer } from './providers/previewer';
import { symboler } from "./providers/symboler";
import { formatter } from "./providers/formatter";
import { notifyOnNewVersion } from "./plantuml/messages";
import { setContext, outputPanel, bar } from "./plantuml/common";

import { CommandExportCurrent } from './commands/exportCurrent';
import { CommandExportDocument } from './commands/exportDocument';
import { CommandExportWorkspace } from './commands/exportWorkspace';
import { CommandURLCurrent } from './commands/urlCurrent';
import { CommandURLDocument } from './commands/urlDocument';
import { CommandPreviewStatus } from './commands/previewStatus';
import { plantumlPlugin } from './markdown-it-plantuml/index';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    setContext(context);
    try {
        const ext = vscode.extensions.getExtension("jebbs.plantuml");
        const version = ext.packageJSON.version;
        notifyOnNewVersion(context, version);

        context.subscriptions.push(config.watch());
        //register commands
        context.subscriptions.push(new CommandExportCurrent());
        context.subscriptions.push(new CommandExportDocument());
        context.subscriptions.push(new CommandExportWorkspace());
        context.subscriptions.push(new CommandURLCurrent());
        context.subscriptions.push(new CommandURLDocument());
        context.subscriptions.push(new CommandPreviewStatus());
        //register preview provider
        context.subscriptions.push(...previewer.register());
        //register symbol provider
        context.subscriptions.push(...symboler.register());
        //register formatter provider
        context.subscriptions.push(...formatter.register());
        return {
            extendMarkdownIt(md: any) {
                return md.use(plantumlPlugin(md));
            }
        }
    } catch (error) {
        outputPanel.clear()
        outputPanel.append(error);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
    previewer.stopWatch();
    outputPanel.dispose();
    bar.dispose()
}