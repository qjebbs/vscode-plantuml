import * as vscode from 'vscode';
import * as child_process from 'child_process';

import { Diagram, Diagrams } from '../diagram';

export interface ExportError {
    /**
     * error messages from stderr
     */
    error: string;
    /**
     * Image of error description
     */
    out: Buffer;
}

export interface ExportTask {
    /**
     * Processes spawned by the task. You may kill them before cancelling the task.
     */
    processes: child_process.ChildProcess[];
    /**
     * A Promise of Buffer[], represents rendered digram pages or exported file paths
     */
    promise: Promise<Buffer[]>;
    /**
     * Indicates the task is canceled or not
     */
    canceled: boolean;
}

export interface IExporter {
    /**
     * export diagrams of a vscode.Uri to file
     * @param uri the uri to export.
     * @param format format of export file.
     * @param bar display prcessing message in bar if it's given.
     * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
     */
    exportURI(uri: vscode.Uri, format: string, bar?: vscode.StatusBarItem): Promise<Buffer[][]>;
    /**
     * export diagrams to file
     * @param diagrams the diagrams to export.
     * @param format format of export file.
     * @param bar display prcessing message in bar if it's given.
     * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
     */
    exportDiagrams(diagrams: Diagram[], format: string, bar?: vscode.StatusBarItem): Promise<Buffer[][]>;
    /**
     * export diagram to buffer
     * @param diagram the diagram to export.
     * @param format format of export file.
     * @param bar display prcessing message in bar if it's given.
     * @returns ExportTask.
     */
    exportToBuffer(diagram: Diagram, format: string, bar?: vscode.StatusBarItem): ExportTask;
    /**
     * formats return an string array of formats that the applied base exporter supports.
     * @returns an array of supported formats
     */
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
     * @returns an array of supported formats
     */
    formats(): string[];
    /**
     * Indicates the exporter should limt concurrency or not.
     * @returns boolean
     */
    limtConcurrency(): boolean;
}