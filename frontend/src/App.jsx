import { useEffect, useState } from 'react'
import { apiGet, apiPost } from './api'
import './App.css'

const RECENT_KEY = 'factory-maintenance-investigations'

function localDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function readRecentInvestigations() {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function StatusDot({ state }) {
  return <span className={`status-dot status-dot--${state}`} aria-hidden="true" />
}

function DashboardHeader({ backendStatus }) {
  const systemLabel = backendStatus === 'connected' ? 'SYSTEM ONLINE' : backendStatus === 'checking' ? 'SYSTEM CHECKING' : 'SYSTEM OFFLINE'
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <div>
          <p className="brand-name">Smart Factory</p>
          <p className="brand-product">Maintenance Agent</p>
        </div>
        <p className="topbar__subtitle">AI-powered maintenance investigation with persistent memory</p>
      </div>
      <div className={`system-indicator system-indicator--${backendStatus}`} role="status"><StatusDot state={backendStatus} />{systemLabel}</div>
    </header>
  )
}

function SystemStatus({ hindsightStatus, llmStatus, agentStatus }) {
  const statuses = [
    {
      title: 'Hindsight Memory',
      state: hindsightStatus,
      value: hindsightStatus === 'connected' ? 'Connected' : hindsightStatus === 'loading' ? 'Recalling' : hindsightStatus === 'unavailable' ? 'Unavailable' : 'Awaiting recall',
      detail: 'Persistent maintenance experience',
      featured: true,
    },
    {
      title: 'AI Reasoning',
      state: llmStatus,
      value: llmStatus === 'connected' ? 'Connected' : llmStatus === 'unavailable' ? 'Temporarily Unavailable' : 'Awaiting investigation',
      detail: 'Groq status from the latest request',
    },
    {
      title: 'Maintenance Agent',
      state: agentStatus,
      value: agentStatus === 'ready' ? 'Ready' : agentStatus === 'processing' ? 'Processing' : agentStatus === 'error' ? 'Error' : 'Checking',
      detail: 'Technician-led fault investigation',
    },
  ]

  return (
    <section className="system-status" aria-label="System status">
      {statuses.map((status) => (
        <article className={`status-card${status.featured ? ' status-card--memory' : ''}`} key={status.title}>
          <div className="status-card__topline"><span>{status.title}</span><StatusDot state={status.state} /></div>
          <strong className={`status-card__value status-card__value--${status.state}`}>{status.value}</strong>
          <p>{status.detail}</p>
        </article>
      ))}
    </section>
  )
}

function Sidebar({ backendStatus, hindsightStatus, llmStatus }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__section-label">WORKSPACE</div>
      <div className="sidebar__nav-item sidebar__nav-item--active">
        <span className="nav-indicator" />
        <span>Fault investigation</span>
      </div>
      <div className="sidebar__divider" />
      <div className="sidebar__section-label">CONNECTED SYSTEMS</div>
      <div className="system-card">
        <div className="system-card__icon system-card__icon--memory" aria-hidden="true">H</div>
        <div className="system-card__copy"><span>Hindsight memory</span><small>{hindsightStatus === 'connected' ? 'Recall available' : 'Used during investigation'}</small></div>
        <StatusDot state={hindsightStatus} />
      </div>
      <div className="system-card">
        <div className="system-card__icon system-card__icon--ai" aria-hidden="true">G</div>
        <div className="system-card__copy"><span>Groq reasoning</span><small>{llmStatus === 'connected' ? 'Response available' : 'Status from last request'}</small></div>
        <StatusDot state={llmStatus} />
      </div>
      <div className="sidebar__bottom">
        <div className="backend-label"><StatusDot state={backendStatus} />API CONNECTION</div>
        <div className="backend-address">Maintenance API</div>
        <div className="sidebar__fineprint">Maintenance context stays grounded in recorded experience.</div>
      </div>
    </aside>
  )
}

function PanelHeading({ eyebrow, title, description, trailing, headingId }) {
  return (
    <div className="panel-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={headingId}>{title}</h2>
        {description && <p className="panel-description">{description}</p>}
      </div>
      {trailing && <div className="panel-heading__trailing">{trailing}</div>}
    </div>
  )
}

