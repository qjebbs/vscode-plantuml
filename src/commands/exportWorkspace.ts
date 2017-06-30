import { Command } from './common';
import { exportWorkSpace } from '../plantuml/exporter/exportWorkSpace';

export class CommandExportWorkspace extends Command {
    execute(uri) {
        exportWorkSpace(uri);
    }
    constructor() {
        super("plantuml.exportWorkspace");
    }
}