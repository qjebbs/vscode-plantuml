import { Command } from './common';
import { exportWorkSpace } from '../plantuml/exporter/exportWorkSpace';

export class CommandExportWorkspace extends Command {
    async execute(uri) {
        await exportWorkSpace(uri);
    }
    constructor() {
        super("plantuml.exportWorkspace");
    }
}