function InvestigationForm({ form, onChange, onSubmit, loading, loadingMessage }) {
  return (
    <section className="panel form-panel" aria-labelledby="form-heading">
      <PanelHeading headingId="form-heading" eyebrow="NEW INVESTIGATION" title="Current machine fault" description="Describe the fault to retrieve relevant maintenance experience." trailing={<span className="step-number">01</span>} />
      <form className="investigation-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Machine ID <span className="required-mark">*</span></span>
          <input name="machineId" value={form.machineId} onChange={onChange} placeholder="e.g. M-101" maxLength={100} required />
        </label>
        <label className="field">
          <span>Fault <span className="required-mark">*</span></span>
          <input name="fault" value={form.fault} onChange={onChange} placeholder="e.g. Overheating" maxLength={200} required />
        </label>
        <label className="field field--full">
          <span>Symptoms <span className="required-mark">*</span></span>
          <textarea name="symptoms" value={form.symptoms} onChange={onChange} placeholder="What is the machine doing?" rows={3} maxLength={1000} required />
        </label>
        <label className="field">
          <span>Incident date</span>
          <input name="incidentDate" type="date" value={form.incidentDate} onChange={onChange} />
        </label>
        <label className="field field--full">
          <span>Technician observation</span>
          <textarea name="technicianObservation" value={form.technicianObservation} onChange={onChange} placeholder="Conditions or patterns you noticed" rows={2} maxLength={700} />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" aria-hidden="true" />{loadingMessage}</> : <><span className="button-arrow" aria-hidden="true">↗</span>Investigate fault</>}
        </button>
        <p className="form-footnote">Investigation support only. Machine operation remains with the technician.</p>
      </form>
    </section>
  )
}

function MemoryCard({ memory, index }) {
  const metadata = memory.metadata || {}
  const machineId = metadata.machineId || memory.machineId
  const fault = metadata.fault || memory.fault
  const date = memory.occurredStart || memory.occurred_start
  const text = memory.text || memory.fact || ''

  return (
    <article className="memory-card">
      <div className="memory-card__topline">
        <span className="memory-card__index">{String(index + 1).padStart(2, '0')}</span>
        <div className="memory-card__tags">
          {machineId && <span className="data-tag data-tag--machine">{machineId}</span>}
          {fault && <span className="data-tag">{fault}</span>}
          {!machineId && !fault && memory.type && <span className="data-tag">{memory.type}</span>}
        </div>
        {date && <time className="memory-card__date" dateTime={date}>{new Date(date).toLocaleDateString()}</time>}
      </div>
      {text && <p className="memory-card__text">{text}</p>}
      <div className="memory-card__footer">
        {memory.context && <span>{memory.context}</span>}
        {Array.isArray(memory.tags) && memory.tags.length > 0 && <span>{memory.tags.join(' · ')}</span>}
      </div>
    </article>
  )
}

function MemoryPanel({ memories, status, attempted }) {
  return (
    <section className="panel memory-panel" aria-labelledby="memory-heading">
      <PanelHeading headingId="memory-heading" eyebrow={<><span className="memory-glyph" aria-hidden="true">✳</span> PERSISTENT EXPERIENCE</>} title="Memory recall" description="Previous maintenance experience retrieved from Hindsight" trailing={<span className="source-badge"><span className="source-badge__dot" />RECALLED FROM HINDSIGHT</span>} />
      {status === 'loading' ? (
        <div className="memory-loading" role="status"><span className="spinner spinner--small" />Recalling maintenance experience…</div>
      ) : memories.length > 0 ? (
        <div className="memory-list" aria-live="polite">
          {memories.map((memory, index) => <MemoryCard key={memory.id || `${index}-${memory.text}`} memory={memory} index={index} />)}
        </div>
      ) : status === 'unavailable' ? (
        <div className="memory-state memory-state--error" role="status"><span className="state-marker" aria-hidden="true">!</span><div><strong>Historical memory unavailable</strong><p>Hindsight could not return maintenance context for this investigation.</p></div></div>
      ) : attempted ? (
        <div className="memory-state"><span className="state-marker state-marker--quiet" aria-hidden="true">—</span><div><strong>No relevant historical maintenance memory was found.</strong><p>Hindsight was queried for this machine and fault.</p></div></div>
      ) : (
        <div className="memory-empty"><div className="memory-empty__symbol" aria-hidden="true">H</div><p>Investigate a machine fault to retrieve relevant maintenance experience.</p><span>Previous repairs and technician observations will appear here.</span></div>
      )}
    </section>
  )
}

