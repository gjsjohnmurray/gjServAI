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
						mapServerNamespaceSpec.set(serverNamespaceSpec, `${serverNamespaceSpec.name}:${serverNamespaceSpec.namespace}`);
					}
			}

			for (const [serverNamespaceSpec, label] of mapServerNamespaceSpec.entries()) {
				output.push(new vscode.McpStdioServerDefinition(
					`intersystemsObjectscriptRoutine @ ${label}`,
					'npx',
					["-y", "intersystems-objectscript-routine-mcp"]
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

				const serverSpec = await serverManagerApi.getServerSpec(name);
				if (!serverSpec) {
					throw new Error('Selected server not found');
				}
				const serverUrl = `${serverSpec.webServer.scheme ?? 'http'}://${serverSpec.webServer.host}:${serverSpec.webServer.port}${serverSpec.webServer.pathPrefix ?? ''}`;
				await resolveCredentials(serverSpec);
				if (!serverSpec.username || !serverSpec.password) {
					throw new Error(`No credentials obtained for server ${serverUrl}`);
				}
				server.env = {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					IRIS_URL: serverUrl,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					IRIS_USERNAME: serverSpec.username,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					IRIS_PASSWORD: serverSpec.password,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					IRIS_NAMESPACE: namespace,
				};
			}
			resolve(server);
		});
	}
}
