import { useMemo } from 'react';

export type GraphKind =
  | 'workspace'
  | 'department'
  | 'domain'
  | 'entity'
  | 'person'
  | 'customer'
  | 'workflow'
  | 'project'
  | 'task'
  | 'bug'
  | 'research'
  | 'decision'
  | 'algorithm'
  | 'idea'
  | 'document'
  | 'tool'
  | 'finance'
  | 'support'
  | 'asset'
  | 'communication';

export interface GraphDetail {
  label: string;
  value: string;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphKind;
  x: number;
  y: number;
  radius: number;
  route?: string;
  meta?: string;
  description?: string | null;
  status?: string;
  details?: GraphDetail[];
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  strength: number;
}

export interface Point {
  x: number;
  y: number;
}

type BadgeVariant = 'neural' | 'hot' | 'violet' | 'active' | 'risk' | 'draft';

interface BranchSpec {
  label: string;
  kind?: GraphKind;
  meta?: string;
  description?: string;
  status?: string;
  children?: BranchSpec[];
}

interface DepartmentSpec {
  id: string;
  label: string;
  meta: string;
  description: string;
  colorKind: GraphKind;
  domains: BranchSpec[];
}

export const nodeColors: Record<GraphKind, string> = {
  workspace: 'var(--neural-pulse)',
  department: 'var(--neural-core)',
  domain: 'var(--neural-core)',
  entity: 'var(--text-neural)',
  person: 'var(--status-active)',
  customer: 'var(--violet-core)',
  workflow: 'var(--hot-core)',
  project: 'var(--neural-core)',
  task: 'var(--neural-pulse)',
  bug: 'var(--status-risk)',
  research: 'var(--violet-core)',
  decision: 'var(--status-active)',
  algorithm: 'var(--neural-pulse)',
  idea: 'var(--violet-core)',
  document: 'var(--text-muted)',
  tool: 'var(--neural-core)',
  finance: 'var(--hot-core)',
  support: 'var(--hot-core)',
  asset: 'var(--status-idle)',
  communication: 'var(--violet-core)',
};

export const nodeBadgeVariant: Record<GraphKind, BadgeVariant> = {
  workspace: 'neural',
  department: 'neural',
  domain: 'neural',
  entity: 'draft',
  person: 'active',
  customer: 'violet',
  workflow: 'hot',
  project: 'neural',
  task: 'neural',
  bug: 'risk',
  research: 'violet',
  decision: 'active',
  algorithm: 'neural',
  idea: 'violet',
  document: 'draft',
  tool: 'neural',
  finance: 'hot',
  support: 'hot',
  asset: 'draft',
  communication: 'violet',
};