function InvestigationResult({ investigation, incident, llmStatus, hindsightStatus, message }) {
  if (!investigation && llmStatus !== 'unavailable') return null

  return (
    <section className="panel assessment-panel" aria-labelledby="assessment-heading" aria-live="polite">
      <PanelHeading headingId="assessment-heading" eyebrow="INVESTIGATION OUTPUT" title="AI investigation" description={incident ? `${incident.machineId} · ${incident.fault}` : 'Current machine fault'} trailing={<span className={`assessment-state assessment-state--${llmStatus}`}>{llmStatus === 'connected' ? 'GROQ RESPONSE' : 'AI REASONING UNAVAILABLE'}</span>} />
      {investigation ? (
        <div className="assessment-content">
          <div className="assessment-lead"><span className="assessment-label">SUMMARY</span><p>{investigation.summary}</p></div>
          <div className="historical-connection"><div className="historical-connection__label"><span aria-hidden="true">↳</span> HISTORICAL CONNECTION</div><p>{investigation.historicalConnection}</p></div>
          <div className="assessment-columns">
            <div className="assessment-block">
              <h3>Recommended checks</h3>
              {Array.isArray(investigation.recommendedChecks) && investigation.recommendedChecks.length > 0 ? <ol className="checks-list">{investigation.recommendedChecks.map((check, index) => <li key={`${index}-${check}`}><span>{String(index + 1).padStart(2, '0')}</span>{check}</li>)}</ol> : <p className="muted-copy">Groq returned no recommended checks.</p>}
            </div>
            <div className="assessment-block assessment-block--reasoning"><h3>Reasoning</h3><p>{investigation.reasoning}</p></div>
          </div>
        </div>
      ) : (
        <div className="llm-error" role="alert"><span className="state-marker" aria-hidden="true">!</span><div><strong>AI reasoning is temporarily unavailable.</strong><p>{message}</p><p>{hindsightStatus === 'connected' ? 'Hindsight memory is still connected. Historical facts above were retrieved separately; no AI response is being shown.' : 'Hindsight memory could not be confirmed for this investigation. No AI response is being shown.'}</p></div></div>
      )}
    </section>
  )
}

function MemoryFlow() {
  const steps = ['Current fault', 'Hindsight memory', 'Past maintenance experience', 'AI reasoning', 'Investigation guidance']

  return (
    <section className="panel flow-panel" aria-label="Investigation flow">
      <div className="flow-heading"><span className="eyebrow">CONTEXT TO GUIDANCE</span><span className="flow-heading__note">Memory grounds each investigation</span></div>
      <ol className="flow-steps">
        {steps.map((step, index) => (
          <li className={`flow-step${index === 1 ? ' flow-step--memory' : ''}`} key={step}>
            <span className="flow-step__number">0{index + 1}</span><strong>{step}</strong>
          </li>
        ))}
      </ol>
    </section>
  )
}

