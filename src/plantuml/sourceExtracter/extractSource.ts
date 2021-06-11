import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { localize, languageid, bar } from '../common';
import { config } from '../config';
import { processWrapper } from '../renders/processWrapper';

export async function extractSource() {

    if (!config.java) {
        vscode.window.showErrorMessage(localize(5, null));
        return;
    }

    let imgs = await vscode.window.showOpenDialog(<vscode.OpenDialogOptions>{
        openLabel: localize(32, null),
        canSelectMany: true,
        filters: { 'Images': ['png'] },
    });
    if (!imgs || !imgs.length) return;

    let sources = await extract(imgs);
    vscode.workspace.openTextDocument({
        language: languageid,
        content: sources.reduce((srcs, src) => srcs + '\n' + src)
    }).then(doc => vscode.window.showTextDocument(doc));
    bar.hide();
}

function extract(imgs: vscode.Uri[]) {
    let sources: string[] = [];
    let pms = imgs.reduce(
        (pChain, img, index) => {

            if (!fs.existsSync(img.fsPath)) {
                sources.push("File not found: " + img.fsPath);
                return Promise.resolve(null);
            }

            let params = [
                ...config.commandArgs(null),
                '-Djava.awt.headless=true',
                '-jar',
                config.jar(null),
                ...config.jarArgs(null),
                "-metadata",
                img.fsPath,
            ];

            // processes.push(process); 
            return pChain.then(
                () => {
                    if (bar) {
                        bar.show();
                        bar.text = localize(33, null, index + 1, imgs.length, path.basename(img.fsPath));
                    }
                    let process = child_process.spawn(config.java(img), params);

                    let pms = processWrapper(process).then(
                        stdout => sources.push(stdout.toString()),
                        err => sources.push(err),
                    );
                    return pms;
                },
                err => {
                    console.log(err);
                }
            )
        },
        Promise.resolve(null)
    );
    return pms.then(
        () => sources
    );
}