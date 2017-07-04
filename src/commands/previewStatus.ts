import { Command } from './common';
import { previewer } from '../providers/previewer';

export class CommandPreviewStatus extends Command {
    execute(...args: any[]) {
        previewer.setUIStatus(JSON.stringify(args[0]));
    }
    constructor() {
        super("plantuml.previewStatus");
    }
}