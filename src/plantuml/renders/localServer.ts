import { outputPanel } from '../common';
import * as vscode from 'vscode';
import { IRender, RenderTask } from './interfaces'
import { Diagram } from '../diagram/diagram';
import { config } from '../config';
import { localize } from '../common';
import { addFileIndex } from '../tools';
import { httpWrapper } from './httpWrapper';
import { HTTPError } from './httpErrors';
import internal = require('assert');
import * as child_process from 'child_process';
import { Task } from 'vscode';

interface Dictionary<T> {
    [key: string]: T;
}

class LocalServer implements IRender {

    /**
     * Indicates the exporter should limt concurrency or not.
     * @returns boolean
     */
    limitConcurrency(): boolean {
        return false;
    }
    /**
     * formats return an string array of formats that the exporter supports.
     * @returns an array of supported formats
     */
    formats(): string[] {
        return [
            "png",
            "svg",
            "txt"
        ];
    }

    async ensureLocalServerIsStarted(diagram : Diagram): Promise<string> {
        if (this.process && this.process.exitCode == null) {
            return this.localServer;
        }

        if (this.process) {
            this.process.kill();
            this.process = null;
        }

        let params = [
            '-jar', config.jar(diagram.parentUri),
            '-picoweb:' + this.port.toString() + ':127.0.0.1',
            '-verbose'
        ]
        
        let p = child_process.spawn(config.java(diagram.parentUri), params);
        p.stdout.on('data', function (data) {
            outputPanel.appendLine(data.toString());
        })
        p.stderr.on('data', function (data) {
            outputPanel.appendLine(data.toString());
        })

        this.process = p;

        this.localServer = "http://localhost:" + this.port.toString();
        outputPanel.appendLine(`PlantUML picoweb server started: params=${params.join(" ")}, pid=${p.pid}, url=${this.localServer}`)
        ++this.port;

        // wait for server to come online
        for (let i=0; i<10;++i) {
            let diagram = new Diagram("A --> B")
            try
            {
                let buffer = await httpWrapper("GET", this.localServer, diagram, "png", 0, null);
                break;
            }
            catch {
            }
            await new Promise( resolve => setTimeout(resolve, 500) );
        }

        return this.localServer;
    }

    port : number = 47323;
    localServer : string;
    process : any;

    /**
     * export a diagram to file or to Buffer.
     * @param diagram The diagram to export.
     * @param format format of export file.
     * @param savePath if savePath is given, it exports to a file, or, to Buffer.
     * @returns ExportTask.
     */
    render(diagram: Diagram, format: string, savePath: string): RenderTask {
        return <RenderTask>{
            processes: [],
            promise: this.doRender(diagram, format, savePath),
        }
    }

    async doRender(diagram: Diagram, format: string, savePath: string) : Promise<Buffer[]> {        
        let server = await this.ensureLocalServerIsStarted(diagram);

        if (!server) {
            throw localize(53, null)
        }

        let promiseArray = [...Array(diagram.pageCount).keys()].map(
            (index) => {
                let savePath2 = savePath ? addFileIndex(savePath, index, diagram.pageCount) : "";
                return httpWrapper("GET", server, diagram, format, index, savePath2);
            },
            Promise.resolve(Buffer.alloc(0))
        );

        return await Promise.all(promiseArray);
    }

    getMapData(diagram: Diagram, savePath: string): RenderTask {
        return this.render(diagram, "map", savePath);
    }
}
export const localServer = new LocalServer();