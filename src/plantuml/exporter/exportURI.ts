import * as vscode from 'vscode';

import { RenderTask, } from '../renders/interfaces';
import { Diagram, Diagrams } from '../diagram/diagram';
import { exportDiagrams } from './exportDiagrams';

/**
 * export diagrams of a vscode.Uri to file
 * @param uri the uri to export.
 * @param format format of export file.
 * @param bar display prcessing message in bar if it's given.
 * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
 */
export async function exportURI(uri: vscode.Uri, format: string, bar?: vscode.StatusBarItem): Promise<Buffer[][]> {
    let doc = await vscode.workspace.openTextDocument(uri);
    let ds = new Diagrams().AddDocument(doc)
    if (!ds.diagrams.length) return Promise.resolve(<Buffer[][]>[]);
    return exportDiagrams(ds.diagrams, format, bar);
}
