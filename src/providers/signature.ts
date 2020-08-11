import * as vscode from 'vscode';
import { macrosOf, macroCallOf, MacroCallInfo, MacroDefinition } from '../plantuml/intellisense/macros'
import { languageid } from '../plantuml/common';

export class Signature extends vscode.Disposable implements vscode.SignatureHelpProvider {
    private _disposables: vscode.Disposable[] = [];

    constructor() {
        super(() => this.dispose());
        let sel: vscode.DocumentSelector = [
            { scheme: 'file', language: languageid },
            { scheme: 'untitled', language: languageid },
        ];
        this._disposables.push(
            vscode.languages.registerSignatureHelpProvider(sel, this, "(", ",")
        );
    }

    dispose() {
        this._disposables && this._disposables.length && this._disposables.map(d => d.dispose());
    }

    public provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
        : vscode.ProviderResult<vscode.SignatureHelp> {

        const line = document.lineAt(position.line);
        const macroCallInfo = macroCallOf(line, position.character);
        if (!macroCallInfo) {
            return null;
        }

        const macros = macrosOf(document, position);
        var macro = macros.firstOrDefault(m => m.name == macroCallInfo.macroName);
        if (!macro) {
            return null;
        }

        return this.createSignatureHelp(macroCallInfo, macro);
    }

    private createSignatureHelp(macroCallInfo: MacroCallInfo, macro: MacroDefinition): vscode.SignatureHelp {
        const signatureHelp = new vscode.SignatureHelp();

        macro.getSignatures().forEach(s => {
            const signatureInfo = new vscode.SignatureInformation(macro.getSignatureLabel(s));
            signatureInfo.parameters = s.map(p => new vscode.ParameterInformation(p));
            signatureHelp.signatures.push(signatureInfo);
        });

        const matchedSignatureIndex = signatureHelp.signatures.findIndex(s => s.parameters.length == macroCallInfo.availableParameters);
        signatureHelp.activeSignature = matchedSignatureIndex >= 0 ? matchedSignatureIndex : 0;
        signatureHelp.activeParameter = macroCallInfo.activeParameter;

        return signatureHelp;
    }
}
