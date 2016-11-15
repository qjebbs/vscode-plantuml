import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Diagram, Diagrams } from './diagram';

let isDebug = true;

export class Exporter {
    private plantUmlCommand: string = "D:\\Portable\\VSCode\\data\\plantuml.8049.jar";
    private javaCommand: string = "java";
    constructor(public config: vscode.WorkspaceConfiguration, public diagrams: Diagrams) {
    }
    private export(diagram: Diagram, format: string) {
        let params = [
            '-Duser.dir=' + diagram.dir,
            '-Djava.awt.headless=true',
            '-jar',
            this.plantUmlCommand,
            "-t" + format,
            '-pipe',
            '-charset',
            'utf-8'
        ];
        var process = child_process.spawn(this.javaCommand, params);
        if (diagram.content !== null) {
            process.stdin.write(diagram.content);
            process.stdin.end();
        }
        return new Promise((resolve, reject) => {
            let stderror = '';
            let exportDir = this.config.get("exportSubFolder") as boolean
            let dir = diagram.dir;
            if (exportDir) {
                dir = diagram.fileName.substr(0, diagram.fileName.lastIndexOf("."))
                if (!fs.existsSync(dir)) {
                    fs.mkdir(dir);
                }
            }
            let fname = path.join(dir, diagram.title + "." + format.split(":")[0])
            let f = fs.createWriteStream(fname);
            process.stdout.pipe(f);
            process.stdout.on('close', function () {
                if (!stderror) {
                    resolve("ok");
                } else {
                    reject(stderror);
                }
            })
            process.stderr.on('data', function (x) {
                stderror += x;
            });
        });
    }

    execute(bar?: vscode.StatusBarItem) {
        if (bar) bar.show();
        let format = this.config.get("exportFormat") as string;
        return this.diagrams.diagrams.reduce((prev: Promise<{}>, diagram: Diagram) => {
            return prev.then(
                () => {
                    if (bar) bar.text = "PlantUML Exporting: " + diagram.title + "." + format.split(":")[0];
                    return this.export(diagram, format);
                },
                err => {
                    return Promise.reject(err);
                });
        }, Promise.resolve(""));
    }
}