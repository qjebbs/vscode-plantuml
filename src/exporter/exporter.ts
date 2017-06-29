import * as vscode from 'vscode';
import * as path from 'path';

import { ExportTask, ExportError, IExporter, IBaseExporter } from './interfaces';
import { baseExporter } from './baseExporter';
import { baseHttpExporter } from './baseHTTPExporter';
import { Diagram, Diagrams } from '../diagram';
import { config, RenderType } from '../config';
import { localize } from '../planuml';
import { mkdirsSync, parseError, calculateExportPath } from '../tools';

class Exporter implements IExporter {
    get appliedExporter(): IBaseExporter {
        switch (config.render) {
            case RenderType.Local:
                return baseExporter;
            case RenderType.PlantUMLServer:
                return baseHttpExporter;
            default:
                return baseExporter;
        }
    }
    async exportURI(uri: vscode.Uri, format: string, concurrency?: number, bar?: vscode.StatusBarItem): Promise<Buffer[][]> {
        let doc = await vscode.workspace.openTextDocument(uri);
        let ds = new Diagrams().AddDocument(doc)
        if (!ds.diagrams.length) return Promise.resolve(<Buffer[][]>[]);
        return this.doExports(ds.diagrams, format, concurrency, bar);
    }
    exportDiagrams(diagrams: Diagram[], format: string, concurrency: number, bar?: vscode.StatusBarItem): Promise<Buffer[][]> {
        return this.doExports(diagrams, format, concurrency, bar);
    }
    exportDiagram(diagram: Diagram, format: string, savePath: string, bar?: vscode.StatusBarItem): ExportTask {
        return this.doExport(diagram, format, savePath, bar);
    }
    exportToBuffer(diagram: Diagram, format: string, bar?: vscode.StatusBarItem): ExportTask {
        return this.doExport(diagram, format, "", bar);
    }
    private doExport(diagram: Diagram, format: string, savePath: string, bar: vscode.StatusBarItem): ExportTask {
        if (bar) {
            bar.show();
            bar.text = localize(7, null, diagram.title + "." + format.split(":")[0]);
        }
        return this.appliedExporter.export(diagram, format, savePath);
    }
    /**
     * export diagrams to file.
     * @param diagrams The diagrams array to export.
     * @param format format of export file.
     * @param dir if dir is given, it exports files to this dir which has same structure to files in workspace. Or, directly to workspace dir.
     * @returns A Promise of Buffer array.
     */
    private doExports(diagrams: Diagram[], format: string, concurrency: number, bar: vscode.StatusBarItem): Promise<Buffer[][]> {
        concurrency = concurrency > 0 ? concurrency : 1
        concurrency = concurrency > diagrams.length ? diagrams.length : concurrency;
        let promises: Promise<Buffer[]>[] = [];
        let errors: ExportError[] = [];
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
                            return this.doExport(diagram, format, savePath, bar).promise;
                        },
                        err => {
                            errors.push(...parseError(err));
                            // return Promise.reject(err);
                            //continue next diagram
                            return this.doExport(diagram, format, savePath, bar).promise;
                        });
                }, Promise.resolve(<Buffer[]>[])).then(
                    //to push last error of a chain
                    r => {
                        return r;
                    },
                    err => {
                        errors.push(...parseError(err));
                        return;
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
    formats(): string[] {
        return this.appliedExporter.formats();
    }
}

export const exporter = new Exporter();