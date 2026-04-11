/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as serverManager from '@intersystems-community/intersystems-servermanager';
import { ServerDefinitionProvider } from './serverDefinitionProvider';

export const extensionId = "georgejames.serv-ai";
export const OBJECTSCRIPT_EXTENSIONID = "intersystems-community.vscode-objectscript";

export let extensionUri: vscode.Uri;
export let logChannel: vscode.LogOutputChannel;

export let serverManagerApi: serverManager.ServerManagerAPI;

export async function activate(context: vscode.ExtensionContext) {

	extensionUri = context.extensionUri;

	logChannel = vscode.window.createOutputChannel('gj :: servAI', { log: true});
	logChannel.info('Extension activated');

	const serverManagerExt = vscode.extensions.getExtension(serverManager.EXTENSION_ID);
	if (!serverManagerExt) {
		throw new Error('Server Manager extension not installed');
	}
	if (!serverManagerExt.isActive) {
	  await serverManagerExt.activate();
	}
    serverManagerApi = serverManagerExt.exports;

	const serverDefinitionProvider = new ServerDefinitionProvider();
	context.subscriptions.push(
		vscode.lm.registerMcpServerDefinitionProvider(`${extensionId}`, serverDefinitionProvider),
		vscode.workspace.onDidChangeWorkspaceFolders(async (e) => {
			serverDefinitionProvider.refresh();
		})
	);
}

export function deactivate() {
	logChannel.debug('Extension deactivated');
}
