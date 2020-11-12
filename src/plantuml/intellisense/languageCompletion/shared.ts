import * as vscode from 'vscode';

export const REG_CLEAN_LABEL = /[^0-9a-z_]/ig;
export interface LanguageWord {
    label: string,
    kind: vscode.CompletionItemKind,
    name: string,
}
