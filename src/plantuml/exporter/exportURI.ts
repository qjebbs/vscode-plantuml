import * as vscode from 'vscode';

import { diagramsOf } from '../diagram/tools';
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
    let diagrams = diagramsOf(doc);
    if (!diagrams.length) return Promise.resolve(<Buffer[][]>[]);
    return exportDiagrams(diagrams, file.format, bar);
}
