import { UI } from "./ui";
import { contextManager } from "../plantuml/context";
import { localize } from "../plantuml/common";
import { previewer } from "../providers/previewer";

export var uiPreview: UI;

contextManager.addInitiatedListener(ctx => {
    uiPreview = new UI(
        "plantuml.preview",
        localize(17, null),
        ctx.asAbsolutePath("templates/preview.html"),
        setUIStatus,
    );
});


async function setUIStatus(status: any) {
    console.log(status);
    previewer.setUIStatus(JSON.stringify(status))
}