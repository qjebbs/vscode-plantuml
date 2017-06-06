import * as vscode from 'vscode';
import { config } from './config';
import { outputPanel } from './planuml';
import { showError, parseError } from './tools';
import { formatRules } from './formatRules';
import * as fmt from './formatter/formatter';

class Formatter implements vscode.DocumentFormattingEditProvider {
    private _formatter: fmt.Formatter;
    constructor() {
        let inlineFmt = config.formatInLine;
        this._formatter = new fmt.Formatter(
            formatRules,
            {
                allowInlineFormat: inlineFmt,
                allowSplitLine: inlineFmt,
                newLineForBlockStart: false
            }
        );
    }
    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        try {
            return this._formatter.formate(document, options, token);
        } catch (error) {
            showError(outputPanel, parseError(error));
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