import * as vscode from 'vscode';

import { RenderError } from '../renders/interfaces';
import { config } from '../config';
import { localize } from '../common';
import { parseError } from '../tools';
import { appliedRender } from './appliedRender';
import { exportFile, FileAndFormat } from './exportURI';
export interface exportFilesResult {
    /**
     * Buffer[uris][digrams][pages] array
     */
    results: Buffer[][][];
    errors: RenderError[];
}

/**
 * export diagrams of multiple vscode.Uris to file
 * @param files the uris to export.
 * @param format format of export file.
 * @param bar display prcessing message in bar if it's given.
 * @returns Promise<Buffer[][]>. A promise of exportURIsResult
 */
export async function exportFiles(files: FileAndFormat[], bar?: vscode.StatusBarItem): Promise<exportFilesResult> {
    if (!files || !files.length) return Promise.resolve(<exportFilesResult>{
        results:[],
        errors:[]
    })
    if (appliedRender(files[0].uri).limitConcurrency()) {
        let concurrency = config.exportConcurrency(files[0].uri);
        return exportFilesLimited(files, concurrency, bar);
    } else {
        return exportFilesUnLimited(files, bar);
    }
}

async function exportFilesLimited(files: FileAndFormat[], concurrency: number, bar?: vscode.StatusBarItem): Promise<exportFilesResult> {
    if (!files.length) {
        vscode.window.showInformationMessage(localize(8, null));
        return;
    }
    let errors: RenderError[] = [];
    let results: Buffer[][][] = [];
    let promiseChain = files.reduce((prev: Promise<Buffer[][]>, file: FileAndFormat, index: number) => {
        return prev.then(
            result => {
                if (result && result.length)
                    results.push(result);
                return exportFile(file, bar);
            },
            errs => {
                errors.push(...parseError(localize(11, null, errs.length, files[index - 1].uri.fsPath)))
                errors.push(...parseError(errs));
                // continue next file
                return exportFile(file, bar);
            });
    }, Promise.resolve([]));

    return new Promise<exportFilesResult>((resolve, reject) => {
        promiseChain.then(
            result => {
                if (result && result.length)
                    results.push(result);
                resolve(<exportFilesResult>{ results: results, errors: errors });
            },
            errs => {
                errors.push(...parseError(localize(11, null, errs.length, files[files.length - 1].uri.fsPath)));
                errors.push(...parseError(errs));
                resolve(<exportFilesResult>{ results: results, errors: errors });
            }
        );
    });
}

async function exportFilesUnLimited(files: FileAndFormat[], bar?: vscode.StatusBarItem): Promise<exportFilesResult> {
    if (!files.length) {
        vscode.window.showInformationMessage(localize(8, null));
        return;
    }
    let errors: RenderError[] = [];
    let results: Buffer[][][] = [];
    let promises = files.map((file, index) => exportFile(file, bar).then(
        result => {
            if (result && result.length)
                results.push(result);
        },
        errs => {
            errors.push(...parseError(localize(11, null, errs.length, files[index].uri.fsPath)));
            errors.push(...parseError(errs));
        }
    ));
    return new Promise<exportFilesResult>(
        (resolve, reject) => {
            Promise.all(promises).then(
                () => resolve(<exportFilesResult>{ results: results, errors: errors }),
                () => resolve(<exportFilesResult>{ results: results, errors: errors })
            );
        }
    );
}
