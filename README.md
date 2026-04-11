# gj :: servAI

This VS Code extension wraps MCP servers that require InterSystems credentials in order to provide their services. The extension obtains server credentials from the authentication provider implemented by [InterSystems Server Manager](https://marketplace.visualstudio.com/items?itemName=intersystems-community.servermanager).

It currently offers a single MCP server called [intersystemsObjectscriptRoutine](https://www.npmjs.com/package/intersystems-objectscript-routine-mcp). Learn more about it on [InterSystems Developer Community](https://community.intersystems.com/post/no-hallucinate-mcp-real-time-routine-context-objectscript).

## Getting Started

1. Have at least one folder open in VS Code. The folder(s) of your workspace can be on the local filesystem (for client-side editing) or specify an IRIS server namespace (for server-side editing).
2. From Command Palette run `MCP: List Servers`.
3. Each distinct 'server:namespace' target of your workspace will show as a row in the quickpick list.
4. Choose one, then on the next quickpick choose `Start Server`.
5. If prompted, allow the 'gj :: servAI' extension to sign in using InterSystems Server Credentials. It will now be able to retrieve a stored password for the server connection and supply it to the MCP server you selected.
6. On the Output tab of the VS Code Panel a channel will show messages as the MCP server process starts and connects to the target server.
7. Now you can use VS Code's Chat view to ask MCP for assistance. For example you could ask 'Use MCP to discover whether a routine named FooBar exists'.
8. Initially Chat asks for permission to use the MCP server. Grant the level of permission you are happy with.
9. Wait for the response, then continue the conversation as desired. For example you could ask 'What about one called %SS'.

## Release Notes

See the [CHANGELOG](CHANGELOG.md) for changes in each release.

## Feedback

Please use https://github.com/gjsjohnmurray/gjServAI/issues to report bugs and suggest improvements.

## About George James Software

Known for our expertise in InterSystems technologies, George James Software has been providing innovative software solutions for over 35 years. We focus on activities that can help our customers with the support and maintenance of their systems and applications. Our activities include consulting, training, support, and developer tools - with Deltanji source control being our flagship tool. Our tools augment InterSystems' technology and can help customers with the maintainability and supportability of their applications over the long term.

We also offer VS Code training and extension development services.

To find out more, go to our website - [georgejames.com](https://georgejames.com) 
