
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { RenderError } from './interfaces';

export function processWrapper(process: child_process.ChildProcess, pipeFilePath?: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        let buffOut: Buffer[] = [];
        let buffOutLen = 0;
        let buffErr: Buffer[] = [];
        let buffErrLen = 0;

        // let pipeFile = pipeFilePath ? fs.createWriteStream(pipeFilePath) : null;
        // if (pipeFile) process.stdout.pipe(pipeFile);

        process.stdout.on('data', function (chunck: Buffer) {
            buffOut.push(chunck);
            buffOutLen += chunck.length;
        });

        process.stderr.on('data', function (chunck: Buffer) {
            buffErr.push(chunck);
            buffErrLen += chunck.length;
        });

        process.stdout.on('close', () => {
            let stdout = Buffer.concat(buffOut, buffOutLen);
            if (pipeFilePath && stdout.length) {
                fs.writeFileSync(pipeFilePath, stdout);
                stdout = Buffer.from(pipeFilePath);
            }
            let stderr = Buffer.concat(buffErr, buffErrLen).toString();

            // If environment variables such as JAVA_TOOL_OPTIONS or _JAVA_OPTIONS are set,
            // some java implementations will echo them on stderr.
            stderr = stderr.replace(/^Picked up .*$/mg, "").trim();

            if (stderr) {
                reject(<RenderError>{ error: stderr, out: stdout });
                return;
            }
            resolve(stdout);
        });
    });
}
