import { commands, Disposable } from 'vscode';

export abstract class Command extends Disposable {

    private _disposable: Disposable;

    constructor(protected command: string) {
        super(() => this.dispose());
        this._disposable = commands.registerCommand(command, this.execute, this);
    }

    dispose() {
        this._disposable && this._disposable.dispose();
    }

    abstract execute(...args: any[]): any;

}

