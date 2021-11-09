import * as vscode from 'vscode';
import * as path from 'path';

import { RenderError, IRender } from '../renders/interfaces';
import { Diagram } from '../diagram/diagram';
import { config } from '../config';
import { localize } from '../common';
import { mkdirsSync, parseError, calculateExportPath } from '../tools';
import { appliedRender } from './appliedRender'
import { exportDiagram } from './exportDiagram';

/**
 *  export diagram to file.
 * @param diagrams The diagrams array to export.
 * @param format format of export file.
 * @param bar if bar is given, exporting diagram name shown.
 * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
 */
export function exportDiagrams(diagrams: Diagram[], format: string, bar: vscode.StatusBarItem): Promise<Buffer[][]> {
    if (!diagrams || !diagrams.length) {
        return Promise.resolve([]);
    }
    if (appliedRender(diagrams[0].parentUri).limitConcurrency()) {
        let concurrency = config.exportConcurrency(diagrams[0].parentUri);
        return doExportsLimited(diagrams, format, concurrency, bar);
    } else {
        return doExportsUnLimited(diagrams, format, bar);
    }
}

/**
 * export diagrams to file.
 * @param diagrams The diagrams array to export.
 * @param format format of export file.
 * @param bar if bar is given, exporting diagram name shown.
 * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
 */
function doExportsUnLimited(diagrams: Diagram[], format: string, bar: vscode.StatusBarItem): Promise<Buffer[][]> {
    let errors: RenderError[] = [];
    let promises: Promise<Buffer[]>[] = diagrams.map((diagram: Diagram, index: number) => {
        if (!path.isAbsolute(diagram.dir)) return Promise.reject(localize(1, null));
        let savePath = calculateExportPath(diagram, format.split(":")[0]);
        mkdirsSync(path.dirname(savePath));
        return exportDiagram(diagram, format, savePath, bar).promise.then(
            r => r,
            err => {
                errors.push(...parseError(err))
                return [];
            }
        );
    })
    return new Promise((resolve, reject) => {
        Promise.all(promises).then(
            r => {
                if (errors.length) reject(errors); else resolve(r)
            },
            e => {
                errors.push(...parseError(e));
                reject(errors);
            }
        );
    });
}
/**
 * export diagrams to file.
 * @param diagrams The diagrams array to export.
 * @param format format of export file.
 * @param concurrency concurrentcy count only applied when base exporter cliams to limit concurrentcy.
 * @param bar if bar is given, exporting diagram name shown.
 * @returns Promise<Buffer[][]>. A promise of Buffer[digrams][pages] array
 */
function doExportsLimited(diagrams: Diagram[], format: string, concurrency: number, bar: vscode.StatusBarItem): Promise<Buffer[][]> {
    concurrency = concurrency > 0 ? concurrency : 1
    concurrency = concurrency > diagrams.length ? diagrams.length : concurrency;
    let promises: Promise<Buffer[]>[] = [];
    let errors: RenderError[] = [];
    for (let i = 0; i < concurrency; i++) {
        //each i starts a task chain, which export indexes like 0,3,6,9... (task 1, concurrency 3 for example.)
        promises.push(
            diagrams.reduce((prev: Promise<Buffer[]>, diagram: Diagram, index: number) => {
                if (index % concurrency != i) {
                    // ignore indexes belongs to other task chain
                    return prev;
                }
                if (!path.isAbsolute(diagram.dir)) return Promise.reject(localize(1, null));

                let savePath = calculateExportPath(diagram, format.split(":")[0]);
                mkdirsSync(path.dirname(savePath));
                return prev.then(
                    () => {
                        return exportDiagram(diagram, format, savePath, bar).promise;
                    },
                    err => {
                        errors.push(...parseError(err));
                        // return Promise.reject(err);
                        //continue next diagram
                        return exportDiagram(diagram, format, savePath, bar).promise;
                    });
            }, Promise.resolve(<Buffer[]>[])).then(
                //to push last error of a chain
                r => {
                    return r;
                },
                err => {
                    errors.push(...parseError(err));
                    return [];
                })
        );
    }
    let all = Promise.all(promises);
    return new Promise((resolve, reject) => {
        all.then(
            r => {
                if (errors.length) reject(errors); else resolve(r)
            }
        );
    });
}