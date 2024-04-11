import * as vscode from 'vscode';

import { RenderTask, } from '../renders/interfaces';
import { Diagram } from '../diagram/diagram';
import { localize } from '../common';
import { appliedRender } from './appliedRender'
import { ChildProcess } from 'child_process';
import * as path from 'path';
import { config } from '../config';

/**
 * export a diagram to file or to Buffer.
 * @param diagram The diagram to export.
 * @param format format of export file.
 * @param savePath if savePath is given, it exports to a file, or, to Buffer.
 * @param bar display prcessing message in bar if it's given.
 * @returns ExportTask.
 */
export function exportDiagram(diagram: Diagram, format: string, savePath: string, bar: vscode.StatusBarItem): RenderTask {
    if (bar) {
        bar.show();
        bar.text = localize(7, null, diagram.name + "." + format.split(":")[0]);
    }
    let renderTask = appliedRender(diagram.parentUri).render(diagram, format, savePath);
    if (!savePath) {
        // when exporting to buffer include map to make links clickable
        let mapTask = appliedRender(diagram.parentUri).getMapData(diagram, savePath);
        // https://github.com/qjebbs/vscode-plantuml/issues/579
        mapTask.promise = mapTask.promise.catch(e => {
            return Promise.resolve([]);
        })
        return combine(renderTask, mapTask);
    }

    if (!config.exportMapFile(diagram.parentUri)) return renderTask;

    let bsName = path.basename(savePath);
    let ext = path.extname(savePath);
    let cmapx = path.join(
        path.dirname(savePath),
        bsName.substr(0, bsName.length - ext.length) + ".cmapx",
    );
    let mapTask = appliedRender(diagram.parentUri).getMapData(diagram, cmapx);
    return combine(renderTask, mapTask);
}

function combine(taskA: RenderTask, taskB: RenderTask): RenderTask {
    let processes: ChildProcess[] = [];
    processes.push(...taskA.processes, ...taskB.processes);
    let pms = new Promise((resolve, reject) => {
        Promise.all([taskA.promise, taskB.promise]).then(
            results => {
                let buffs: Buffer[] = [];
                buffs = buffs.concat(...results);
                resolve(buffs);
            },
            error => {
                reject(error);
            }
        )
    });
    return <RenderTask>{
        processes: processes,
        promise: pms,
        canceled: false
    }
}