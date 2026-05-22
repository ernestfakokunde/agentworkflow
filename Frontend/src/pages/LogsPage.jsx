import { MemoryPanel } from '../components/MemoryPanel'
import { ProofsPanel } from '../components/ProofsPanel'
import { ReputationPanel } from '../components/ReputationPanel'
import { WorkflowTimeline } from '../components/WorkflowTimeline'

export function LogsPage({ workflow }) {
  return (
    <section className="page-grid" aria-label="Aether logs">
      <div className="page-heading">
        <span className="section-kicker">Audit Vault</span>
        <h1>Audit Logs</h1>
        <p>Execution history, Walrus artifacts, and onchain trust signals.</p>
      </div>
      <WorkflowTimeline events={workflow.workflowEvents} />
      <ProofsPanel proofs={workflow.proofs} />
      <ReputationPanel events={workflow.reputationEvents} />
      <MemoryPanel records={workflow.memoryRecords} />
    </section>
  )
}
