import * as vscode from 'vscode';
import { getLanguageWords } from './generating';
import { getPredefinedLanguageWords } from './predefined';

export var dicLanguageWords = new Set<string>([]);
let cachedItems: vscode.CompletionItem[] = undefined;

// pre-cache before user needs
LanguageCompletionItems();

export async function LanguageCompletionItems(): Promise<vscode.CompletionItem[]> {
    if (cachedItems !== undefined) {
        return Promise.resolve(cachedItems);
    }
    // clear dicLanguageWords
    dicLanguageWords = new Set<string>([]);
    let words = await getLanguageWords();
    for (let word of getPredefinedLanguageWords()) {
        let dup = words.find(w => (w.name == word.name && w.kind == word.kind));
        if (dup) continue;
        words.push(word);
    }

    cachedItems = words.map(word => {
        dicLanguageWords.add(word.name);
        let item = new vscode.CompletionItem(word.label, word.kind);
        item.insertText = new vscode.SnippetString(word.name);
        return item;
    });
    return cachedItems;
}
