// Update the LanguageReferenceGuide snippets file with the contents of https://github.com/coni2k/PlantUML.git

import * as fs from 'fs';
import * as child_process from 'child_process';
import * as glob from 'glob'

let sourceDir = "./out/snippets/coni2k/PlantUML"
if (!fs.existsSync(sourceDir)) {
    child_process.execSync(`git clone https://github.com/coni2k/PlantUML.git ${sourceDir}`)
}

let pumlFiles = glob.sync(`${sourceDir}/**/*.puml`)

const LanguageReferenceGuide = "LanguageReferenceGuide"
const prefixSep = ": "

let chapterNumberRe = new RegExp("\\d+[a-z]?\\s+", 'ig')

let snippets = pumlFiles.map(function(value: string, index: number, array: string[]) : any {
        let name =  value.substring(sourceDir.length+1).replace("/", prefixSep).replace(".puml", "").replace(chapterNumberRe, '')

        return {
            "prefix": name,
            "body": fs.readFileSync(value, "utf8"),
            "description": name
        }
    })
    .reduce(function(p, c) {
        p[c.prefix] = c
        return p
    }, {})

let json = JSON.stringify(snippets)

fs.writeFileSync(`./snippets/${LanguageReferenceGuide}.json`, json, {encoding:'utf8'})




