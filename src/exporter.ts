import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Diagram, Diagrams } from './diagram';

let isDebug = true;

export class Exporter {
    private plantUmlCommand: string = "D:\\Portable\\VSCode\\data\\plantuml.8049.jar";
    private javaCommand: string = "java";

    constructor(public config: vscode.WorkspaceConfiguration) {
    }
    doExportCommand(all: boolean) {
        let editor = vscode.window.activeTextEditor;
        let outputDefaultPath = path.dirname(editor.document.uri.fsPath);
        let diagrams = new Diagrams();
        if (all) {
            diagrams.AddAll();
        } else {
            let dg = new Diagram().GetCurrent();
            diagrams.Add(new Diagram().GetCurrent());
            editor.selections = [new vscode.Selection(dg.start, dg.end)];
        }
        let bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        return this.export(diagrams, bar)
            .then(
            msgs => {
                vscode.window.showInformationMessage("Export finish.");
                bar.dispose();
            },
            msg => {
                let m = msg as string
                console.log(m);
                vscode.window.showErrorMessage(m.replace(/\n/g, " "));
                bar.dispose();
            }
            );
    }
    exportFile(diagram: Diagram, format: string, savePath?: string) {
        if (!savePath) {
            let subDir = this.config.get("exportSubFolder") as boolean;
            let dir = diagram.dir;
            if (subDir) {
                dir = diagram.fileName.substr(0, diagram.fileName.lastIndexOf("."))
                if (!fs.existsSync(dir)) {
                    fs.mkdir(dir);
                }
            }
            savePath = path.join(dir, diagram.title + "." + format.split(":")[0])
        }
        return this.doExport(diagram, format, savePath);
    }
    exportText(diagram: Diagram, format: string) {
        return this.doExport(diagram, format);
    }
    private doExport(diagram: Diagram, format: string, savePath?: string) {
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
            let stdout = '';
            let stderror = '';
            if (savePath) {
                let f = fs.createWriteStream(savePath);
                process.stdout.pipe(f);
            } else {
                process.stdout.on('data', function (x) {
                    stdout += x;
                });
            }
            process.stdout.on('close', function () {
                if (!stderror) {
                    resolve(stdout);
                } else {
                    reject(stderror);
                }
            })
            process.stderr.on('data', function (x) {
                stderror += x;
            });
        });
    }

    export(diagrams: Diagrams, bar?: vscode.StatusBarItem) {
        if (bar) bar.show();
        let format = this.config.get("exportFormat") as string;
        return diagrams.diagrams.reduce((prev: Promise<{}>, diagram: Diagram, index: number) => {
            return prev.then(
                () => {
                    if (bar) bar.text = "PlantUML exporting: " + diagram.title + "." + format.split(":")[0];
                    return this.exportFile(diagram, format);
                },
                err => {
                    return Promise.reject(err);
                });
        }, Promise.resolve(""));
    }

    register(): vscode.Disposable[] {
        //register export
        let ds: vscode.Disposable[] = [];
        let d = vscode.commands.registerCommand('plantuml.export', () => {
            try {
                this.doExportCommand(false);
            } catch (error) {
                vscode.window.showErrorMessage(error)
            }
        });
        ds.push(d);
        d = vscode.commands.registerCommand('plantuml.exportAll', () => {
            try {
                this.doExportCommand(true);
            } catch (error) {
                vscode.window.showErrorMessage(error)
            }
        });
        ds.push(d);
        return ds;
    }
}