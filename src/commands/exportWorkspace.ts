import * as vscode from 'vscode';
import { Command } from './common';
import { exportWorkSpace } from '../plantuml/exporter/exportWorkSpace';

export class CommandExportWorkspace extends Command {
    async execute(target:vscode.Uri, all:vscode.Uri[]) {
        await exportWorkSpace(target,all);
    }
    constructor() {
        super("plantuml.exportWorkspace");
    }
}