function LearningExplanation() {
  return (
    <section className="panel learning-panel" aria-labelledby="learning-heading">
      <PanelHeading headingId="learning-heading" eyebrow="MEMORY LOOP" title="How the agent learns" />
      <div className="learning-steps">
        <div className="learning-step"><span className="learning-step__number">INTERACTION 1</span><strong>Generic maintenance context</strong><p>Guidance starts with the current fault and available context.</p></div>
        <span className="learning-arrow" aria-hidden="true">→</span>
        <div className="learning-step learning-step--memory"><span className="learning-step__number">INTERACTION 5</span><strong>Recurring problems recognized</strong><p>Relevant recorded incidents can reveal recurring machine faults.</p></div>
        <span className="learning-arrow" aria-hidden="true">→</span>
        <div className="learning-step"><span className="learning-step__number">INTERACTION 20</span><strong>More contextual investigation</strong><p>Accumulated experience can inform later troubleshooting.</p></div>
      </div>
      <p className="learning-note">Recorded incidents and repair outcomes can become future Hindsight memory. Technicians remain responsible for diagnosis and machine operation.</p>
    </section>
  )
}

function RecentInvestigations({ items }) {
  return (
    <section className="panel recent-panel" aria-labelledby="recent-heading">
      <PanelHeading headingId="recent-heading" eyebrow="RECENT ACTIVITY" title="Recent investigations" description="Stored in this browser only; not Hindsight memory" trailing={<span className="local-badge">LOCAL ONLY</span>} />
      {items.length === 0 ? <p className="recent-empty">Completed investigation attempts will appear here.</p> : (
        <ul className="recent-list">
          {items.map((item) => <li key={item.id} className="recent-item"><span className={`recent-item__status recent-item__status--${item.status}`} aria-hidden="true" /><div className="recent-item__main"><strong>{item.machineId} <span>{item.fault}</span></strong><time dateTime={item.at}>{new Date(item.at).toLocaleString()}</time></div><span className="recent-item__result">{item.label}</span></li>)}
        </ul>
      )}
    </section>
  )
}

