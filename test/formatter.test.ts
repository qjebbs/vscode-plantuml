//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { MatchPositions, UnmatchedText } from '../src/plantuml/formatter/matchPositions';
import { MultiRegExp2Match, MultiRegExp2 } from '../src/plantuml/formatter/multiRegExp2'

// Defines a Mocha test suite to group tests of similar kind together
suite("Formatter Tests", () => {

    // Defines a Mocha unit test
    test("Something 1", () => {
        assert.equal(-1, [1, 2, 3].indexOf(5));
        assert.equal(-1, [1, 2, 3].indexOf(0));
    });
    test("MatchPositions", () => {
        let str = "1abc 1223 efg 45666789=";
        let reg = /[a-z]+/ig;
        let pos = new MatchPositions(str);
        let match: RegExpMatchArray;
        while (match = reg.exec(str)) {
            pos.AddPosition(match.index, reg.lastIndex - 1);
        }
        let reg2 = /(\d)\1+/ig;
        for (let t of pos.GetUnmatchedTexts()) {
            while (match = reg2.exec(t.text)) {
                pos.AddPosition(match.index, reg2.lastIndex - 1, t.offset);
            }
        }
        let ts = "";
        for (let t of pos.GetUnmatchedTexts()) {
            ts += t.text;
        }
        assert.equal(ts, "1 13  45789=");
    });
    test("MultiRegExp2", () => {
        let str: string;
        let mreg: MultiRegExp2;
        let matches: MultiRegExp2Match[];

        // str = "a(a(a(a(a(a(a(a(a(a(";
        // mreg = new MultiRegExp2(/((?:a\(){2})(?:a[(])(\1)/ig);
        // while (matches = mreg.execForAllGroups(str, false)) {
        //     for (let m of matches) {
        //         console.log(m.match, m.start, m.end);
        //     }
        // }
        
        //TODO fix this parsing
        mreg = new MultiRegExp2(/(?:(b)a)?(b)/);
        console.log(mreg.regExp.source);
    });
});