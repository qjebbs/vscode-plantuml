import { Command } from './common';
import { extractSource } from '../plantuml/sourceExtracter/extractSource';

export class CommandExtractSource extends Command {
    async execute() {
        await extractSource();
    }
    constructor() {
        super("plantuml.extractSource");
    }
}