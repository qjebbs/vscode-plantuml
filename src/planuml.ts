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

export var outputPanel = vscode.window.createOutputChannel("PlantUML");
export var context: vscode.ExtensionContext;
export var localize: any;

export class PlantUML {
    constructor(ctx: vscode.ExtensionContext) {
        context = ctx;
        nls.config(<nls.Options>{ locale: vscode.env.language });
        localize = nls.loadMessageBundle(join(context.extensionPath, "langs", "lang.json"));
    }

    activate(): vscode.Disposable[] {
        try {
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
}