import { Command } from './common';
import { makeDocumentURL } from '../plantuml/urlMaker/urlDocument';

export class CommandURLCurrent extends Command {
    async execute() {
        await makeDocumentURL(false);
    }
    constructor() {
        super("plantuml.URLCurrent");
    }
}