import { ConfigReader } from "../configReader";

class HttpConfig extends ConfigReader {
    constructor() {
        super('http');
    }
    onChange() { }
    proxy(): string {
        return this.read<string>('proxy');
    }
}

export const httpConfig = new HttpConfig();