import * as vscode from 'vscode';

import { RenderTask, RenderError } from '../renders/interfaces';
import { config } from '../config';
import { localize, outputPanel } from '../common';
import { parseError, showMessagePanel } from '../tools';
import { Diagram, Diagrams } from '../diagram/diagram';
import { exportURI } from './exportURI';

/**
 * export diagrams of multiple vscode.Uris to file
 * @param uri the uri to export.
 * @param format format of export file.
 * @param bar display prcessing message in bar if it's given.
 * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
 */
export async function exportURIs(uris: vscode.Uri[], format: string, bar?: vscode.StatusBarItem): Promise<Buffer[][][]> {
    if (this.appliedExporter.limitConcurrency()) {
        let concurrency = config.exportConcurrency;
        return this.exportURIsLimited(uris, format, concurrency, bar);
    } else {
        return this.exportURIsUnLimited(uris, format, bar);
    }
}

async function exportURIsLimited(uris: vscode.Uri[], format: string, concurrency: number, bar?: vscode.StatusBarItem): Promise<Buffer[][][]> {
    if (!uris.length) {
        vscode.window.showInformationMessage(localize(8, null));
        return;
    }
    let errors: RenderError[] = [];
    let results: Buffer[][][] = [];
    let pms = uris.reduce((prev: Promise<Buffer[][]>, uri: vscode.Uri, index: number) => {
        return prev.then(
            result => {
                if (result && result.length)
                    results.push(result);
                return exportURI(uri, format, bar);
            },
            error => {
                errors.push(...parseError(localize(11, null, error.length, uris[index - 1].fsPath)))
                errors.push(...parseError(error));
                // continue next file
                return exportURI(uri, format, bar);
            });
    }, Promise.resolve([]));

    return new Promise<Buffer[][][]>((resolve, reject) => {
        pms.then(
            r => {
                resolve(results);
            },
            e => {
                reject(e);
            }
        );
    });
}

async function exportURIsUnLimited(uris: vscode.Uri[], format: string, bar?: vscode.StatusBarItem): Promise<Buffer[][][]> {
    if (!uris.length) {
        vscode.window.showInformationMessage(localize(8, null));
        return;
    }
    let errors: RenderError[] = [];
    let results: Buffer[][][] = [];
    let promises = uris.map(uri => exportURI(uri, format, bar));

    return Promise.all(promises);
}
