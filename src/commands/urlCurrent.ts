import { Command } from './common';
import { makeDocumentURL } from '../plantuml/urlMaker/urlDocument';

export class CommandURLCurrent extends Command {
    execute() {
        makeDocumentURL(false);
    }
    constructor() {
        super("plantuml.URLCurrent");
    }
}