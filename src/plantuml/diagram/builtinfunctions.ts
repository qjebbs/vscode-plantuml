// PlantUML Builtin functions
// https://plantuml.com/de/preprocessing#291cabbe982ff775

import * as vscode from 'vscode';

// 001: How to enable extension to use 'ts-expression-evaluator'
// import evaluate, { registerFunction } from 'ts-expression-evaluator'

export class BuiltinFunctionsPreprocessor {
    private _builtinFunctionRegularExpression = /%([a-z_]+)\(([^\)]+)?\)/ig;
    private _quotesRegularExpression = /"/ig;

    private _filename: string = undefined;
    private _pathname: string = undefined;
    private _buildinfunction: string = undefined;
    private _functionname: string = undefined;
    private _functionarguments: string = undefined;

    constructor(fullQualifiedFilename: string) {
        let i = fullQualifiedFilename.lastIndexOf("\\");
        this._filename = fullQualifiedFilename.substr(i + 1);
        this._pathname = fullQualifiedFilename.substr(0, i + 1);
    }

    public ProcessBuiltinFunctions(titleRaw: string): string {
        let workstring = titleRaw;

        workstring = workstring.replace(this._builtinFunctionRegularExpression, (...args) => {
            let result = args[0];
            this._buildinfunction = args[0];
            this._functionname = args[1];
            this._functionarguments = this.stripQuotes(args[2]);
            console.log(`pathname: ${this._pathname}, filename: ${this._filename}, titlestring: ${titleRaw}, buildinfunction: ${this._buildinfunction}, functionname: ${this._functionname}, functionarguments: ${this._functionarguments}`)
            switch (this._functionname) {
                // Process %darken("red", 20)
                case "darken":
                    result = this.processDarken();
                    break;
                // Process %date("yyyy.MM.dd' at 'HH:mm")
                case "date":
                    result = this.processDate();
                    break;
                // Process %dirpath()
                case "dirpath":
                    result = this.processDirpath();
                    break;
                // Process %feature("theme")
                case "feature":
                    result = this.processFeature();
                    break;
                // Process %false()
                case "false":
                    result = this.processFalse();
                    break;
                // Process %file_exists("c:/foo/dummy.txt")
                case "file_exists":
                    result = this.processFileExists();
                    break;
                // Process %filename()
                case "filename":
                    result = this.processFilename();
                    break;
                // Process %function_exists("$some_function")
                case "function_exists":
                    result = this.processFunctionExists();
                    break;
                // Process %get_variable_value("$my_variable")
                case "get_variable_value":
                    result = this.processGetVariableValue();
                    break;
                // Process %getenv("OS")
                case "getenv":
                    result = this.processGetenv();
                    break;
                // Process %intval("42")
                case "intval":
                    result = this.processIntval();
                    break;
                // Process %is_dark("#000000")
                case "is_dark":
                    result = this.processIsDark();
                    break;
                // Process %is_light("#000000")
                case "is_light":
                    result = this.processIsLight();
                    break;
                // Process %lighten("red", 20)
                case "lighten":
                    result = this.processLighten();
                    break;
                // Process %lower("Hello")
                case "lower":
                    result = this.processLower();
                    break;
                // Process %newline()
                case "newline":
                    result = this.processNewline();
                    break;
                // Process %not(2+2==4)
                case "not":
                    result = this.processNot();
                    break;
                // Process %reverse_color("#FF7700")
                case "reverse_color":
                    result = this.processReverseColor();
                    break;
                // Process %reverse_hsluv_color("#FF7700")
                case "reverse_hsluv_color":
                    result = this.processReverseHsluvColor();
                    break;
                // Process %set_variable_value("$my_variable", "some_value")
                case "set_variable_value":
                    result = this.processSetVariableValue();
                    break;
                // Process %string(1 + 2)
                case "string":
                    result = this.processString();
                    break;
                // Process %strlen("foo")
                case "strlen":
                    result = this.processStrlen();
                    break;
                // Process %strpos("abcdef", "ef")
                case "strpos":
                    result = this.processStrpos();
                    break;
                // Process %substr("abcdef", 3, 2)
                case "substr":
                    result = this.processSubstr();
                    break;
                // Process %true()
                case "true":
                    result = this.processTrue();
                    break;
                // Process %upper("Hello")
                case "upper":
                    result = this.processUpper();
                    break;
                // Process %variable_exists("$my_variable")
                case "variable_exists":
                    result = this.processVariableExists();
                    break;
                // Process %version()
                case "version":
                    result = this.processVersion();
                    break;
                // ...
                default:
                    break;
            }
            return result;
        });

        return workstring;
    }

    private splitString(stringToSplit: string): string[] {
        let parts = stringToSplit.split(",");
        return parts;
    }

    private stripQuotes(stringwithquotes: string): string {
        return stringwithquotes.replace(this._quotesRegularExpression, "");
    }

    private processDarken(): string {
        return "darken";
    }

    private processDate(): string {
        let tmplocale = vscode.env.language;
        let today = new Date().toLocaleDateString(tmplocale);
        return today;
    }

    private processDirpath(): string {
        return this._pathname;
    }

    private processFeature(): string {
        return "feature";
    }

    private processFalse(): string {
        return "false";
    }

    private processFileExists(): string {
        return "file_exists";
    }

    private processFilename(): string {
        let result = this._filename;
        let parts = result.split(".");
        if (parts.length > 0) {
            result = parts[0];
        }
        return result;
    }

    private processFunctionExists(): string {
        return "function_exists";
    }

    private processGetVariableValue(): string {
        return "get_variable_value";
    }

    private processGetenv(): string {
        let result = "undefined";
        let env = process.env;

        if (env[this._functionarguments]) {
            result = env[this._functionarguments];
        }

        return result;
    }

    private processIntval(): string {
        return this._functionarguments;
    }

    private processIsDark(): string {
        return "is_dark";
    }

    private processIsLight(): string {
        return "is_light";
    }

    private processLighten(): string {
        return "lighten";
    }

    private processLower(): string {
        return this._functionarguments.toLowerCase();
    }

    private processNewline(): string {
        return "newline";
    }

    private processNot(): string {
        let result = "false";
        // 001: How to enable extension to use 'ts-expression-evaluator'
        // let check = evaluate(this._functionarguments);
        let check = eval(this._functionarguments);
        if (check === true) {
            result == "true";
        }
        return result;
    }

    private processReverseColor(): string {
        return "reverse_color";
    }

    private processReverseHsluvColor(): string {
        return "reverse_hsluv_color";
    }

    private processSetVariableValue(): string {
        return "set_variable_value";
    }

    private processString(): string {
        // 001: How to enable extension to use 'ts-expression-evaluator'
        // let result = evaluate(this._functionarguments);
        let result = eval(this._functionarguments);
        return String(result);
    }

    private processStrlen(): string {
        return String(this._functionarguments.length);
    }

    private processStrpos(): string {
        let parts = this.splitString(this._functionarguments);
        return String(parts[0].indexOf(parts[1]));
    }

    private processSubstr(): string {
        let result = undefined;
        let parts = this._functionarguments.split(",");
        switch (parts.length) {
            case 3:
                result = parts[0].substr(Number(parts[1]), Number(parts[2]));
                break;
            default:
                result = parts[0].substr(Number(parts[1]));
                break;
        }
        return result;
    }

    private processTrue(): string {
        return "true";
    }

    private processUpper(): string {
        return this._functionarguments.toUpperCase();
    }

    private processVariableExists(): string {
        return "variable_exists";
    }

    private processVersion(): string {
        return "version";
    }
}
