/**
 * Created by velten on 11.02.17.
 * Fix parsing issues by jebbs
 */

/**
 * Adds brackets before and after a part of string
 * @param str string the hole regex string
 * @param start int marks the position where ( should be inserted
 * @param end int marks the position where ) should be inserted
 * @param groupsAdded int defines the offset to the original string because of inserted brackets
 * @return {string}
 */

function addGroupToRegexString(str, start, end, groupsAdded) {
    start += groupsAdded * 2;
    end += groupsAdded * 2;
    return str.substring(0, start) + '(' + str.substring(start, end + 1) + ')' + str.substring(end + 1);
}

/**
 * converts the given regex to a regex where all not captured string are going to be captured
 * it along sides generates a mapper which maps the original group index to the shifted group offset and
 * generates a list of groups indexes (including new generated capturing groups)
 * which have been closed before a given group index (unshifted)
 *
 * Example:
 * regexp: /a(?: )bc(def(ghi)xyz)/g => /(a(?: )bc)((def)(ghi)(xyz))/g
 * groupIndexMapper: {'1': 2, '2', 4}
 * previousGroupsForGroup: {'1': [1], '2': [1, 3]}
 *
 * @param regex RegExp
 * @return {{regexp: RegExp, groupIndexMapper: {}, previousGroupsForGroup: {}}}
 */
function fillGroups(regex) {
    let regexString: string;
    let modifier;
    if (regex.source && regex.flags) {
        regexString = regex.source;
        modifier = regex.flags;
    }
    else {
        regexString = regex.toString();
        modifier = regexString.substring(regexString.lastIndexOf(regexString[0]) + 1); // sometimes order matters ;)
        regexString = regexString.substr(1, regex.toString().lastIndexOf(regexString[0]) - 1);
    }
    // regexp is greedy so it should match (? before ( right?
    // brackets may be not quoted by \
    // closing bracket may look like: ), )+, )+?, ){1,}?, ){1,1111}?
    const tester = /(\(\?)|(\()|(\)(?:\{\d+,?\d*}|[*+?])?\??)/g;

    let modifiedRegex = regexString;

    let lastGroupStartPosition = -1;
    let lastGroupEndPosition = -1;
    let groupsAdded = 0;
    let groupCount = 0;
    let matchArr;
    const nonGroupPositions = [];
    const groupPositions = [];
    const groupNumber = [];
    const currentLengthIndexes = [];
    const groupIndexMapper = {};
    const previousGroupsForGroup = {};
    while ((matchArr = tester.exec(regexString)) !== null) {
        if (isEscaped(matchArr.index) || isInCharacterSets(matchArr.index)) continue;
        if (matchArr[1]) { // non capturing group
            let index = matchArr.index + matchArr[0].length - 1;
            nonGroupPositions.push(index);
        }
        else if (matchArr[2]) { // capturing group
            let index = matchArr.index + matchArr[0].length - 1;

            let lastGroupPosition = Math.max(lastGroupStartPosition, lastGroupEndPosition);

            if (lastGroupPosition < index - 1) {
                modifiedRegex = addGroupToRegexString(modifiedRegex, lastGroupPosition + 1, index - 1, groupsAdded);
                groupsAdded++;
                lastGroupEndPosition = index - 1; // imaginary position as it is not in regex but modifiedRegex
                currentLengthIndexes.push(groupCount + groupsAdded);
            }

            groupCount++;
            lastGroupStartPosition = index;
            groupPositions.push(index);
            groupNumber.push(groupCount + groupsAdded);
            groupIndexMapper[groupCount] = groupCount + groupsAdded;
            previousGroupsForGroup[groupCount] = currentLengthIndexes.slice();
        }
        else if (matchArr[3]) { // closing bracket
            let index = matchArr.index + matchArr[0].length - 1;

            if ((groupPositions.length && !nonGroupPositions.length) ||
                groupPositions[groupPositions.length - 1] > nonGroupPositions[nonGroupPositions.length - 1]
            ) {
                if (lastGroupStartPosition < lastGroupEndPosition && lastGroupEndPosition < index - 1) {
                    modifiedRegex = addGroupToRegexString(modifiedRegex, lastGroupEndPosition + 1, index - 1, groupsAdded);
                    groupsAdded++;
                    //lastGroupEndPosition = index - 1; will be set anyway
                    currentLengthIndexes.push(groupCount + groupsAdded);
                }

                groupPositions.pop();
                lastGroupEndPosition = index;
                currentLengthIndexes.push(groupNumber.pop());
            }
            else if (nonGroupPositions.length) {
                nonGroupPositions.pop();
            }
        }
        function isEscaped(position: number): boolean {
            let count = 0;
            for (let i = position - 1; i >= 0; i--) {
                if (regexString.substr(i, 1) != "\\") break;
                count++;
            }
            return count != 0 && count % 2 == 1;
        }
        function isInCharacterSets(position: number): boolean {
            for (let i = position - 1; i >= 0; i--) {
                if (regexString.substr(i, 1) == "]" && !isEscaped(i)) return false;
                if (regexString.substr(i, 1) == "[" && !isEscaped(i)) return true;
            }
            return false;
        }
    }

    return { regexp: new RegExp(modifiedRegex, modifier), groupIndexMapper, previousGroupsForGroup };
}
export interface MultiRegExMatch {
    match: string,
    start: number,
    end: number
}
export class MultiRegExp2 {
    private regexp: RegExp;
    private groupIndexMapper: any;
    private previousGroupsForGroup: any;
    constructor(baseRegExp: RegExp) {
        const { regexp, groupIndexMapper, previousGroupsForGroup } = fillGroups(baseRegExp);
        this.regexp = regexp;
        this.groupIndexMapper = groupIndexMapper;
        this.previousGroupsForGroup = previousGroupsForGroup;
    }
    public get regExp(): RegExp {
        return this.regexp;
    }
    execForAllGroups(string: string, includeFullMatch?: boolean): MultiRegExMatch[] {
        let matches = RegExp.prototype.exec.call(this.regexp, string);
        if (!matches) return matches;
        let firstIndex = matches.index;
        let indexMapper = includeFullMatch ? this.groupIndexMapper : Object.assign({ 0: 0 }, this.groupIndexMapper);
        let previousGroups = includeFullMatch ? this.previousGroupsForGroup : Object.assign({ 0: [] }, this.previousGroupsForGroup);

        return Object.keys(indexMapper).map((group) => {
            let mapped = indexMapper[group];
            let r = <MultiRegExMatch>{
                match: matches[mapped],
                start: firstIndex + previousGroups[group].reduce(
                    (sum, i) => sum + (matches[i] ? matches[i].length : 0), 0
                )
            };
            r.end = r.start + (matches[mapped] ? matches[mapped].length - 1 : 0);

            return r;
        });
    }

    execForGroup(string: string, group: number): MultiRegExMatch {
        const matches = RegExp.prototype.exec.call(this.regexp, string);
        if (!matches) return matches;
        const firstIndex = matches.index;

        const mapped = group == 0 ? 0 : this.groupIndexMapper[group];
        const previousGroups = group == 0 ? [] : this.previousGroupsForGroup[group];
        let r = <MultiRegExMatch>{
            match: matches[mapped],
            start: firstIndex + previousGroups.reduce(
                (sum, i) => sum + (matches[i] ? matches[i].length : 0), 0
            )
        };
        r.end = r.start + (matches[mapped] ? matches[mapped].length - 1 : 0);

        return r;
    }
}