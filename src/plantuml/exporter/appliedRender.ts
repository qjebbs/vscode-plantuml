import * as vscode from 'vscode';
import { IRender } from '../renders/interfaces';
import { localRender } from '../renders/local';
import { plantumlServer } from '../renders/plantumlServer';
import { config, RenderType } from '../config';
import { localServer } from '../renders/localServer';

/**
 * get applied base exporter
 * @returns IBaseExporter of applied exporter
 */
export function appliedRender(uri: vscode.Uri): IRender {
    switch (config.render(uri)) {
        case RenderType.Local:
            return localRender;
        case RenderType.LocalServer:
            return localServer;
        case RenderType.PlantUMLServer:
            return plantumlServer;
        default:
            return localRender;
    }
}
