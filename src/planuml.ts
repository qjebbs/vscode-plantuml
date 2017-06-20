import * as vscode from 'vscode';
import * as nls from "vscode-nls";
import { join } from "path";

import { config } from './config';
import { exporter } from './exporter';
import { previewer } from './previewer';
import { builder } from "./builder";
import { symboler } from "./symboler";
import { urlMaker } from "./urlMaker";
import { formatter } from "./format/formatter";
import { Messages, SuppressedKeys } from "./messages";

export var outputPanel = vscode.window.createOutputChannel("PlantUML");
export var context: vscode.ExtensionContext;
export var localize: nls.LocalizeFunc;

export class PlantUML {
    constructor(ctx: vscode.ExtensionContext) {
        context = ctx;
        nls.config(<nls.Options>{ locale: vscode.env.language });
        localize = nls.loadMessageBundle(join(context.extensionPath, "langs", "lang.json"));
    }

    activate(): vscode.Disposable[] {
        try {
            
            const ext = vscode.extensions.getExtension("jebbs.plantuml");
            const version = ext.packageJSON.version;
            this.notifyOnNewVersion(context, version);

            let ds: vscode.Disposable[] = [];
            ds.push(config.watch());
            //register export
            ds.push(...exporter.register());
            //register preview
            ds.push(...previewer.register());
            //register builder
            ds.push(...builder.register());
            //register symbol provider
            ds.push(...symboler.register());
            //register server
            ds.push(...urlMaker.register());
            //register formatter
            ds.push(...formatter.register());
            return ds;
        } catch (error) {
            outputPanel.clear()
            outputPanel.append(error);
        }
    }
    deactivate() {
        previewer.stopWatch();
        outputPanel.dispose();
    }
    // code modified from:
    // https://github.com/eamodio/vscode-gitlens
    async  notifyOnNewVersion(context: vscode.ExtensionContext, version: string) {
        Messages.configure(context);
        if (context.globalState.get(SuppressedKeys.UpdateNotice, false)) return;
        const previousVersion = context.globalState.get<string>("version");

        if (previousVersion === undefined) {
            await Messages.showWelcomeMessage();
            return;
        }

        const [major, minor] = version.split('.');
        const [prevMajor, prevMinor] = previousVersion.split('.');
        if (major === prevMajor && minor === prevMinor) return;
        // Don't notify on downgrades
        if (major < prevMajor || (major === prevMajor && minor < prevMinor)) return;

        await context.globalState.update("version", version);
        await Messages.showUpdateMessage(version);
    }
}