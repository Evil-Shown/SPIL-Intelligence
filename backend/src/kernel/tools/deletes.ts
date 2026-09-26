import { register } from '../registry.js';

const deleteTools = [
  { name: 'delete_task', entity: 'task' },
  { name: 'delete_bug', entity: 'bug' },
  { name: 'delete_decision', entity: 'architecture decision' },
  { name: 'delete_idea', entity: 'idea' },
  { name: 'delete_research', entity: 'research note' },
  { name: 'delete_document', entity: 'knowledge document' },
  { name: 'delete_project', entity: 'project' },
];

for (const { name, entity } of deleteTools) {
  register({
    name,
    description: `Permanently delete a ${entity}. Critical operation requiring explicit approval.`,
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: `ID of the ${entity} to permanently destroy` },
      },
      required: ['id'],
    },
    sideEffect: 'critical',
    version: '1.0.0',
    handler: async () => {
      throw new Error(`${name}: execution forbidden without human approval token.`);
    },
  });
}
