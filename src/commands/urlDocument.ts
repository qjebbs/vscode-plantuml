import { Command } from './common';
import { makeDocumentURL } from '../plantuml/urlMaker/urlDocument';

export class CommandURLDocument extends Command {
    execute() {
        makeDocumentURL(true);
    }
    constructor() {
        super("plantuml.URLDocument");
    }
}