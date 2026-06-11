import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { APP_NAME, WORKSPACE_NAME, USER_NAME, USER_ROLE } from '../lib/constants';

export function Settings() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Settings</h1>

      <Card>
        <h3 className="mb-4 font-semibold text-primary">Workspace</h3>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Platform</dt>
            <dd className="text-primary">{APP_NAME}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Active Layer</dt>
            <dd><Badge variant="neural">{WORKSPACE_NAME}</Badge></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Phase</dt>
            <dd className="text-secondary">Phase 1 — Internal Engineering</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold text-primary">Profile</h3>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Name</dt>
            <dd className="text-primary">{USER_NAME}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Role</dt>
            <dd className="text-secondary">{USER_ROLE}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold text-primary">AI Configuration</h3>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Model</dt>
            <dd className="font-mono text-neural">claude-sonnet-4-20250514</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Context Injection</dt>
            <dd className="text-secondary">Per workspace module</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Streaming</dt>
            <dd><Badge variant="active">Enabled</Badge></dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold text-primary">Coming in Future Phases</h3>
        <p className="text-sm text-muted">
          CRM, Finance, HR, Brokerage, and Support modules are architected for future layers
          but not included in SPIL Opti Phase 1.
        </p>
      </Card>
    </div>
  );
}
