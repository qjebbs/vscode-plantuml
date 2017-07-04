import * as vscode from 'vscode';

import { RenderTask, RenderError } from '../renders/interfaces';
import { config } from '../config';
import { localize } from '../common';
import { parseError } from '../tools';
import { Diagram, Diagrams } from '../diagram/diagram';
import { appliedRender } from './appliedRender';
import { exportURI } from './exportURI';

export interface exportURIsResult {
    results: Buffer[][][];
    errors: RenderError[];
}

/**
 * export diagrams of multiple vscode.Uris to file
 * @param uri the uri to export.
 * @param format format of export file.
 * @param bar display prcessing message in bar if it's given.
 * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
 */
export async function exportURIs(uris: vscode.Uri[], format: string, bar?: vscode.StatusBarItem): Promise<exportURIsResult> {
    if (appliedRender().limitConcurrency()) {
        let concurrency = config.exportConcurrency;
        return exportURIsLimited(uris, format, concurrency, bar);
    } else {
        return exportURIsUnLimited(uris, format, bar);
    }
}

async function exportURIsLimited(uris: vscode.Uri[], format: string, concurrency: number, bar?: vscode.StatusBarItem): Promise<exportURIsResult> {
    if (!uris.length) {
        vscode.window.showInformationMessage(localize(8, null));
        return;
    }
    let errors: RenderError[] = [];
    let results: Buffer[][][] = [];
    let promiseChain = uris.reduce((prev: Promise<Buffer[][]>, uri: vscode.Uri, index: number) => {
        return prev.then(
            result => {
                if (result && result.length)
                    results.push(result);
                return exportURI(uri, format, bar);
            },
            errs => {
                errors.push(...parseError(localize(11, null, errs.length, uris[index - 1].fsPath)))
                errors.push(...parseError(errs));
                // continue next file
                return exportURI(uri, format, bar);
            });
    }, Promise.resolve([]));

    return new Promise<exportURIsResult>((resolve, reject) => {
        promiseChain.then(
            result => {
                if (result && result.length)
                    results.push(result);
                resolve(<exportURIsResult>{ results: results, errors: errors });
            },
            errs => {
                errors.push(...parseError(localize(11, null, errs.length, uris[uris.length - 1].fsPath)));
                errors.push(...parseError(errs));
                resolve(<exportURIsResult>{ results: results, errors: errors });
            }
        );
    });
}

async function exportURIsUnLimited(uris: vscode.Uri[], format: string, bar?: vscode.StatusBarItem): Promise<exportURIsResult> {
    if (!uris.length) {
        vscode.window.showInformationMessage(localize(8, null));
        return;
    }
    let errors: RenderError[] = [];
    let results: Buffer[][][] = [];
    let promises = uris.map((uri, index) => exportURI(uri, format, bar).then(
        result => {
            if (result && result.length)
                results.push(result);
        },
        errs => {
            errors.push(...parseError(localize(11, null, errs.length, uris[index].fsPath)));
            errors.push(...parseError(errs));
        }
    ));
    return new Promise<exportURIsResult>(
        (resolve, reject) => {
            Promise.all(promises).then(
                () => resolve(<exportURIsResult>{ results: results, errors: errors }),
                () => resolve(<exportURIsResult>{ results: results, errors: errors })
            );
        }
    );
}
