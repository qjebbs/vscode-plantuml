import { Command } from './common';
import { config } from '../plantuml/config';

export class CommandToggleWorkspaceTrust extends Command {
    async execute() {
        await config.toggleWorkspaceIsTrusted();
    }
    constructor() {
        super("plantuml.toggleWorkspaceTrusted");
    }
}