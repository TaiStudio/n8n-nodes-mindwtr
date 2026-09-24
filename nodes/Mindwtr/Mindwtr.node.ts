import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

const TASK_STATUSES = ['inbox', 'next', 'waiting', 'someday', 'reference', 'done', 'archived'] as const;
const PROJECT_STATUSES = ['active', 'someday', 'waiting', 'archived'] as const;

function stripTrailingSlash(url: string): string {
	return (url || '').replace(/\/+$/, '');
}

function toArrayPayload(data: unknown, keys: string[]): unknown[] {
	if (Array.isArray(data)) return data;
	if (data && typeof data === 'object') {
		for (const key of keys) {
			const value = (data as IDataObject)[key];
			if (Array.isArray(value)) return value;
		}
	}
	return [data];
}

function splitList(value: unknown): string[] | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
	return String(value)
		.split(',')
		.map((v) => v.trim())
		.filter(Boolean);
}

export class Mindwtr implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mindwtr',
		name: 'mindwtr',
		icon: 'file:mindwtr.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Work with Mindwtr tasks, projects, areas and sections (Local API + Self-hosted Cloud API)',
		defaults: { name: 'Mindwtr' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'mindwtrApi', required: true }],
		properties: [
			{
				displayName: 'API Mode',
				name: 'apiMode',
				type: 'options',
				default: 'local',
				options: [
					{
						name: 'Local Desktop API',
						value: 'local',
						description: 'Desktop app Local API (Settings → Advanced). Endpoints without /v1 prefix.',
					},
					{
						name: 'Self-Hosted Cloud API',
						value: 'cloud',
						description: 'Self-hosted Mindwtr Cloud server. Endpoints under /v1 prefix.',
					},
				],
				description: 'Local API runs on http://127.0.0.1:3456 by default. Cloud API is your self-hosted server.',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Area', value: 'area' },
					{ name: 'Capture', value: 'capture' },
					{ name: 'Project', value: 'project' },
					{ name: 'Search', value: 'search' },
					{ name: 'Section', value: 'section' },
					{ name: 'Task', value: 'task' },
				],
				default: 'task',
			},

			// ---------- TASK operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['task'] } },
				options: [
					{ name: 'Archive', value: 'archive', action: 'Archive a task', description: 'Mark a task as archived' },
					{ name: 'Complete', value: 'complete', action: 'Complete a task', description: 'Mark a task as done' },
					{ name: 'Create', value: 'create', action: 'Create a task', description: 'Create a new task' },
					{ name: 'Delete', value: 'delete', action: 'Delete a task', description: 'Soft-delete a task' },
					{ name: 'Get', value: 'get', action: 'Get a task', description: 'Get a single task by ID' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many tasks', description: 'List tasks with optional filters' },
					{ name: 'Restore', value: 'restore', action: 'Restore a task', description: 'Restore a soft-deleted task' },
					{ name: 'Update', value: 'update', action: 'Update a task', description: 'Update an existing task' },
				],
				default: 'getAll',
			},

			// ---------- PROJECT operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['project'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a project', description: 'Create a new project' },
					{ name: 'Delete', value: 'delete', action: 'Delete a project', description: 'Soft-delete a project' },
					{ name: 'Get', value: 'get', action: 'Get a project', description: 'Get a single project by ID' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many projects', description: 'List many projects' },
					{ name: 'Restore', value: 'restore', action: 'Restore a project', description: 'Restore a soft-deleted project (Local API)' },
					{ name: 'Update', value: 'update', action: 'Update a project', description: 'Update an existing project' },
				],
				default: 'getAll',
			},

			// ---------- AREA operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['area'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create an area', description: 'Create a new area (Cloud API)' },
					{ name: 'Delete', value: 'delete', action: 'Delete an area', description: 'Soft-delete an area (Cloud API)' },
					{ name: 'Get', value: 'get', action: 'Get an area', description: 'Get a single area by ID (Cloud API)' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many areas', description: 'List many areas' },
					{ name: 'Update', value: 'update', action: 'Update an area', description: 'Update an existing area (Cloud API)' },
				],
				default: 'getAll',
			},

			// ---------- SECTION operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['section'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a section', description: 'Create a section inside a project' },
					{ name: 'Delete', value: 'delete', action: 'Delete a section', description: 'Delete a section' },
					{ name: 'Get', value: 'get', action: 'Get a section', description: 'Get a single section by ID' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many sections', description: 'List sections, optionally filtered by project' },
					{ name: 'Update', value: 'update', action: 'Update a section', description: 'Update an existing section' },
				],
				default: 'getAll',
			},

			// ---------- SEARCH operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['search'] } },
				options: [{ name: 'Search', value: 'search', action: 'Search tasks and projects', description: 'Search tasks and projects' }],
				default: 'search',
			},

			// ---------- CAPTURE operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['capture'] } },
				options: [
					{
						name: 'Create Inbox Task',
						value: 'create',
						action: 'Capture text to inbox',
						description: 'Create an Inbox task from text (Cloud API /v1/capture)',
					},
				],
				default: 'create',
			},

			// ---------- IDs ----------
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['task'], operation: ['get', 'update', 'complete', 'archive', 'delete', 'restore'] },
				},
				description: 'UUID of the task',
			},
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['project'], operation: ['get', 'update', 'delete', 'restore'] },
				},
				description: 'UUID of the project',
			},
			{
				displayName: 'Area ID',
				name: 'areaId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['area'], operation: ['get', 'update', 'delete'] } },
				description: 'UUID of the area',
			},
			{
				displayName: 'Section ID',
				name: 'sectionId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['section'], operation: ['get', 'update', 'delete'] },
				},
				description: 'UUID of the section',
			},

			// ---------- Task create/update fields ----------
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				description: 'Title of the task (or use Quick Add input below)',
			},
			{
				displayName: 'Quick Add Input',
				name: 'quickAdd',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				placeholder: 'Call Alice @phone #errands /due:tomorrow',
				description: 'Natural-language input parsed by Mindwtr (contexts, tags, due date). Used as title fallback.',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				options: [
					{ displayName: 'Area ID', name: 'areaId', type: 'string', default: '' },
					{ displayName: 'Assigned To', name: 'assignedTo', type: 'string', default: '', description: 'Person name, e.g. Alex' },
					{
						displayName: 'Contexts (Comma-Separated)',
						name: 'contexts',
						type: 'string',
						default: '',
						placeholder: '@phone, @email',
					},
					{ displayName: 'Description', name: 'description', type: 'string', default: '', typeOptions: { rows: 3 } },
					{ displayName: 'Due Date', name: 'dueDate', type: 'dateTime', default: '' },
					{
						displayName: 'Priority',
						name: 'priority',
						type: 'options',
						default: 'medium',
						options: [
							{ name: 'Low', value: 'low' },
							{ name: 'Medium', value: 'medium' },
							{ name: 'High', value: 'high' },
							{ name: 'Urgent', value: 'urgent' },
						],
					},
					{ displayName: 'Project ID', name: 'projectId', type: 'string', default: '' },
					{ displayName: 'Section ID', name: 'sectionId', type: 'string', default: '' },
					{ displayName: 'Start Time', name: 'startTime', type: 'dateTime', default: '' },
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: 'inbox',
						options: (TASK_STATUSES as readonly string[]).map((s) => ({ name: s, value: s })),
					},
					{
						displayName: 'Tags (Comma-Separated)',
						name: 'tags',
						type: 'string',
						default: '',
						placeholder: '#work, #errands',
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['task'], operation: ['update'] } },
				options: [
					{
						displayName: 'Contexts (Comma-Separated)',
						name: 'contexts',
						type: 'string',
						default: '',
					},
					{ displayName: 'Description', name: 'description', type: 'string', default: '', typeOptions: { rows: 3 } },
					{ displayName: 'Due Date', name: 'dueDate', type: 'dateTime', default: '' },
					{
						displayName: 'Priority',
						name: 'priority',
						type: 'options',
						default: 'medium',
						options: [
							{ name: 'Low', value: 'low' },
							{ name: 'Medium', value: 'medium' },
							{ name: 'High', value: 'high' },
							{ name: 'Urgent', value: 'urgent' },
						],
					},
					{ displayName: 'Project ID', name: 'projectId', type: 'string', default: '' },
					{ displayName: 'Section ID', name: 'sectionId', type: 'string', default: '' },
					{ displayName: 'Start Time', name: 'startTime', type: 'dateTime', default: '' },
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: 'next',
						options: [
							{ name: 'Inbox', value: 'inbox' },
							{ name: 'Next', value: 'next' },
							{ name: 'Reference', value: 'reference' },
							{ name: 'Someday', value: 'someday' },
							{ name: 'Waiting', value: 'waiting' },
						],
						description: 'Use dedicated Complete / Archive operations for done / archived states',
					},
					{
						displayName: 'Tags (Comma-Separated)',
						name: 'tags',
						type: 'string',
						default: '',
					},
					{ displayName: 'Title', name: 'title', type: 'string', default: '' },
				],
			},

			// ---------- Task filters ----------
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['task'], operation: ['getAll'] } },
				options: [
					{
						displayName: 'Focused Today',
						name: 'isFocusedToday',
						type: 'boolean',
						default: false,
						description: 'Whether to return only tasks starred for today',
					},
					{
						displayName: 'Include Completed',
						name: 'all',
						type: 'boolean',
						default: false,
						description: 'Whether to include done/archived tasks (all=1)',
					},
					{
						displayName: 'Include Deleted',
						name: 'deleted',
						type: 'boolean',
						default: false,
						description: 'Whether to include soft-deleted tasks (deleted=1)',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 50,
						description: 'Max number of results to return',
						typeOptions: { minValue: 1 },
					},
					{ displayName: 'Project ID', name: 'projectId', type: 'string', default: '' },
					{ displayName: 'Search Query', name: 'query', type: 'string', default: '', description: 'Plain-text substring search' },
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: 'all',
						options: [
							{ name: 'All', value: 'all' },
							...(TASK_STATUSES as readonly string[]).map((s) => ({ name: s, value: s })),
						],
					},
				],
			},

			// ---------- Project fields ----------
			{
				displayName: 'Title',
				name: 'projectTitle',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['project'], operation: ['create'] } },
			},
			{
				displayName: 'Additional Fields',
				name: 'projectFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['project'], operation: ['create', 'update'] } },
				options: [
					{ displayName: 'Area ID', name: 'areaId', type: 'string', default: '' },
					{ displayName: 'Color', name: 'color', type: 'color', default: '#94a3b8' },
					{ displayName: 'Due Date', name: 'dueDate', type: 'dateTime', default: '' },
					{ displayName: 'Sequential', name: 'isSequential', type: 'boolean', default: false },
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: 'active',
						options: (PROJECT_STATUSES as readonly string[]).map((s) => ({ name: s, value: s })),
					},
					{ displayName: 'Title', name: 'title', type: 'string', default: '' },
				],
			},

			// ---------- Area fields ----------
			{
				displayName: 'Name',
				name: 'areaName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['area'], operation: ['create'] } },
			},
			{
				displayName: 'Additional Fields',
				name: 'areaFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['area'], operation: ['create', 'update'] } },
				options: [
					{ displayName: 'Color', name: 'color', type: 'color', default: '#94a3b8' },
					{ displayName: 'Icon', name: 'icon', type: 'string', default: '' },
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
				],
			},

			// ---------- Section fields ----------
			{
				displayName: 'Project ID',
				name: 'sectionProjectId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['section'], operation: ['create'] } },
				description: 'Project the section belongs to',
			},
			{
				displayName: 'Title',
				name: 'sectionTitle',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['section'], operation: ['create'] } },
			},
			{
				displayName: 'Project ID (Filter)',
				name: 'sectionFilterProjectId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['section'], operation: ['getAll'] } },
				description: 'Only list sections of this project',
			},
			{
				displayName: 'Update Fields',
				name: 'sectionFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['section'], operation: ['create', 'update'] } },
				options: [
					{ displayName: 'Description', name: 'description', type: 'string', default: '' },
					{ displayName: 'Order', name: 'order', type: 'number', default: 0 },
					{ displayName: 'Title', name: 'title', type: 'string', default: '' },
				],
			},

			// ---------- Search ----------
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['search'], operation: ['search'] } },
				description: 'Text to search in tasks and projects',
			},

			// ---------- Capture ----------
			{
				displayName: 'Text',
				name: 'captureText',
				type: 'string',
				required: true,
				default: '',
				typeOptions: { rows: 3 },
				displayOptions: { show: { resource: ['capture'], operation: ['create'] } },
				description: 'Text to capture. First line becomes the task title. Requires Cloud API.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('mindwtrApi');
		const baseUrl = stripTrailingSlash((credentials.baseUrl as string) || '');

		if (!baseUrl) {
			throw new NodeOperationError(this.getNode(), 'Mindwtr Base URL is not set in credentials');
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const apiMode = this.getNodeParameter('apiMode', i) as string;
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const prefix = apiMode === 'cloud' ? '/v1' : '';

				const request = async (
					method: IHttpRequestMethods,
					path: string,
					body?: IDataObject,
					qs?: IDataObject,
				) => {
					const cleanQs: IDataObject = {};
					for (const [k, v] of Object.entries(qs || {})) {
						if (v !== undefined && v !== null && v !== '') cleanQs[k] = v;
					}
					return this.helpers.httpRequestWithAuthentication.call(this, 'mindwtrApi', {
						method,
						baseURL: baseUrl,
						url: path,
						headers: {
							Authorization: `Bearer ${credentials.apiToken}`,
							'Content-Type': 'application/json',
						},
						qs: cleanQs,
						body,
						json: true,
					});
				};

				let responseData: unknown;

				// ================= TASK =================
				if (resource === 'task') {
					if (operation === 'getAll') {
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						if (filters.status && filters.status !== 'all') qs.status = filters.status;
						if (filters.query) qs.query = filters.query;
						if (filters.projectId) qs.projectId = filters.projectId;
						if (filters.isFocusedToday) qs.isFocusedToday = true;
						if (filters.all) qs.all = 1;
						if (filters.deleted) qs.deleted = 1;
						if (filters.limit) {
							qs.limit = filters.limit;
						}
						responseData = await request('GET', `${prefix}/tasks`, undefined, qs);
						for (const item of toArrayPayload(responseData, ['tasks'])) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;
					}
					if (operation === 'get') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						responseData = await request('GET', `${prefix}/tasks/${encodeURIComponent(taskId)}`);
						const payload = (responseData as IDataObject)?.task ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'create') {
						const title = this.getNodeParameter('title', i) as string;
						const quickAdd = this.getNodeParameter('quickAdd', i, '') as string;
						const additional = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						const props: IDataObject = {};
						for (const key of [
							'status',
							'description',
							'projectId',
							'sectionId',
							'areaId',
							'priority',
							'dueDate',
							'startTime',
							'assignedTo',
						]) {
							if (additional[key] !== undefined && additional[key] !== '') props[key] = additional[key];
						}
						const contexts = splitList(additional.contexts);
						const tags = splitList(additional.tags);
						if (contexts) props.contexts = contexts;
						if (tags) props.tags = tags;
						const body: IDataObject = { props };
						if (title) body.title = title;
						if (quickAdd) body.input = quickAdd;
						if (!title && !quickAdd) {
							throw new NodeOperationError(this.getNode(), 'Set either Title or Quick Add Input', { itemIndex: i });
						}
						responseData = await request('POST', `${prefix}/tasks`, body);
						const payload = (responseData as IDataObject)?.task ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'update') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
						const body: IDataObject = { ...updateFields };
						if (updateFields.contexts !== undefined) body.contexts = splitList(updateFields.contexts);
						if (updateFields.tags !== undefined) body.tags = splitList(updateFields.tags);
						responseData = await request('PATCH', `${prefix}/tasks/${encodeURIComponent(taskId)}`, body);
						const payload = (responseData as IDataObject)?.task ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (['complete', 'archive', 'restore'].includes(operation)) {
						const taskId = this.getNodeParameter('taskId', i) as string;
						responseData = await request('POST', `${prefix}/tasks/${encodeURIComponent(taskId)}/${operation}`);
						const payload = (responseData as IDataObject)?.task ?? responseData;
						returnData.push({ json: (payload ?? { ok: true }) as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'delete') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						responseData = await request('DELETE', `${prefix}/tasks/${encodeURIComponent(taskId)}`);
						returnData.push({
							json: ((responseData as IDataObject) ?? { ok: true }) as IDataObject,
							pairedItem: { item: i },
						});
						continue;
					}
				}

				// ================= PROJECT =================
				if (resource === 'project') {
					if (operation === 'getAll') {
						responseData = await request('GET', `${prefix}/projects`);
						for (const item of toArrayPayload(responseData, ['projects'])) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;
					}
					if (operation === 'get') {
						const projectId = this.getNodeParameter('projectId', i) as string;
						responseData = await request('GET', `${prefix}/projects/${encodeURIComponent(projectId)}`);
						const payload = (responseData as IDataObject)?.project ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'create') {
						const projectTitle = this.getNodeParameter('projectTitle', i) as string;
						const fields = this.getNodeParameter('projectFields', i, {}) as IDataObject;
						let body: IDataObject;
						if (apiMode === 'cloud') {
							body = { title: projectTitle };
							for (const key of ['status', 'areaId', 'color', 'isSequential', 'dueDate']) {
								if (fields[key] !== undefined && fields[key] !== '') body[key] = fields[key];
							}
							if (fields.title) body.title = fields.title;
						} else {
							const props: IDataObject = {};
							if (fields.status) props.status = fields.status;
							if (fields.areaId) props.areaId = fields.areaId;
							if (fields.color) props.color = fields.color;
							if (fields.isSequential !== undefined) props.isSequential = fields.isSequential;
							if (fields.dueDate) props.dueDate = fields.dueDate;
							body = { title: (fields.title as string) || projectTitle, props };
						}
						responseData = await request('POST', `${prefix}/projects`, body);
						const payload = (responseData as IDataObject)?.project ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'update') {
						const projectId = this.getNodeParameter('projectId', i) as string;
						const fields = this.getNodeParameter('projectFields', i, {}) as IDataObject;
						const body: IDataObject = {};
						for (const key of ['title', 'status', 'areaId', 'color', 'isSequential', 'dueDate']) {
							if (fields[key] !== undefined && fields[key] !== '') body[key] = fields[key];
						}
						responseData = await request('PATCH', `${prefix}/projects/${encodeURIComponent(projectId)}`, body);
						const payload = (responseData as IDataObject)?.project ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'delete') {
						const projectId = this.getNodeParameter('projectId', i) as string;
						responseData = await request('DELETE', `${prefix}/projects/${encodeURIComponent(projectId)}`);
						returnData.push({
							json: ((responseData as IDataObject) ?? { ok: true }) as IDataObject,
							pairedItem: { item: i },
						});
						continue;
					}
					if (operation === 'restore') {
						const projectId = this.getNodeParameter('projectId', i) as string;
						responseData = await request('POST', `${prefix}/projects/${encodeURIComponent(projectId)}/restore`);
						const payload = (responseData as IDataObject)?.project ?? responseData;
						returnData.push({
							json: ((payload ?? { ok: true }) as IDataObject),
							pairedItem: { item: i },
						});
						continue;
					}
				}

				// ================= AREA =================
				if (resource === 'area') {
					if (operation === 'getAll') {
						responseData = await request('GET', `${prefix}/areas`);
						for (const item of toArrayPayload(responseData, ['areas'])) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;
					}
					if (operation === 'get') {
						const areaId = this.getNodeParameter('areaId', i) as string;
						responseData = await request('GET', `${prefix}/areas/${encodeURIComponent(areaId)}`);
						const payload = (responseData as IDataObject)?.area ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'create') {
						const areaName = this.getNodeParameter('areaName', i) as string;
						const fields = this.getNodeParameter('areaFields', i, {}) as IDataObject;
						const body: IDataObject = { name: areaName };
						if (fields.name) body.name = fields.name;
						if (fields.color) body.color = fields.color;
						if (fields.icon) body.icon = fields.icon;
						responseData = await request('POST', `${prefix}/areas`, body);
						const payload = (responseData as IDataObject)?.area ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'update') {
						const areaId = this.getNodeParameter('areaId', i) as string;
						const fields = this.getNodeParameter('areaFields', i, {}) as IDataObject;
						responseData = await request('PATCH', `${prefix}/areas/${encodeURIComponent(areaId)}`, fields);
						const payload = (responseData as IDataObject)?.area ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'delete') {
						const areaId = this.getNodeParameter('areaId', i) as string;
						responseData = await request('DELETE', `${prefix}/areas/${encodeURIComponent(areaId)}`);
						returnData.push({
							json: ((responseData as IDataObject) ?? { ok: true }) as IDataObject,
							pairedItem: { item: i },
						});
						continue;
					}
				}

				// ================= SECTION =================
				if (resource === 'section') {
					if (operation === 'getAll') {
						const filterProjectId = this.getNodeParameter('sectionFilterProjectId', i, '') as string;
						const qs: IDataObject = {};
						if (filterProjectId) qs.projectId = filterProjectId;
						responseData = await request('GET', `${prefix}/sections`, undefined, qs);
						for (const item of toArrayPayload(responseData, ['sections'])) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;
					}
					if (operation === 'get') {
						const sectionId = this.getNodeParameter('sectionId', i) as string;
						responseData = await request('GET', `${prefix}/sections/${encodeURIComponent(sectionId)}`);
						const payload = (responseData as IDataObject)?.section ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'create') {
						const sectionProjectId = this.getNodeParameter('sectionProjectId', i) as string;
						const sectionTitle = this.getNodeParameter('sectionTitle', i) as string;
						const fields = this.getNodeParameter('sectionFields', i, {}) as IDataObject;
						const body: IDataObject = {
							projectId: sectionProjectId,
							title: (fields.title as string) || sectionTitle,
						};
						if (fields.description) body.description = fields.description;
						if (fields.order !== undefined) body.order = fields.order;
						responseData = await request('POST', `${prefix}/sections`, body);
						const payload = (responseData as IDataObject)?.section ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'update') {
						const sectionId = this.getNodeParameter('sectionId', i) as string;
						const fields = this.getNodeParameter('sectionFields', i, {}) as IDataObject;
						responseData = await request('PATCH', `${prefix}/sections/${encodeURIComponent(sectionId)}`, fields);
						const payload = (responseData as IDataObject)?.section ?? responseData;
						returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
						continue;
					}
					if (operation === 'delete') {
						const sectionId = this.getNodeParameter('sectionId', i) as string;
						responseData = await request('DELETE', `${prefix}/sections/${encodeURIComponent(sectionId)}`);
						returnData.push({
							json: ((responseData as IDataObject) ?? { ok: true }) as IDataObject,
							pairedItem: { item: i },
						});
						continue;
					}
				}

				// ================= SEARCH =================
				if (resource === 'search') {
					const query = this.getNodeParameter('query', i) as string;
					responseData = await request('GET', `${prefix}/search`, undefined, { query });
					if (
						responseData &&
						typeof responseData === 'object' &&
						('tasks' in (responseData as IDataObject) ||
							'projects' in (responseData as IDataObject))
					) {
						returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
					} else {
						for (const item of toArrayPayload(responseData, ['tasks', 'projects', 'results'])) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
					}
					continue;
				}

				// ================= CAPTURE =================
				if (resource === 'capture') {
					const captureText = this.getNodeParameter('captureText', i) as string;
					responseData = await request(
						'POST',
						`${prefix}/capture`,
						{ transcription: captureText },
						undefined,
					);
					const payload = (responseData as IDataObject)?.task ?? responseData;
					returnData.push({ json: payload as IDataObject, pairedItem: { item: i } });
					continue;
				}

				throw new NodeOperationError(this.getNode(), `Unsupported resource/operation: ${resource}/${operation}`, {
					itemIndex: i,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}
		return [returnData];
	}
}
