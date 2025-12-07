import { previewer } from "../providers/previewer";
import { Command } from "./common";

export class CommandShowSource extends Command {
    constructor() {
        super("plantuml.showSource");
    }

    async execute() {
        await previewer.showSource();
    }
}