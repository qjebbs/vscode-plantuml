/** Resolve environment variables in the extension host's environment. */
export function resolveServerUrl(value: string, env: { [key: string]: string | undefined } = process.env): string {
    return value.replace(/\$\{env:([^}]+)\}/g, (match, name: string) => {
        const replacement = env[name];
        if (replacement === undefined) {
            throw new Error(`plantuml.server: environment variable "${name}" is not defined.`);
        }
        return replacement;
    }).trim().replace(/\/+$/g, "");
}
