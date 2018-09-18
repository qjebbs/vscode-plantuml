import * as assert from 'assert';
import * as vscode from 'vscode';

import { getDocUri, activate } from './helper';

suite("Macros Tests", () => {
    const docUri = getDocUri('macros.puml');

    test("Completes macros in puml file", async () => {
        await testCompletion(docUri, new vscode.Position(11, 1), [
            { label: 'params_defaults_macro', detail: "params_defaults_macro(p1, color=\"#F58536\")", kind: vscode.CompletionItemKind.Method },
            { label: 'params_macro', detail: "params_macro(p1, p2)", kind: vscode.CompletionItemKind.Method },
            { label: 'params_overload_macro', detail: "params_overload_macro(p1, p2) (+1 overload)", kind: vscode.CompletionItemKind.Method },
            { label: 'simple_macro', detail: "simple_macro", kind: vscode.CompletionItemKind.Method }
        ], vscode.CompletionItemKind.Method);
    });

    test("Provide macro signature help at ( in puml file", async () => {
        await testSignatureHelp(docUri, new vscode.Position(12, 23), {
            activeSignature: 0,
            activeParameter: 0,
            signatures: [
                {
                    label: "params_overload_macro(p1, p2)",
                    parameters: [
                        { label: "p1" },
                        { label: "p2" },
                    ]
                },
                {
                    label: "params_overload_macro(p1, p2, color=\"#F58536\")",
                    parameters: [
                        { label: "p1" },
                        { label: "p2" },
                        { label: "color=\"#F58536\"" },
                    ]
                }
            ]
        });
    });

    test("Provide macro signature help in the middle in puml file", async () => {
        await testSignatureHelp(docUri, new vscode.Position(13, 37), {
            activeSignature: 1,
            activeParameter: 2,
            signatures: [
                {
                    label: "params_overload_macro(p1, p2)",
                    parameters: [
                        { label: "p1" },
                        { label: "p2" },
                    ]
                },
                {
                    label: "params_overload_macro(p1, p2, color=\"#F58536\")",
                    parameters: [
                        { label: "p1" },
                        { label: "p2" },
                        { label: "color=\"#F58536\"" },
                    ]
                }
            ]
        });
    });
});

async function testCompletion(docUri: vscode.Uri, position: vscode.Position, expectedCompletionItems: vscode.CompletionItem[], kindFilter: vscode.CompletionItemKind = null) {
    await activate(docUri);

    // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
    const actualCompletionList = (await vscode.commands.executeCommand(
        'vscode.executeCompletionItemProvider',
        docUri,
        position
    )) as vscode.CompletionList;

    const actualCompletionItems = actualCompletionList.items.filter(i => kindFilter == null || i.kind == kindFilter);

    assert.equal(actualCompletionItems.length, expectedCompletionItems.length, `Count of completion items: ${expectedCompletionItems.length} expected; ${actualCompletionItems.length} actual`);
    expectedCompletionItems.forEach((expectedItem, i) => {
        const actualItem = actualCompletionItems[i];
        assert.equal(actualItem.label, expectedItem.label);
        assert.equal(actualItem.detail, expectedItem.detail);
        assert.equal(actualItem.kind, expectedItem.kind);
    });
}

async function testSignatureHelp(docUri: vscode.Uri, position: vscode.Position, expectedSignatureHelp: vscode.SignatureHelp) {
    await activate(docUri);

    // Executing the command `vscode.executeSignatureHelpProvider` to simulate triggering signature help
    const actualSignatureHelp = (await vscode.commands.executeCommand(
        'vscode.executeSignatureHelpProvider',
        docUri,
        position
    )) as vscode.SignatureHelp;

    assert.equal(actualSignatureHelp.activeParameter, expectedSignatureHelp.activeParameter, "activeParameter");
    assert.equal(actualSignatureHelp.activeSignature, expectedSignatureHelp.activeSignature, "activeSignature");

    assert.equal(actualSignatureHelp.signatures.length, expectedSignatureHelp.signatures.length, `Count of signatures: ${expectedSignatureHelp.signatures.length} expected; ${actualSignatureHelp.signatures.length} actual`);
    expectedSignatureHelp.signatures.forEach((expectedSignature, i) => {
        const actualSignature = actualSignatureHelp.signatures[i];
        assert.equal(actualSignature.label, expectedSignature.label);

        assert.equal(actualSignature.parameters.length, expectedSignature.parameters.length, `Count of parameters for {expectedSignature.label}: ${expectedSignature.parameters.length} expected; ${actualSignature.parameters.length} actual`);
    });
}