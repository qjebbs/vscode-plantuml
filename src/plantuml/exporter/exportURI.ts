import * as vscode from 'vscode';

import { RenderTask, } from '../renders/interfaces';
import { Diagram, Diagrams } from '../diagram/diagram';
import { exportDiagrams } from './exportDiagrams';

export interface FileAndFormat {
    uri: vscode.Uri;
    format: string;
}

/**
 * export diagrams of a vscode.Uri to file
 * @param file the uri and format to export.
 * @param bar display prcessing message in bar if it's given.
 * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
 */
export async function exportFile(file: FileAndFormat, bar?: vscode.StatusBarItem): Promise<Buffer[][]> {
    let doc = await vscode.workspace.openTextDocument(file.uri);
    let ds = new Diagrams().AddDocument(doc)
    if (!ds.diagrams.length) return Promise.resolve(<Buffer[][]>[]);
    return exportDiagrams(ds.diagrams, file.format, bar);
}
