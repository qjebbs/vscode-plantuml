const fs = require('fs');
const path = require('path');
const { createVSIX } = require('@vscode/vsce');

async function main() {
    const root = path.resolve(__dirname, '..');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const release = path.join(root, 'release');
    fs.mkdirSync(release, { recursive: true });
    // createVSIX runs vscode:prepublish and includes production dependencies.
    await createVSIX({
        cwd: root,
        packagePath: path.join(release, `${manifest.name}-${manifest.version}.vsix`),
        useYarn: false,
    });
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
