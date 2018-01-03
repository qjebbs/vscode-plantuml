import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { localize, languageid, javaInstalled, java, bar } from '../common';
import { config } from '../config';
import { processWrapper } from '../tools';

export async function extractSource() {

    if (!await javaInstalled()) {
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
                '-Djava.awt.headless=true',
                '-jar',
                config.jar,
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
                    let process = child_process.spawn(java, params);

                    let pms = processWrapper(process).then(
                        result => new Promise<Buffer>((resolve, reject) => {
                            let stdout = result[0].toString();
                            let stderr = result[1].toString();
                            if (stderr.length) {
                                sources.push(stderr);
                            } else {
                                sources.push(stdout);
                            };
                            resolve(null)
                        })
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
    return new Promise<string[]>(
        (resolve, reject) => {
            pms.then(
                () => {
                    resolve(sources);
                }
            )
        }
    )
}