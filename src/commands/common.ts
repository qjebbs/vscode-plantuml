import { commands, Disposable } from 'vscode';
import { showMessagePanel } from '../plantuml/tools';

export abstract class Command extends Disposable {

    private _disposable: Disposable;

    constructor(protected command: string) {
        super(() => this.dispose());
        this._disposable = commands.registerCommand(command, this.executeCatch, this);
    }

    dispose() {
        this._disposable && this._disposable.dispose();
    }

    executeCatch(...args: any[]): any {
        try {
            let pm = this.execute(...args);
            if (pm instanceof Promise) {
                pm.catch(error => showMessagePanel(error))
            }
        } catch (error) {
            showMessagePanel(error);
        }
    }

    abstract execute(...args: any[]): any;

}

