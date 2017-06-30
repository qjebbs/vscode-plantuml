import { Command } from './common';
import { exportDocument } from '../plantuml/exporter/exportDocument';

export class CommandExportCurrent extends Command {
    execute() {
        exportDocument(false);
    }
    constructor() {
        super("plantuml.exportCurrent");
    }
}