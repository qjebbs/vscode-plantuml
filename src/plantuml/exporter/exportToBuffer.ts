import * as vscode from 'vscode';

import { RenderTask, } from '../renders/interfaces';
import { Diagram } from '../diagram/diagram';
import { exportDiagram } from './exportDiagram';

/**
 * export diagram to buffer
 * @param diagram the diagram to export.
 * @param format format of export file.
 * @param bar display prcessing message in bar if it's given.
 * @returns ExportTask.
 */
export function exportToBuffer(diagram: Diagram, format: string, bar?: vscode.StatusBarItem): RenderTask {
    return exportDiagram(diagram, format, "", bar);
}