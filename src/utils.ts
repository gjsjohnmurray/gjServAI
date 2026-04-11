import * as vscode from 'vscode';
import { OBJECTSCRIPT_EXTENSIONID, serverManagerApi } from './extension';
import * as serverManager from '@intersystems-community/intersystems-servermanager';


export interface IServerNamespaceSpec extends serverManager.IServerSpec {
	namespace: string;
}


/**
 * Get a server+namespace specification for a given URI, using the ObjectScript extension's API if available.
 * Doing this rather than using the Server Manager API directly allows us to support servers that aren't registered with Server Manager, as long as they are recognized by the ObjectScript extension.
 * For example, an objectscript.conn setting that uses the docker-compose object.
 *
 * @param uri The URI of the resource.
 * @returns Server+namespace specification or undefined.
 */
export async function getServerNamespaceSpec(
	uri: vscode.Uri
): Promise<IServerNamespaceSpec | undefined> {
	// Get the server details from the ObjectScript extension if available
	const objectScriptExtension = vscode.extensions.getExtension(OBJECTSCRIPT_EXTENSIONID);
	if (!objectScriptExtension) {
		return undefined;
	}
	if (!objectScriptExtension.isActive) {
		await objectScriptExtension.activate();
	}
	let serverForUri: any;
	if (objectScriptExtension.exports.asyncServerForUri) {
		serverForUri = await objectScriptExtension.exports.asyncServerForUri(uri);
	} else {
		serverForUri = objectScriptExtension.exports.serverForUri(uri);
	}
	if (!serverForUri) {
		return undefined;
	}
	return {
		name: serverForUri.serverName,
		webServer: {
			scheme: serverForUri.scheme,
			host: serverForUri.host,
			port: serverForUri.port,
			pathPrefix: serverForUri.pathPrefix
		},
		username: serverForUri.username,
		password: serverForUri.password ? serverForUri.password : undefined,
		description: `Server for folder ${uri.scheme}://${uri.authority}${uri.path}`,
		namespace: serverForUri.namespace
	};
}


export async function resolveCredentials(serverSpec: serverManager.IServerSpec) {
    if (typeof serverSpec.password === "undefined") {
        const scopes = [serverSpec.name, serverSpec.username || ""];

        const account = serverManagerApi.getAccount(serverSpec);
        let session = await vscode.authentication.getSession(
            serverManager.AUTHENTICATION_PROVIDER,
            scopes,
            { silent: true, account },
        );
        if (!session) {
            session = await vscode.authentication.getSession(
                serverManager.AUTHENTICATION_PROVIDER,
                scopes,
                { createIfNone: true, account },
            );
        }
        if (session) {
            serverSpec.username = session.scopes[1] === "unknownuser" ? "" : session.scopes[1];
            serverSpec.password = session.accessToken;
        }
    }
}
