import { IRender, RenderTask } from './interfaces'
import { Diagram } from '../diagram/diagram';
import { config } from '../config';
import { localize } from '../common';
import { addFileIndex } from '../tools';
import { httpWrapper } from './httpWrapper';
import { HTTPError } from './httpErrors';
import internal = require('assert');
import * as child_process from 'child_process';

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

    ensureLocalServerIsStarted(diagram : Diagram): string {
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
        
        this.process = child_process.spawn(config.java(diagram.parentUri), params);

        this.localServer = "http://localhost:" + this.port.toString();
        ++this.port;
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
        let server = this.ensureLocalServerIsStarted(diagram);
        if (!server) {
            return <RenderTask>{
                processes: [],
                promise: Promise.reject(localize(53, null)),
            };
        }
        let allPms = [...Array(diagram.pageCount).keys()].map(
            (index) => {
                let savePath2 = savePath ? addFileIndex(savePath, index, diagram.pageCount) : "";
                return httpWrapper("GET", server, diagram, format, index, savePath2);
            },
            Promise.resolve(Buffer.alloc(0))
        );
        return <RenderTask>{
            processes: [],
            promise: Promise.all(allPms),
        }
    }
    getMapData(diagram: Diagram, savePath: string): RenderTask {
        return this.render(diagram, "map", savePath);
    }
}
export const localServer = new LocalServer();