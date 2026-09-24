import { ICredentialTestRequest, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class MindwtrApi implements ICredentialType {
	name = 'mindwtrApi';
	displayName = 'Mindwtr API';
	documentationUrl = 'https://docs.mindwtr.app/power-users/local-api';
	icon: Icon = 'file:../nodes/Mindwtr/mindwtr.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'http://127.0.0.1:3456',
			placeholder: 'http://127.0.0.1:3456 or https://mindwtr.example.com',
			required: true,
			description:
				'Base URL of Mindwtr API. Local desktop API (e.g. http://127.0.0.1:3456) or self-hosted Cloud server (e.g. https://mindwtr.example.com). No trailing slash.',
		},
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Bearer token. Local API: copy it from Settings → Advanced → Local API server. Cloud: value of MINDWTR_CLOUD_AUTH_TOKENS.',
		},
	];
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/health',
			headers: {
				Authorization: '=Bearer {{$credentials?.apiToken}}',
			},
		},
	};
}
