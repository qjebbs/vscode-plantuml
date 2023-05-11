import { IRender, RenderTask } from './interfaces'
import { Diagram } from '../diagram/diagram';
import { config } from '../config';
import { localize } from '../common';
import { addFileIndex } from '../tools';
import { httpWrapper } from './httpWrapper';
import { HTTPError } from './httpErrors';

interface Dictionary<T> {
    [key: string]: T;
}
let noPOSTServers: Dictionary<boolean> = {};
let POSTSupportiveServers: Dictionary<boolean> = {};

class PlantumlServer implements IRender {
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
            "txt",
            "pdf"
        ];
    }
    /**
     * export a diagram to file or to Buffer.
     * @param diagram The diagram to export.
     * @param format format of export file.
     * @param savePath if savePath is given, it exports to a file, or, to Buffer.
     * @returns ExportTask.
     */
    render(diagram: Diagram, format: string, savePath: string): RenderTask {
        let server = config.server(diagram.parentUri);
        if (!server) {
            return <RenderTask>{
                processes: [],
                promise: Promise.reject(localize(53, null)),
            };
        }
        let allPms = [...Array(diagram.pageCount).keys()].map(
            (index) => {
                let savePath2 = savePath ? addFileIndex(savePath, index, diagram.pageCount) : "";
                if (noPOSTServers[server]) {
                    // Servers like the official one doesn't support POST
                    return httpWrapper("GET", server, diagram, format, index, savePath2);
                } else {
                    return httpWrapper("POST", server, diagram, format, index, savePath2)
                        .then(buf => {
                            POSTSupportiveServers[server] = true
                            return buf
                        })
                        .catch(
                            err => {
                                if (err instanceof HTTPError && err.isResponeError && !POSTSupportiveServers[server]) {
                                    // do not retry POST again, if the server gave unexpected respone
                                    noPOSTServers[server] = true
                                    // fallback to GET
                                    return httpWrapper("GET", server, diagram, format, index, savePath2)
                                }
                                return Promise.reject(err)
                            }
                        )
                }
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
export const plantumlServer = new PlantumlServer();
