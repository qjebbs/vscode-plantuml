import * as vscode from 'vscode';
import { LanguageCompletionItems } from '../plantuml/intellisense/languageCompletion';
import { MacroCompletionItems } from '../plantuml/intellisense/macroCompletion';
import { diagramAt } from '../plantuml/diagram/tools';
import { VariableCompletionItems } from '../plantuml/intellisense/variableCompletion';
import { languageid } from '../plantuml/common';

export class Completion extends vscode.Disposable implements vscode.CompletionItemProvider {
    private _disposables: vscode.Disposable[] = [];

    constructor() {
        super(() => this.dispose());
        let sel: vscode.DocumentSelector = [
            { scheme: 'file', language: languageid },
            { scheme: 'untitled', language: languageid },
        ];
        this._disposables.push(
            vscode.languages.registerCompletionItemProvider(sel, this)
        );
    }

    dispose() {
        this._disposables && this._disposables.length && this._disposables.map(d => d.dispose());
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
        : Thenable<vscode.CompletionItem[]> {
        let diagram = diagramAt(document, position);
        return Promise.all([
            MacroCompletionItems(diagram, position, token),
            LanguageCompletionItems(),
            VariableCompletionItems(diagram, position, token),
        ]).then(
            results => [].concat(...results)
        )
    }

    resolveCompletionItem?(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
        // TODO: add item.documentation
        return null;
    }
}

