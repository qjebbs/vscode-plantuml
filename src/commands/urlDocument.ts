import { Command } from './common';
import { makeDocumentURL } from '../plantuml/urlMaker/urlDocument';

export class CommandURLDocument extends Command {
    async execute() {
        await makeDocumentURL(true);
    }
    constructor() {
        super("plantuml.URLDocument");
    }
}