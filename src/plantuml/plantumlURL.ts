
import * as zlib from 'zlib';
import { Diagram } from './diagram/diagram';

/**
* make url for a diagram
* @param server plantuml server
* @param diagram diagram to make the URL for
* @param format render format
* @return string of URL
*/
export function makePlantumlURL(server: string, diagram: Diagram, format: string, index: number): string {
    let components = [server.replace(/^\/|\/$/g, ""), format];
    // Omit index in URL if possible
    // Partially compatible with kroki server (#302)
    if (index !== 0) {
        components.push(index.toString());
    }
    components.push(getDiagramURIComponent(diagram.contentWithInclude));
    return components.join("/");
}

export function getDiagramURIComponent(s: string): string {
    let opt: zlib.ZlibOptions = { level: 9 };
    let d = zlib.deflateRawSync(Buffer.from(s), opt) as Buffer;
    let b = encode64(String.fromCharCode(...d.subarray(0)));
    return b;
}

// from synchro.js
/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0.1
 * LastModified: Dec 25 1999
 */
function encode64(data) {
    let r = "";
    for (let i = 0; i < data.length; i += 3) {
        if (i + 2 == data.length) {
            r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
        } else if (i + 1 == data.length) {
            r += append3bytes(data.charCodeAt(i), 0, 0);
        } else {
            r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
        }
    }
    return r;
}

function append3bytes(b1, b2, b3) {
    let c1 = b1 >> 2;
    let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    let c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
    let c4 = b3 & 0x3F;
    let r = "";
    r += encode6bit(c1 & 0x3F);
    r += encode6bit(c2 & 0x3F);
    r += encode6bit(c3 & 0x3F);
    r += encode6bit(c4 & 0x3F);
    return r;
}
function encode6bit(b) {
    if (b < 10) {
        return String.fromCharCode(48 + b);
    }
    b -= 10;
    if (b < 26) {
        return String.fromCharCode(65 + b);
    }
    b -= 26;
    if (b < 26) {
        return String.fromCharCode(97 + b);
    }
    b -= 26;
    if (b == 0) {
        return '-';
    }
    if (b == 1) {
        return '_';
    }
    return '?';
}