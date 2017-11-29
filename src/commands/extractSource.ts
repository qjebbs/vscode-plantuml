import { Command } from './common';
import { extractSource } from '../plantuml/sourceExtracter/extractSource';

export class CommandExtractSource extends Command {
    execute() {
        extractSource();
    }
    constructor() {
        super("plantuml.extractSource");
    }
}