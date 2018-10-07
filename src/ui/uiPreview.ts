import * as path from 'path';
import { UI } from "./ui";
import { localize, extensionPath } from "../plantuml/common";

export var uiPreview: UI = new UI(
    "plantuml.preview",
    localize(17, null),
    path.join(extensionPath, "templates/preview.html"),
);