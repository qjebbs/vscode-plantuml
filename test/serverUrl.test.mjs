import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveServerUrl } from '../src/plantuml/serverUrl.ts';

test('preserves literal URLs and normalizes whitespace and trailing slashes', () => {
    assert.equal(resolveServerUrl(' http://localhost:42683/plantuml/// ', {}), 'http://localhost:42683/plantuml');
    assert.equal(resolveServerUrl('', {}), '');
});

test('expands multiple and repeated environment variables', () => {
    assert.equal(resolveServerUrl('http://${env:HOST}:${env:PORT}/${env:HOST}', {
        HOST: 'localhost', PORT: '42683'
    }), 'http://localhost:42683/localhost');
});

test('reports missing variables and accepts explicitly empty values', () => {
    assert.throws(() => resolveServerUrl('${env:MISSING}', {}), /plantuml\.server.*MISSING/);
    assert.equal(resolveServerUrl('http://localhost/${env:EMPTY}', { EMPTY: '' }), 'http://localhost');
});

test('does not recursively expand environment values or other placeholder syntax', () => {
    assert.equal(resolveServerUrl('${env:PORT}', { PORT: '%SERVICE_JETTY_HTTP_PORT%' }), '%SERVICE_JETTY_HTTP_PORT%');
    assert.equal(resolveServerUrl('${env:PORT}', { PORT: '${env:OTHER}' }), '${env:OTHER}');
    assert.equal(resolveServerUrl('${workspaceFolder}', {}), '${workspaceFolder}');
});

test('reads the extension host process environment by default', () => {
    assert.equal(resolveServerUrl('${env:PATH}'), process.env.PATH.trim().replace(/\/+$/g, ''));
});
