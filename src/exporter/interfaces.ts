import * as vscode from 'vscode';
import * as child_process from 'child_process';

import { Diagram, Diagrams } from '../diagram';

export interface ExportError {
    error: string;
    out: Buffer;
}

export interface ExportTask {
    processes: child_process.ChildProcess[];
    // A Promise of Buffer[], represents export file contents or export file paths
    promise: Promise<Buffer[]>;
    canceled: boolean;
}

export interface IExporter {
    exportURI(uri: vscode.Uri, format: string, bar?: vscode.StatusBarItem): Promise<Buffer[][]>;
    exportDiagrams(diagrams: Diagram[], format: string, bar?: vscode.StatusBarItem): Promise<Buffer[][]>;
    exportDiagram(diagram: Diagram, format: string, savePath: string, bar?: vscode.StatusBarItem): ExportTask;
    exportToBuffer(diagram: Diagram, format: string, bar?: vscode.StatusBarItem): ExportTask;
    formats(): string[];
}
export interface IBaseExporter {
    /**
     * export a diagram to file or to Buffer.
     * @param diagram The diagram to export.
     * @param format format of export file.
     * @param savePath if savePath is given, it exports to a file, or, to Buffer.
     * @returns ExportTask.
     */
    export(diagram: Diagram, format: string, savePath: string): ExportTask;
    /**
     * formats return an string array of formats that the exporter supports.
     */
    formats(): string[];
    /**
     * Indicates the exporter should limt concurrency or not.
     */
    limtConcurrency(): boolean;
}