function App() {
  const [form, setForm] = useState({ machineId: 'M-101', fault: 'Overheating', symptoms: 'Temperature rising above normal during long operating cycles', incidentDate: localDate(), technicianObservation: 'Machine overheats after extended operation.' })
  const [backendStatus, setBackendStatus] = useState('checking')
  const [hindsightStatus, setHindsightStatus] = useState('idle')
  const [llmStatus, setLlmStatus] = useState('idle')
  const [memories, setMemories] = useState([])
  const [investigation, setInvestigation] = useState(null)
  const [investigatedIncident, setInvestigatedIncident] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Recalling maintenance experience…')
  const [attempted, setAttempted] = useState(false)
  const [recent, setRecent] = useState(readRecentInvestigations)

  useEffect(() => {
    let cancelled = false
    const checkBackend = async () => {
      try {
        await apiGet('/health')
        if (!cancelled) setBackendStatus('connected')
      } catch {
        if (!cancelled) setBackendStatus('unavailable')
      }
    }
    checkBackend()
    const interval = window.setInterval(checkBackend, 30000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  function onChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function saveRecent(status, label) {
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, machineId: form.machineId.trim(), fault: form.fault.trim(), at: new Date().toISOString(), status, label }
    setRecent((current) => {
      const next = [entry, ...current].slice(0, 6)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        // The current session remains usable if browser storage is unavailable.
      }
      return next
    })
  }

  async function onSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setAttempted(true)
    setLoadingMessage('Recalling maintenance experience…')
    setMemories([])
    setInvestigation(null)
    setErrorMessage('')
    setHindsightStatus('loading')
    setLlmStatus('idle')

    const incident = {
      machineId: form.machineId.trim(),
      fault: form.fault.trim(),
      symptoms: [form.symptoms.trim(), form.incidentDate && `Incident date: ${form.incidentDate}`, form.technicianObservation.trim() && `Technician observation: ${form.technicianObservation.trim()}`].filter(Boolean).join('\n'),
    }
    setInvestigatedIncident({ ...incident, displaySymptoms: form.symptoms.trim(), incidentDate: form.incidentDate, technicianObservation: form.technicianObservation.trim() })

    try {
      const response = await apiPost('/maintenance/investigate', incident)
      const data = response.data || {}
      const historical = Array.isArray(data.historicalContext) ? data.historicalContext : []
      setMemories(historical)
      setHindsightStatus('connected')
      setInvestigation(data.investigation || null)

      if (data.llm?.status === 'configured' && data.llm?.provider === 'groq' && data.investigation) {
        setLlmStatus('connected')
        saveRecent('complete', 'Groq response')
      } else {
        setLlmStatus('unavailable')
        setErrorMessage('The investigation response did not include a confirmed Groq result.')
        saveRecent('unavailable', 'AI response unavailable')
      }
    } catch (error) {
      const details = error.payload || {}
      const isGroqError = Boolean(details.providerStatus) || /groq/i.test(details.error || '')
      if (isGroqError) {
        setLlmStatus('unavailable')
        setErrorMessage(details.error || 'The Groq investigation request failed.')
        setLoadingMessage('Retrieving Hindsight memory…')

        try {
          const recall = await apiPost('/memory/recall', {
            query: `Maintenance history for machine ${incident.machineId}. Current fault: ${incident.fault}. Symptoms: ${incident.symptoms.slice(0, 1200)}`,
            machineId: incident.machineId,
          })
          const recalledFacts = Array.isArray(recall.data?.results) ? recall.data.results : []
          setMemories(recalledFacts)
          setHindsightStatus('connected')
          saveRecent('unavailable', 'Memory retrieved · AI unavailable')
        } catch (recallError) {
          setHindsightStatus('unavailable')
          setErrorMessage(`${details.error || 'AI reasoning is unavailable.'} Hindsight could not retrieve memory: ${recallError.message}`)
          saveRecent('error', 'Memory unavailable')
        }
      } else {
        setLlmStatus('idle')
        if (error.status === 400) {
          setErrorMessage(error.message)
        } else if (error.status) {
          setErrorMessage(error.message || 'The investigation request failed.')
        } else {
          setBackendStatus('unavailable')
          setHindsightStatus('idle')
          setErrorMessage('Backend unavailable. Please check that the maintenance server is running.')
        }
        if (/hindsight/i.test(details.error || '')) setHindsightStatus('unavailable')
        saveRecent('error', error.status === 400 ? 'Validation error' : 'Investigation failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const agentStatus = loading
    ? 'processing'
    : backendStatus === 'unavailable' || hindsightStatus === 'unavailable' || errorMessage
      ? 'error'
      : backendStatus === 'connected' ? 'ready' : 'checking'

  return (
    <div className="app-shell">
      <Sidebar backendStatus={backendStatus} hindsightStatus={hindsightStatus} llmStatus={llmStatus} />
      <div className="main-shell">
        <DashboardHeader backendStatus={backendStatus} />
        <main className="workspace">
          <div className="page-intro">
            <div>
              <p className="eyebrow">MAINTENANCE OPERATIONS <span className="intro-separator">/</span> FAULT INVESTIGATION</p>
              <h1>Investigate a machine fault</h1>
              <p className="page-subtitle">Investigate today&apos;s fault with relevant experience recalled from previous maintenance.</p>
            </div>
            <div className="shift-indicator"><span className="shift-indicator__line" /><span>TECHNICIAN WORKSPACE</span></div>
          </div>

          <SystemStatus hindsightStatus={hindsightStatus} llmStatus={llmStatus} agentStatus={agentStatus} />

          {errorMessage && !loading && llmStatus !== 'unavailable' && <div className="notice notice--error" role="alert"><span className="notice__symbol" aria-hidden="true">!</span><span>{errorMessage}</span></div>}

          <div className="primary-grid">
            <InvestigationForm form={form} onChange={onChange} onSubmit={onSubmit} loading={loading} loadingMessage={loadingMessage} />
            <MemoryPanel memories={memories} status={loading ? 'loading' : hindsightStatus} attempted={attempted} />
          </div>

          <InvestigationResult investigation={investigation} incident={investigatedIncident} llmStatus={llmStatus} hindsightStatus={hindsightStatus} message={errorMessage} />

          <MemoryFlow />
          <div className="secondary-grid"><LearningExplanation /><RecentInvestigations items={recent} /></div>
          <footer className="workspace-footer"><span>SMART FACTORY MAINTENANCE AGENT</span><span>HINDSIGHT MEMORY · TECHNICIAN-LED INVESTIGATION</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
