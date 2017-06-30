import * as vscode from 'vscode';

import { RenderTask, } from '../renders/interfaces';
import { Diagram } from '../diagram/diagram';
import { localize } from '../common';
import { appliedRender } from './appliedRender'

/**
 * export a diagram to file or to Buffer.
 * @param diagram The diagram to export.
 * @param format format of export file.
 * @param savePath if savePath is given, it exports to a file, or, to Buffer.
 * @param bar display prcessing message in bar if it's given.
 * @returns ExportTask.
 */
export function exportDiagram(diagram: Diagram, format: string, savePath: string, bar: vscode.StatusBarItem): RenderTask {
    if (bar) {
        bar.show();
        bar.text = localize(7, null, diagram.title + "." + format.split(":")[0]);
    }
    return appliedRender().render(diagram, format, savePath);
}