import * as vscode from 'vscode';
import { logChannel, serverManagerApi } from './extension';
import { getServerNamespaceSpec, IServerNamespaceSpec, resolveCredentials } from './utils';

export class ServerDefinitionProvider implements vscode.McpServerDefinitionProvider {
	constructor() {
		logChannel.debug('ServerDefinitionProvider constructor called');
		this.onDidChangeMcpServerDefinitions = this._onDidChangeMcpServerDefinitions.event;
	}
	refresh() {
		logChannel.debug('ServerDefinitionProvider refresh called');
		this._onDidChangeMcpServerDefinitions.fire();
	}
	onDidChangeMcpServerDefinitions?: vscode.Event<void> | undefined;
	private _onDidChangeMcpServerDefinitions: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

	provideMcpServerDefinitions(token: vscode.CancellationToken): vscode.ProviderResult<vscode.McpServerDefinition[]> {
		logChannel.debug('provideMcpServerDefinitions called');
		return new Promise(async (resolve) => {
			const output: vscode.McpServerDefinition[] = [];

			const mapServerNamespaceSpec = new Map<IServerNamespaceSpec, string>();
			for await (const folder of vscode.workspace.workspaceFolders ?? []) {
				const serverNamespaceSpec = await getServerNamespaceSpec(folder.uri);
				if (serverNamespaceSpec) {
					if (serverNamespaceSpec.name === '') {
						serverNamespaceSpec.name = folder.name;
					}
					mapServerNamespaceSpec.set(serverNamespaceSpec, folder.uri.toString());
				}
			}

			for (const [serverNamespaceSpec, folderUrl] of mapServerNamespaceSpec.entries()) {
				output.push(new vscode.McpStdioServerDefinition(
					`intersystemsObjectscriptRoutine @ ${serverNamespaceSpec.name}:${serverNamespaceSpec.namespace}`,
					'npx',
					["-y", "intersystems-objectscript-routine-mcp"],
					{ folderUrl: folderUrl }
				));
			}

			resolve(output);
		});
	}
	resolveMcpServerDefinition?(server: vscode.McpServerDefinition, token: vscode.CancellationToken): vscode.ProviderResult<vscode.McpServerDefinition> {
		logChannel.debug('resolveMcpServerDefinition called');
		const mapServerNamespaceSpec = new Map<IServerNamespaceSpec, string>();
		return new Promise(async (resolve) => {
			if (server instanceof vscode.McpStdioServerDefinition && server.args[1] === 'intersystems-objectscript-routine-mcp') {
				const [name, namespace] = server.label.split(' @ ')[1].split(':');

				const folderUrl = server.env?.folderUrl;
				if (!folderUrl) {
					throw new Error('No folderUrl passed in env');
				}

				const serverNamespaceSpec = await getServerNamespaceSpec(vscode.Uri.parse(folderUrl as string));
				if (!serverNamespaceSpec) {
					throw new Error('Selected server not found');
				}
				const serverUrl = `${serverNamespaceSpec.webServer.scheme ?? 'http'}://${serverNamespaceSpec.webServer.host}:${serverNamespaceSpec.webServer.port}${serverNamespaceSpec.webServer.pathPrefix ?? ''}`;
				await resolveCredentials(serverNamespaceSpec);
				if (!serverNamespaceSpec.username || !serverNamespaceSpec.password) {
					throw new Error(`No credentials obtained for server ${serverUrl}`);
				}
				server.env = {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					IRIS_URL: serverUrl,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					IRIS_USERNAME: serverNamespaceSpec.username,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					IRIS_PASSWORD: serverNamespaceSpec.password,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					IRIS_NAMESPACE: namespace,
				};
			}
			resolve(server);
		});
	}
}
