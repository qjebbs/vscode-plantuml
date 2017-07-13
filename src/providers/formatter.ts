import * as vscode from 'vscode';
import { config } from '../plantuml/config';
import { outputPanel } from '../plantuml/common';
import { showMessagePanel, parseError } from '../plantuml/tools';
import { formatRules } from '../plantuml/formatRules';
import * as fmt from '../plantuml/formatter/formatter';

class Formatter implements vscode.DocumentFormattingEditProvider {
    private _formatter: fmt.Formatter;
    constructor() {
        this._formatter = new fmt.Formatter(
            formatRules,
            {
                allowInlineFormat: true,
                allowSplitLine: true,
                newLineForBlockStart: false
            }
        );
    }
    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        try {
            return this._formatter.formate(document, options, token);
        } catch (error) {
            showMessagePanel(outputPanel, parseError(error));
        }
    }
    register(): vscode.Disposable[] {
        let ds: vscode.Disposable[] = [];
        let d = vscode.languages.registerDocumentFormattingEditProvider(
            <vscode.DocumentFilter>{ language: "diagram" },
            this
        );
        ds.push(d);
        return ds;
    }
}

export const formatter = new Formatter();