import * as vscode from 'vscode';
import * as child_process from 'child_process';

import { Diagram } from '../diagram/diagram';

export interface RenderError {
    /**
     * error messages from stderr
     */
    error: string;
    /**
     * Image of error description
     */
    out: Buffer;
}

export interface RenderTask {
    /**
     * Processes spawned by the task. You may kill them before cancelling the task.
     */
    processes?: child_process.ChildProcess[];
    /**
     * A Promise of Buffer[], represents rendered digram pages or exported file paths
     */
    promise: Promise<Buffer[]>;
    /**
     * Indicates the task is canceled or not
     */
    canceled?: boolean;
}

export interface IRender {
    /**
     * export a diagram to file or to Buffer.
     * @param diagram The diagram to export.
     * @param format format of export file.
     * @param savePath if savePath is given, it exports to a file, or, to Buffer.
     * @returns ExportTask.
     */
    render(diagram: Diagram, format: string, savePath: string): RenderTask;
    getMapData(diagram: Diagram, savePath: string): RenderTask;
    /**
     * formats return an string array of formats that the exporter supports.
     * @returns an array of supported formats
     */
    formats(): string[];
    /**
     * Indicates the exporter should limt concurrency or not.
     * @returns boolean
     */
    limitConcurrency(): boolean;
}