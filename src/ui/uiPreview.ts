import { UI } from "./ui";
import { contextManager } from "../plantuml/context";
import { localize } from "../plantuml/common";
import { previewer } from "../providers/previewer";
import { MessageEvent } from "./events";

export var uiPreview: UI;

contextManager.addInitiatedListener(ctx => {
    uiPreview = new UI(
        "plantuml.preview",
        localize(17, null),
        ctx.asAbsolutePath("templates/preview.html"),
    );
    uiPreview.addEventListener("message", e => previewer.setUIStatus(JSON.stringify(e.message)));
});