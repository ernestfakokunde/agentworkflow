import { MemoryPanel } from '../components/MemoryPanel'
import { TaskComposer } from '../components/TaskComposer'
import { WorkflowTimeline } from '../components/WorkflowTimeline'

export function CreateTaskPage({ workflow, onCompleted }) {
  return (
    <section className="page-grid" aria-label="Deposit to AetherFi vault">
      <div className="page-heading">
        <span className="section-kicker" style={{ color: 'var(--amber)', fontFamily: 'var(--pixel)', fontSize: '1.2rem'}}>Vault Launch</span>
        <h1 style={{ fontFamily: 'var(--pixel)', color: 'var(--cyan)' }}>Deposit & Rebalance</h1>
        <p>Deposit funds and instruct the Yield Agents on your risk profile and targets.</p>
      </div>
      <TaskComposer
        error={workflow.error}
        isRunning={workflow.isRunning}
        latestTask={workflow.task}
        onCompleted={onCompleted}
        onLaunch={workflow.launchWorkflow}
      />
      <WorkflowTimeline events={workflow.workflowEvents} />
      <MemoryPanel records={workflow.memoryRecords} />
    </section>
  )
}