const companyDepartments: DepartmentSpec[] = [
  {
    id: 'hr',
    label: 'HR',
    meta: 'People intelligence',
    description: 'Employees, roles, skills, documents, attendance, capacity, and internal properties.',
    colorKind: 'person',
    domains: [
      {
        label: 'Employees',
        kind: 'person',
        description: 'Every person becomes a live knowledge node connected to work, documents, email, and history.',
        children: [
          {
            label: 'Damitha',
            kind: 'person',
            meta: 'Engineering Lead',
            children: [
              { label: 'Profile Details', kind: 'entity' },
              { label: 'Documents', kind: 'document' },
              { label: 'Assigned Projects', kind: 'project' },
              { label: 'Emails', kind: 'communication' },
              { label: 'Tasks', kind: 'task' },
              { label: 'Skills', kind: 'entity' },
            ],
          },
          { label: 'QA Lead', kind: 'person', children: [{ label: 'Test Ownership', kind: 'task' }, { label: 'Release Signoff', kind: 'decision' }] },
          { label: 'Support Agent', kind: 'person', children: [{ label: 'Ticket Queue', kind: 'support' }, { label: 'Customer Calls', kind: 'communication' }] },
        ],
      },
      { label: 'Roles & Skills', kind: 'entity', children: [{ label: 'Geometry Expert', kind: 'entity' }, { label: 'ERP Analyst', kind: 'entity' }, { label: 'QA Automation', kind: 'entity' }] },
      { label: 'Properties', kind: 'asset', children: [{ label: 'Laptops', kind: 'asset' }, { label: 'Licenses', kind: 'asset' }, { label: 'Office Assets', kind: 'asset' }] },
      { label: 'Attendance', kind: 'entity', children: [{ label: 'Availability', kind: 'entity' }, { label: 'Leave Records', kind: 'document' }] },
      { label: 'Payroll & Cost', kind: 'finance', children: [{ label: 'Salary Cost', kind: 'finance' }, { label: 'Billable Rate', kind: 'finance' }] },
    ],
  },
  {
    id: 'opti',
    label: 'OPTI',
    meta: 'Optimization and R&D',
    description: 'Algorithm research, geometry decisions, optimization engines, and product intelligence.',
    colorKind: 'algorithm',
    domains: [
      { label: 'Algorithms', kind: 'algorithm', children: [{ label: 'Nesting Engine', kind: 'algorithm' }, { label: 'Arc Geometry', kind: 'algorithm' }, { label: 'Validation Rules', kind: 'algorithm' }] },
      { label: 'Research Lab', kind: 'research', children: [{ label: 'Experiments', kind: 'research' }, { label: 'Benchmarks', kind: 'research' }, { label: 'Findings', kind: 'document' }] },
      { label: 'Architecture Decisions', kind: 'decision', children: [{ label: 'ADR Log', kind: 'decision' }, { label: 'Rejected Options', kind: 'document' }] },
      { label: 'Optimization Projects', kind: 'project', children: [{ label: 'GSAP Engine', kind: 'project' }, { label: 'Warehouse Optimizer', kind: 'project' }, { label: 'Cutting Planner', kind: 'project' }] },
      { label: 'Known Edge Cases', kind: 'bug', children: [{ label: 'Sweep Flag Bugs', kind: 'bug' }, { label: 'Cutout Propagation', kind: 'bug' }] },
    ],
  },
  {
    id: 'dev',
    label: 'DEV',
    meta: 'Product engineering',
    description: 'Repositories, features, releases, CI/CD, deployments, and engineering execution.',
    colorKind: 'project',
    domains: [
      { label: 'Repositories', kind: 'tool', children: [{ label: 'ERP Codebase', kind: 'tool' }, { label: 'Optimizer Codebase', kind: 'tool' }, { label: 'Portal Codebase', kind: 'tool' }] },
      { label: 'Feature Tasks', kind: 'task', children: [{ label: 'Sprint Backlog', kind: 'task' }, { label: 'Assigned Developer', kind: 'person' }, { label: 'Code Review', kind: 'decision' }] },
      { label: 'Deployments', kind: 'workflow', children: [{ label: 'Staging', kind: 'tool' }, { label: 'Production', kind: 'tool' }, { label: 'Rollback Plan', kind: 'document' }] },
      { label: 'CI/CD', kind: 'tool', children: [{ label: 'Build Checks', kind: 'tool' }, { label: 'Test Gates', kind: 'tool' }] },
      { label: 'Technical Debt', kind: 'idea', children: [{ label: 'Refactor Queue', kind: 'task' }, { label: 'Risk Notes', kind: 'document' }] },
    ],
  },
  {
    id: 'qa',
    label: 'QA',
    meta: 'Quality intelligence',
    description: 'Test design, regression history, defect intelligence, automation, and release confidence.',
    colorKind: 'bug',
    domains: [
      { label: 'Test Cases', kind: 'document', children: [{ label: 'Functional Tests', kind: 'document' }, { label: 'Geometry Tests', kind: 'document' }, { label: 'ERP Tests', kind: 'document' }] },
      { label: 'Regression Tests', kind: 'workflow', children: [{ label: 'Smoke Suite', kind: 'tool' }, { label: 'Critical Path', kind: 'tool' }] },
      { label: 'Defect History', kind: 'bug', children: [{ label: 'Open Bugs', kind: 'bug' }, { label: 'Resolved Bugs', kind: 'bug' }, { label: 'Failure Patterns', kind: 'research' }] },
      { label: 'Release Signoff', kind: 'decision', children: [{ label: 'QA Approval', kind: 'decision' }, { label: 'Go Live Risk', kind: 'bug' }] },
      { label: 'Automation Tools', kind: 'tool', children: [{ label: 'Playwright', kind: 'tool' }, { label: 'API Tests', kind: 'tool' }] },
    ],
  },
  {
    id: 'ba',
    label: 'BA',
    meta: 'Business analysis',
    description: 'Requirements, stakeholders, process maps, change requests, and acceptance criteria.',
    colorKind: 'document',
    domains: [
      { label: 'Requirements', kind: 'document', children: [{ label: 'Client Needs', kind: 'document' }, { label: 'Acceptance Criteria', kind: 'decision' }, { label: 'Change Requests', kind: 'task' }] },
      { label: 'Stakeholders', kind: 'customer', children: [{ label: 'Decision Makers', kind: 'customer' }, { label: 'Operators', kind: 'person' }] },
      { label: 'Process Maps', kind: 'document', children: [{ label: 'Quote to Cash', kind: 'workflow' }, { label: 'Support Flow', kind: 'workflow' }] },
      { label: 'Product Scope', kind: 'project', children: [{ label: 'Roadmap', kind: 'project' }, { label: 'Release Notes', kind: 'document' }] },
      { label: 'Discovery Calls', kind: 'communication', children: [{ label: 'Meeting Notes', kind: 'document' }, { label: 'Follow-ups', kind: 'task' }] },
    ],
  },
  {
    id: 'marketing',
    label: 'MARKETING',
    meta: 'Market growth',
    description: 'Campaigns, messaging, analytics, product positioning, and customer communication.',
    colorKind: 'idea',
    domains: [
      { label: 'Campaigns', kind: 'idea', children: [{ label: 'ERP Campaign', kind: 'idea' }, { label: 'Optimizer Campaign', kind: 'idea' }] },
      { label: 'Content Library', kind: 'document', children: [{ label: 'Case Studies', kind: 'document' }, { label: 'Product Demos', kind: 'document' }] },
      { label: 'Customer Segments', kind: 'customer', children: [{ label: 'Glass Cutters', kind: 'customer' }, { label: 'Factories', kind: 'customer' }, { label: 'Warehouses', kind: 'customer' }] },
      { label: 'Market Signals', kind: 'research', children: [{ label: 'Competitors', kind: 'research' }, { label: 'Pricing Signals', kind: 'finance' }] },
      { label: 'Reviews & Proof', kind: 'communication', children: [{ label: 'Testimonials', kind: 'communication' }, { label: 'Reference Clients', kind: 'customer' }] },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    meta: 'Customer intelligence',
    description: 'Client companies, contacts, licenses, renewals, account health, and opportunity history.',
    colorKind: 'customer',
    domains: [
      { label: 'Customers', kind: 'customer', children: [{ label: 'ABC Glass', kind: 'customer' }, { label: 'Lanka Glass', kind: 'customer' }, { label: 'Factory One', kind: 'customer' }] },
      { label: 'Contacts', kind: 'person', children: [{ label: 'Owner', kind: 'person' }, { label: 'Plant Manager', kind: 'person' }, { label: 'IT Contact', kind: 'person' }] },
      { label: 'Licenses', kind: 'finance', children: [{ label: 'ERP License', kind: 'finance' }, { label: 'Optimizer License', kind: 'finance' }, { label: 'Renewal Date', kind: 'task' }] },
      { label: 'Account Health', kind: 'customer', children: [{ label: 'Usage Signals', kind: 'research' }, { label: 'Renewal Risk', kind: 'bug' }, { label: 'Upsell Chance', kind: 'idea' }] },
      { label: 'Customer Timeline', kind: 'communication', children: [{ label: 'Calls', kind: 'communication' }, { label: 'Emails', kind: 'communication' }, { label: 'Meetings', kind: 'communication' }] },
    ],
  },
  {
    id: 'support',
    label: 'SUPPORT',
    meta: 'Care and maintenance',
    description: 'Tickets, SLAs, escalations, customer care, product feedback, and support knowledge.',
    colorKind: 'support',
    domains: [
      { label: 'Customer Bugs', kind: 'bug', children: [{ label: 'Bug Report', kind: 'bug' }, { label: 'Screenshots', kind: 'document' }, { label: 'Logs', kind: 'tool' }] },
      { label: 'Ticket Triage', kind: 'support', children: [{ label: 'Priority', kind: 'task' }, { label: 'SLA Clock', kind: 'support' }, { label: 'Escalation', kind: 'workflow' }] },
      { label: 'Knowledge Base', kind: 'document', children: [{ label: 'Fix Notes', kind: 'document' }, { label: 'How-to Guides', kind: 'document' }] },
      { label: 'Customer Reviews', kind: 'communication', children: [{ label: 'Feedback', kind: 'communication' }, { label: 'Satisfaction', kind: 'customer' }] },
      { label: 'Maintenance Contracts', kind: 'finance', children: [{ label: 'SLA Terms', kind: 'document' }, { label: 'Support Hours', kind: 'finance' }] },
    ],
  },
  {
    id: 'finance',
    label: 'FINANCE',
    meta: 'Money and margins',
    description: 'Revenue, contracts, invoices, costs, profitability, commissions, and forecasting.',
    colorKind: 'finance',
    domains: [
      { label: 'Revenue Streams', kind: 'finance', children: [{ label: 'Software Sales', kind: 'finance' }, { label: 'Maintenance', kind: 'finance' }, { label: 'Brokerage', kind: 'finance' }] },
      { label: 'Invoices', kind: 'document', children: [{ label: 'Pending Invoices', kind: 'document' }, { label: 'Paid Invoices', kind: 'document' }] },
      { label: 'Costs', kind: 'finance', children: [{ label: 'Salaries', kind: 'finance' }, { label: 'Cloud Cost', kind: 'finance' }, { label: 'R&D Cost', kind: 'finance' }] },
      { label: 'Margins', kind: 'finance', children: [{ label: 'Client Profitability', kind: 'finance' }, { label: 'Project Profitability', kind: 'finance' }] },
      { label: 'Forecasts', kind: 'research', children: [{ label: 'Renewal Forecast', kind: 'research' }, { label: 'Cashflow Risk', kind: 'bug' }] },
    ],
  },
  {
    id: 'broker',
    label: 'BROKER',
    meta: 'Industry network',
    description: 'Buyer and seller matching, deal pipelines, commissions, trust scores, and market price signals.',
    colorKind: 'workflow',
    domains: [
      { label: 'Buyers', kind: 'customer', children: [{ label: 'Glass Buyers', kind: 'customer' }, { label: 'Software Buyers', kind: 'customer' }] },
      { label: 'Sellers', kind: 'customer', children: [{ label: 'Material Sellers', kind: 'customer' }, { label: 'Solution Vendors', kind: 'customer' }] },
      { label: 'Deal Pipeline', kind: 'workflow', children: [{ label: 'Lead', kind: 'task' }, { label: 'Negotiation', kind: 'communication' }, { label: 'Closed Deal', kind: 'finance' }] },
      { label: 'Commission Tracking', kind: 'finance', children: [{ label: 'Commission Rate', kind: 'finance' }, { label: 'Payment Status', kind: 'finance' }] },
      { label: 'Market Prices', kind: 'research', children: [{ label: 'Glass Rates', kind: 'research' }, { label: 'Vendor Pricing', kind: 'research' }] },
    ],
  },
  {
    id: 'tools',
    label: 'TOOLS',
    meta: 'Platform and infrastructure',
    description: 'Internal tools, integrations, cloud services, logs, monitoring, security, and automation.',
    colorKind: 'tool',
    domains: [
      { label: 'Internal Tools', kind: 'tool', children: [{ label: 'SPIL Intelligence', kind: 'tool' }, { label: 'Admin Portal', kind: 'tool' }] },
      { label: 'Integrations', kind: 'tool', children: [{ label: 'Email', kind: 'communication' }, { label: 'Git', kind: 'tool' }, { label: 'Accounting', kind: 'finance' }] },
      { label: 'Monitoring', kind: 'tool', children: [{ label: 'Logs', kind: 'tool' }, { label: 'Alerts', kind: 'workflow' }, { label: 'Incidents', kind: 'bug' }] },
      { label: 'Security', kind: 'decision', children: [{ label: 'Permissions', kind: 'decision' }, { label: 'Audit Trail', kind: 'document' }] },
      { label: 'Automation', kind: 'workflow', children: [{ label: 'Renewal Alerts', kind: 'task' }, { label: 'Ticket Routing', kind: 'workflow' }] },
    ],
  },
];

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function polarPoint(cx: number, cy: number, radius: number, angle: number): Point {
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function connect(source: string, target: string, strength = 0.38): GraphLink {
  return { id: `${source}-${target}`, source, target, strength };
}

export function buildCompanyBrainGraph(width: number, height: number) {
  const min = Math.min(width, height);
  const cx = width * 0.42;
  const cy = height * 0.5;
  const departmentRadius = Math.max(245, min * 0.38);
  const domainDistance = Math.max(86, min * 0.14);
  const childDistance = Math.max(46, min * 0.078);
  const microDistance = Math.max(30, min * 0.052);

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const addNode = (node: GraphNode) => {
    nodes.push(node);
    return node;
  };

  const root = addNode({
    id: 'workspace',
    label: 'SPIL INTELLIGENCE',
    kind: 'workspace',
    x: cx,
    y: cy,
    radius: Math.max(23, min * 0.038),
    meta: 'Company operating brain',
    description:
      'The central intelligence layer connecting people, customers, products, support, finance, research, and execution into one living company brain.',
    details: [
      { label: 'Main Brain', value: 'SPIL Intelligence' },
      { label: 'Departments', value: String(companyDepartments.length) },
      { label: 'Purpose', value: 'Connect every company signal into one searchable neural map' },
    ],
  });

  const nodeById = new Map<string, GraphNode>([['workspace', root]]);
  const domainIds = new Map<string, string>();

  const addBranch = (
    parent: GraphNode,
    branch: BranchSpec,
    parentKey: string,
    index: number,
    total: number,
    outwardAngle: number,
    depth: number
  ) => {
    const fanStep = depth === 1 ? 0.34 : depth === 2 ? 0.28 : 0.42;
    const distance = depth === 1 ? domainDistance : depth === 2 ? childDistance : microDistance;
    const angle = outwardAngle + (index - (total - 1) / 2) * fanStep;
    const point = polarPoint(parent.x, parent.y, distance, angle);
    const id = `${parentKey}-${slug(branch.label)}`;
    const kind = branch.kind ?? (depth === 1 ? 'domain' : 'entity');
    const radius =
      depth === 1
        ? Math.max(9, min * 0.015)
        : depth === 2
          ? Math.max(5.6, min * 0.0095)
          : Math.max(3.8, min * 0.0068);

    const node = addNode({
      id,
      label: branch.label,
      kind,
      x: point.x,
      y: point.y,
      radius,
      meta: branch.meta ?? (depth === 1 ? 'Domain node' : depth === 2 ? 'Entity node' : 'Detail node'),
      description:
        branch.description ??
        `${branch.label} is linked into the SPIL Intelligence company brain and can connect to people, work, documents, customers, and workflows.`,
      status: branch.status,
      details: [
        { label: 'Parent', value: parent.label },
        { label: 'Depth', value: String(depth + 1) },
        { label: 'Node Type', value: kind },
      ],
    });

    nodeById.set(id, node);
    links.push(connect(parent.id, id, depth === 1 ? 0.5 : depth === 2 ? 0.32 : 0.2));

    if (depth === 1) {
      domainIds.set(`${parentKey}:${slug(branch.label)}`, id);
    }

    branch.children?.forEach((child, childIndex) => {
      addBranch(node, child, id, childIndex, branch.children?.length ?? 1, angle, depth + 1);
    });
  };

  companyDepartments.forEach((department, index) => {
    const angle = -Math.PI / 2 + (index / companyDepartments.length) * Math.PI * 2;
    const point = polarPoint(cx, cy, departmentRadius, angle);
    const departmentNode = addNode({
      id: department.id,
      label: department.label,
      kind: 'department',
      x: point.x,
      y: point.y,
      radius: Math.max(14, min * 0.022),
      meta: department.meta,
      description: department.description,
      details: [
        { label: 'Department', value: department.label },
        { label: 'Domains', value: String(department.domains.length) },
        { label: 'Connected To', value: 'SPIL INTELLIGENCE' },
      ],
    });

    nodeById.set(department.id, departmentNode);
    links.push(connect(root.id, department.id, 0.78));

    department.domains.forEach((domain, domainIndex) => {
      addBranch(
        departmentNode,
        domain,
        department.id,
        domainIndex,
        department.domains.length,
        angle,
        1
      );
    });
  });

  const workflowCenter = polarPoint(cx, cy, Math.max(100, min * 0.18), Math.PI * 0.5);
  const workflowNodes: GraphNode[] = [
    {
      id: 'workflow-customer-bug-loop',
      label: 'Customer Bug Loop',
      kind: 'workflow',
      x: workflowCenter.x - 115,
      y: workflowCenter.y,
      radius: Math.max(10, min * 0.015),
      meta: 'Customer -> Support -> Dev -> QA -> Deploy -> Review',
      description:
        'End-to-end bug lifecycle from customer signal to support triage, technical work, QA validation, deployment, and customer care review.',
    },
    {
      id: 'workflow-feature-loop',
      label: 'Feature Delivery Loop',
      kind: 'workflow',
      x: workflowCenter.x + 105,
      y: workflowCenter.y + 18,
      radius: Math.max(9, min * 0.014),
      meta: 'BA -> PM -> Dev -> QA -> Marketing',
      description:
        'A feature request travels from business analysis through engineering, testing, release notes, and market communication.',
    },
    {
      id: 'workflow-renewal-loop',
      label: 'Renewal Risk Loop',
      kind: 'workflow',
      x: workflowCenter.x,
      y: workflowCenter.y + 92,
      radius: Math.max(8.5, min * 0.013),
      meta: 'CRM -> Support -> Finance -> Marketing',
      description:
        'License renewal health combines account activity, support pressure, billing, product usage, and customer satisfaction.',
    },
  ];

  workflowNodes.forEach((node) => {
    addNode({
      ...node,
      details: [
        { label: 'Workflow', value: node.label },
        { label: 'Purpose', value: node.meta ?? 'Company process' },
      ],
    });
    nodeById.set(node.id, node);
    links.push(connect(root.id, node.id, 0.56));
  });

  const byDomain = (department: string, label: string) => domainIds.get(`${department}:${slug(label)}`);
  const connectDomains = (source: string | undefined, target: string | undefined, strength = 0.25) => {
    if (source && target) links.push(connect(source, target, strength));
  };

  const customerBugFlow = [
    byDomain('crm', 'Customers'),
    byDomain('support', 'Customer Bugs'),
    byDomain('support', 'Ticket Triage'),
    byDomain('ba', 'Requirements'),
    byDomain('dev', 'Feature Tasks'),
    byDomain('opti', 'Known Edge Cases'),
    byDomain('qa', 'Regression Tests'),
    byDomain('dev', 'Deployments'),
    byDomain('support', 'Customer Reviews'),
    byDomain('crm', 'Account Health'),
  ];

  customerBugFlow.forEach((nodeId, index) => {
    connectDomains(nodeId, customerBugFlow[index + 1], 0.42);
    connectDomains('workflow-customer-bug-loop', nodeId, 0.2);
  });

  const featureFlow = [
    byDomain('marketing', 'Market Signals'),
    byDomain('ba', 'Discovery Calls'),
    byDomain('ba', 'Requirements'),
    byDomain('opti', 'Research Lab'),
    byDomain('dev', 'Feature Tasks'),
    byDomain('qa', 'Test Cases'),
    byDomain('dev', 'Deployments'),
    byDomain('marketing', 'Content Library'),
  ];

  featureFlow.forEach((nodeId, index) => {
    connectDomains(nodeId, featureFlow[index + 1], 0.34);
    connectDomains('workflow-feature-loop', nodeId, 0.18);
  });

  const renewalFlow = [
    byDomain('crm', 'Licenses'),
    byDomain('crm', 'Account Health'),
    byDomain('support', 'Maintenance Contracts'),
    byDomain('finance', 'Revenue Streams'),
    byDomain('finance', 'Forecasts'),
    byDomain('marketing', 'Reviews & Proof'),
  ];

  renewalFlow.forEach((nodeId, index) => {
    connectDomains(nodeId, renewalFlow[index + 1], 0.32);
    connectDomains('workflow-renewal-loop', nodeId, 0.18);
  });

  [
    ['hr', 'Employees', 'dev', 'Feature Tasks'],
    ['hr', 'Employees', 'qa', 'Release Signoff'],
    ['hr', 'Payroll & Cost', 'finance', 'Costs'],
    ['tools', 'Monitoring', 'support', 'Ticket Triage'],
    ['tools', 'Integrations', 'crm', 'Customer Timeline'],
    ['broker', 'Deal Pipeline', 'finance', 'Revenue Streams'],
    ['broker', 'Market Prices', 'marketing', 'Market Signals'],
    ['opti', 'Algorithms', 'dev', 'Repositories'],
    ['opti', 'Architecture Decisions', 'ba', 'Product Scope'],
    ['qa', 'Defect History', 'support', 'Knowledge Base'],
    ['marketing', 'Customer Segments', 'crm', 'Customers'],
  ].forEach(([aDept, aDomain, bDept, bDomain]) => {
    connectDomains(byDomain(aDept, aDomain), byDomain(bDept, bDomain), 0.22);
  });

  return { nodes, links };
}

export function useNeuralGraphData(width: number, height: number) {
  const graph = useMemo(() => buildCompanyBrainGraph(width, height), [width, height]);
  const departmentCount = companyDepartments.length;
  const workflowCount = graph.nodes.filter((node) => node.kind === 'workflow').length;
  const peopleCount = graph.nodes.filter((node) => node.kind === 'person').length;

  return {
    graph,
    isLoading: false,
    counts: {
      departments: departmentCount,
      people: peopleCount,
      workflows: workflowCount,
      links: graph.links.length,
    },
  };
}
