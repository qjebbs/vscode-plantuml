// 'Messages' modified from:
// https://github.com/eamodio/vscode-gitlens/blob/master/src/messages.ts

import { commands, ExtensionContext, Uri, window } from 'vscode';
import { localize } from './common';

export type SuppressedKeys = 'suppressUpdateNotice';
export const SuppressedKeys = {
    UpdateNotice: 'suppressUpdateNotice' as SuppressedKeys
};

export class Messages {

    static context: ExtensionContext;

    static configure(context: ExtensionContext) {
        this.context = context;
    }

    static async showUpdateMessage(version: string): Promise<string | undefined> {
        const viewDocs = localize(22, null);
        const viewReleaseNotes = localize(23, null);
        const dontShowAgain = localize(24, null);
        const result = await Messages._showMessage('info', localize(25, null, version), SuppressedKeys.UpdateNotice, dontShowAgain, viewDocs, viewReleaseNotes);
        if (result === viewReleaseNotes) {
            commands.executeCommand("vscode.open", Uri.parse('https://marketplace.visualstudio.com/items/jebbs.plantuml/changelog'));
        } else if (result === viewDocs) {
            commands.executeCommand("vscode.open", Uri.parse('https://marketplace.visualstudio.com/items/jebbs.plantuml'));
        }
        return result;
    }

    static async showWelcomeMessage(): Promise<string | undefined> {
        const viewDocs = localize(22, null);
        const result = await window.showInformationMessage(localize(21, null), viewDocs);
        if (result === viewDocs) {
            commands.executeCommand("vscode.open", Uri.parse('https://marketplace.visualstudio.com/items/jebbs.plantuml'));
        }
        return result;
    }

    private static async _showMessage(type: 'info' | 'warn' | 'error', message: string, suppressionKey: SuppressedKeys, dontShowAgain: string | null, ...actions: any[]): Promise<string | undefined> {
        if (Messages.context.globalState.get(suppressionKey, false)) return undefined;

        if (dontShowAgain !== null) {
            actions.push(dontShowAgain);
        }

        let result: string | undefined = undefined;
        switch (type) {
            case 'info':
                result = await window.showInformationMessage(message, ...actions);
                break;

            case 'warn':
                result = await window.showWarningMessage(message, ...actions);
                break;

            case 'error':
                result = await window.showErrorMessage(message, ...actions);
                break;
        }

        if (dontShowAgain !== null || result === dontShowAgain) {
            await Messages.context.globalState.update(suppressionKey, true);
            return undefined;
        }

        return result;
    }
}

// code modified from:
// https://github.com/eamodio/vscode-gitlens
export async function notifyOnNewVersion(context: ExtensionContext, version: string) {
    Messages.configure(context);
    if (context.globalState.get(SuppressedKeys.UpdateNotice, false)) return;
    const previousVersion = context.globalState.get<string>("version");
    await context.globalState.update("version", version);
    
    if (previousVersion === undefined) {
        await Messages.showWelcomeMessage();
        return;
    }

    const [major, minor] = version.split('.');
    const [prevMajor, prevMinor] = previousVersion.split('.');
    if (major === prevMajor && minor === prevMinor) return;
    // Don't notify on downgrades
    if (major < prevMajor || (major === prevMajor && minor < prevMinor)) return;

    await Messages.showUpdateMessage(version);
}