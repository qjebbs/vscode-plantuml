import { Command } from './common';
import { exportDocument } from '../plantuml/exporter/exportDocument';

export class CommandExportDocument extends Command {
    async execute() {
        await exportDocument(true);
    }
    constructor() {
        super("plantuml.exportDocument");
    }
}