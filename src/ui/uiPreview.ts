import * as path from 'path';
import { UI } from "./ui";
import { localize, extensionPath } from "../plantuml/common";
import { previewer } from "../providers/previewer";

export var uiPreview: UI = new UI(
    "plantuml.preview",
    localize(17, null),
    path.join(extensionPath, "templates/preview.html"),
);
uiPreview.addEventListener("message", e => previewer.setUIStatus(JSON.stringify(e.message)));
