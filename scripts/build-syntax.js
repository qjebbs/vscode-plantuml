const fs = require('fs');
const yaml = require('js-yaml'); 
const plist  = require('plist');

const inputYamlTMLanguageFile = "./syntaxes/plantuml.yaml-tmLanguage";
const outputTMLanguageFile =  "./syntaxes/plantuml.tmLanguage";

const yamlTMLanguageText = fs.readFileSync(inputYamlTMLanguageFile, "utf8");
const data = yaml.safeLoad(yamlTMLanguageText);

const tmLanguageText = plist.build(data);
fs.writeFileSync(outputTMLanguageFile, tmLanguageText, "utf8");