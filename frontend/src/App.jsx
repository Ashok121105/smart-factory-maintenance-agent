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
        <div className="field-group-label field--full"><strong>Current machine condition</strong><span>SIMULATED / MANUAL INPUTS</span></div>
        <label className="field">
          <span>Temperature (°C)</span>
          <input name="temperatureC" type="number" step="any" value={form.temperatureC} onChange={onChange} placeholder="e.g. 86" />
        </label>
        <label className="field">
          <span>Vibration (mm/s)</span>
          <input name="vibrationMmS" type="number" step="any" value={form.vibrationMmS} onChange={onChange} placeholder="e.g. 7.1" />
        </label>
        <label className="field">
          <span>Current (A)</span>
          <input name="currentA" type="number" step="any" value={form.currentA} onChange={onChange} placeholder="e.g. 12.0" />
        </label>
        <label className="field">
          <span>Voltage (V)</span>
          <input name="voltageV" type="number" step="any" value={form.voltageV} onChange={onChange} placeholder="Optional" />
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

function getMemoryEvidence(memories) {
  const evidenceTypes = [
    {
      label: 'Previous root cause',
      matches: (text) => /(?:confirmed|identified|determined).{0,60}root cause|root cause.{0,60}(?:confirmed|identified|determined|was|is)/i.test(text),
      missing: 'No returned memory explicitly states a confirmed root cause.',
    },
    {
      label: 'Previous action',
      matches: (text) => /\b(replaced|repaired|adjusted|cleaned|lubricated|aligned|maintenance action|repair performed)\b/i.test(text),
      missing: 'No returned memory explicitly records a maintenance action.',
    },
    {
      label: 'Previous result',
      matches: (text) => /\b(returned to normal|restored normal|resolved|resolution|returned.*normal operation)\b/i.test(text),
      missing: 'No returned memory explicitly records a resolution result.',
    },
  ]

  return evidenceTypes.map((evidence) => {
    const record = memories.find((memory) => evidence.matches(memory.text || memory.fact || ''))
    return { label: evidence.label, text: record?.text || record?.fact || evidence.missing }
  })
}

function MemoryPanel({ memories, status, attempted }) {
  const memoryBadge = status === 'loading'
    ? 'QUERYING HINDSIGHT'
    : status === 'unavailable'
      ? 'HINDSIGHT UNAVAILABLE'
      : memories.length > 0
        ? `${memories.length} HINDSIGHT RESULTS`
        : attempted
          ? 'NO RELEVANT MEMORY'
          : 'PERSISTENT EXPERIENCE'

  return (
    <section className="panel memory-panel" aria-labelledby="memory-heading">
      <PanelHeading headingId="memory-heading" eyebrow={<><span className="memory-glyph" aria-hidden="true">✳</span> PERSISTENT EXPERIENCE</>} title="Hindsight memory" description="Actual maintenance records returned for this investigation" trailing={<span className="source-badge"><span className="source-badge__dot" />{memoryBadge}</span>} />
      {status === 'loading' ? (
        <div className="memory-loading" role="status"><span className="spinner spinner--small" />Recalling maintenance experience…</div>
      ) : memories.length > 0 ? (
        <div aria-live="polite">
          <div className="memory-result-count"><strong>{memories.length} relevant {memories.length === 1 ? 'memory' : 'memories'} returned</strong><span>Evidence below is taken from the Hindsight response.</span></div>
          <div className="memory-evidence-list">
            {getMemoryEvidence(memories).map((evidence) => <div className="memory-evidence" key={evidence.label}><strong>{evidence.label}</strong><p>{evidence.text}</p></div>)}
          </div>
          <h3 className="memory-records-heading">Previous maintenance experience</h3>
          <div className="memory-list">
            {memories.map((memory, index) => <MemoryCard key={memory.id || `${index}-${memory.text}`} memory={memory} index={index} />)}
          </div>
        </div>
      ) : status === 'unavailable' ? (
        <div className="memory-state memory-state--error" role="status"><span className="state-marker" aria-hidden="true">!</span><div><strong>Historical memory unavailable</strong><p>Hindsight could not return maintenance context for this investigation.</p></div></div>
      ) : attempted ? (
        <div className="memory-state"><span className="state-marker state-marker--quiet" aria-hidden="true">0</span><div><strong>No relevant previous experience found.</strong><p>Hindsight returned 0 relevant memories for this investigation.</p></div></div>
      ) : (
        <div className="memory-empty"><div className="memory-empty__symbol" aria-hidden="true">H</div><p>Investigate a machine fault to retrieve relevant maintenance experience.</p><span>Previous repairs and technician observations will appear here.</span></div>
      )}
    </section>
  )
}

function CurrentCondition({ incident }) {
  if (!incident) return null

  const readings = [
    { label: 'Temperature', value: incident.temperatureC, unit: '°C' },
    { label: 'Vibration', value: incident.vibrationMmS, unit: 'mm/s' },
    { label: 'Current', value: incident.currentA, unit: 'A' },
    { label: 'Voltage', value: incident.voltageV, unit: 'V' },
  ]

  return (
    <section className="condition-summary" aria-labelledby="condition-summary-heading">
      <div className="condition-summary__heading">
        <div><p className="eyebrow">OBSERVE</p><h2 id="condition-summary-heading">Current machine condition</h2></div>
        <span className="condition-summary__source">SIMULATED / MANUAL MACHINE READINGS</span>
      </div>
      <div className="condition-summary__identity"><span><small>MACHINE ID</small><strong>{incident.machineId}</strong></span><span><small>FAULT / CONDITION</small><strong>{incident.fault}</strong></span></div>
      <dl className="condition-readings">
        {readings.map((reading) => <div className="condition-reading" key={reading.label}><dt>{reading.label}</dt><dd>{reading.value !== undefined ? `${reading.value} ${reading.unit}` : 'Not provided'}</dd></div>)}
      </dl>
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
              <h3>Observed conditions</h3>
              {investigation.observedAbnormalConditions?.length ? <ul className="detail-list">{investigation.observedAbnormalConditions.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="muted-copy">Based on the machine-condition data provided.</p>}
              <h3 className="detail-list-heading">Possible causes · inspection required</h3>
              {investigation.possibleCauses?.length ? <ul className="detail-list">{investigation.possibleCauses.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="muted-copy">No possible causes were returned.</p>}
            </div>
            <div className="assessment-block">
              <h3>Recommended checks</h3>
              {Array.isArray(investigation.recommendedChecks) && investigation.recommendedChecks.length > 0 ? <ol className="checks-list">{investigation.recommendedChecks.map((check, index) => <li key={`${index}-${check}`}><span>{String(index + 1).padStart(2, '0')}</span>{check}</li>)}</ol> : <p className="muted-copy">Groq returned no recommended checks.</p>}
              <h3 className="detail-list-heading">Safety considerations</h3>
              {investigation.safetyConsiderations?.length ? <ul className="detail-list">{investigation.safetyConsiderations.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="muted-copy">Follow site procedures and equipment-specific safety controls.</p>}
            </div>
          </div>
          <div className="assessment-block assessment-block--reasoning"><h3>AI reasoning</h3><p>{investigation.reasoning}</p></div>
          <div className="confidence-note"><strong>Confidence &amp; uncertainty</strong><span>{investigation.confidenceNote}</span></div>
        </div>
      ) : (
        <div className="llm-error" role="alert"><span className="state-marker" aria-hidden="true">!</span><div><strong>AI reasoning is temporarily unavailable.</strong><p>{message}</p><p>{hindsightStatus === 'connected' ? 'Hindsight memory is still connected. Historical facts above were retrieved separately; no AI response is being shown.' : 'Hindsight memory could not be confirmed for this investigation. No AI response is being shown.'}</p></div></div>
      )}
    </section>
  )
}

function MemoryFlow() {
  const steps = [
    { label: 'OBSERVE', detail: 'Machine condition' },
    { label: 'RECALL', detail: 'Hindsight memory' },
    { label: 'REASON', detail: 'Groq guidance' },
    { label: 'ACT', detail: 'Technician investigation' },
    { label: 'LEARN', detail: 'Recorded outcome' },
  ]

  return (
    <section className="panel flow-panel" aria-label="Investigation flow">
      <div className="flow-heading"><span className="eyebrow">OBSERVE → RECALL → REASON → ACT → LEARN</span><span className="flow-heading__note">Verified outcomes inform future investigations</span></div>
      <ol className="flow-steps">
        {steps.map((step, index) => (
          <li className={`flow-step${index === 1 ? ' flow-step--memory' : ''}`} key={step.label}>
            <span className="flow-step__number">0{index + 1}</span><strong>{step.label}</strong><span className="flow-step__detail">{step.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function LearningExplanation() {
  return (
    <section className="panel learning-panel" aria-labelledby="learning-heading">
      <PanelHeading headingId="learning-heading" eyebrow="OBSERVE → RECALL → REASON → ACT → LEARN" title="A maintenance agent that remembers" />
      <p className="learning-note learning-note--standalone">Each new investigation checks persistent Hindsight experience before Groq reasons over the current condition. Only technician-recorded outcomes are written back, so future fault investigations can use verified repair history.</p>
    </section>
  )
}

function MemoryComparison({ incident, memories }) {
  const condition = [
    incident.displaySymptoms,
    incident.temperatureC !== undefined && `Temperature ${incident.temperatureC} °C`,
    incident.vibrationMmS !== undefined && `Vibration ${incident.vibrationMmS} mm/s`,
    incident.currentA !== undefined && `Current ${incident.currentA} A`,
    incident.voltageV !== undefined && `Voltage ${incident.voltageV} V`,
  ].filter(Boolean).join(' · ')

  return (
    <section className="panel comparison-panel" aria-label="Memory impact comparison">
      <div className="comparison-heading"><p className="eyebrow">BEFORE / AFTER MEMORY DEMO</p><h2>Same machine condition, different context</h2></div>
      <div className="comparison-grid">
        <article className="comparison-side comparison-side--without">
          <span className="comparison-label">WITHOUT RELEVANT MEMORY</span>
          <p>{condition}</p>
          <strong>{memories.length ? 'Illustrative Counterfactual Baseline' : 'General investigation guidance'}</strong>
          <span>{memories.length ? 'Illustrative current-condition-only baseline; this was not a second AI run.' : 'No relevant previous maintenance experience was returned for this response.'}</span>
        </article>
        <article className="comparison-side comparison-side--with">
          <span className="comparison-label">WITH HINDSIGHT MEMORY</span>
          <p>{condition}</p>
          <strong>{memories.length ? `${memories.length} historical experience${memories.length === 1 ? '' : 's'} recalled` : 'No relevant experience recalled'}</strong>
          <span>{memories.length ? 'Groq received current condition data plus the recalled Hindsight context.' : 'The AI had current condition data only; no past experience is implied.'}</span>
        </article>
      </div>
    </section>
  )
}

function InvestigationOutcome({ incident, form, onChange, onSubmit, saving, saved, error }) {
  return (
    <section className="panel outcome-panel" aria-labelledby="outcome-heading">
      <PanelHeading headingId="outcome-heading" eyebrow="TECHNICIAN-RECORDED · OPTIONAL UNTIL RESOLVED" title="Investigation outcome" description="Record what inspection confirmed and what resolved the fault. Possible causes are not treated as confirmed." />
      <form className="outcome-form" onSubmit={onSubmit}>
        <label className="field"><span>Possible cause</span><input name="possibleCause" value={form.possibleCause} onChange={onChange} maxLength={500} placeholder="Unconfirmed suspicion, if any" /></label>
        <label className="field"><span>Confirmed root cause</span><input name="confirmedRootCause" value={form.confirmedRootCause} onChange={onChange} maxLength={500} placeholder="Only if technician-confirmed" /></label>
        <label className="field"><span>Maintenance action taken <span className="required-mark">*</span></span><input name="repairPerformed" value={form.repairPerformed} onChange={onChange} maxLength={1000} required placeholder="e.g. Replaced bearing" /></label>
        <label className="field"><span>Result / resolution <span className="required-mark">*</span></span><input name="repairOutcome" value={form.repairOutcome} onChange={onChange} maxLength={1000} required placeholder="e.g. Vibration returned to normal" /></label>
        <label className="field field--full"><span>Technician notes</span><textarea name="outcomeNotes" value={form.outcomeNotes} onChange={onChange} maxLength={1000} rows={2} placeholder="Inspection evidence, readings after repair, or unresolved concerns" /></label>
        {error && <div className="outcome-error" role="alert">{error}</div>}
        {saved && <div className="outcome-success" role="status"><strong>Experience Learned</strong><span>Saved to Hindsight Memory. This maintenance outcome can be recalled during future investigations.</span></div>}
        <button className="primary-button" type="submit" disabled={saving || saved}>{saving ? <><span className="spinner" aria-hidden="true" />Saving to Hindsight…</> : saved ? 'Experience saved to Hindsight' : 'Save experience to Hindsight'}</button>
      </form>
      <p className="outcome-context">Incident: {incident.machineId} · {incident.fault}. Saving is a synchronous Hindsight write; confirmation appears only after it succeeds.</p>
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
  const [form, setForm] = useState({ machineId: 'M-101', fault: 'Overheating', symptoms: 'Temperature rising above normal during long operating cycles', temperatureC: '', vibrationMmS: '', currentA: '', voltageV: '', incidentDate: localDate(), technicianObservation: 'Machine overheats after extended operation.' })
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
  const [outcomeForm, setOutcomeForm] = useState({ possibleCause: '', confirmedRootCause: '', repairPerformed: '', repairOutcome: '', outcomeNotes: '' })
  const [savingOutcome, setSavingOutcome] = useState(false)
  const [outcomeSaved, setOutcomeSaved] = useState(false)
  const [outcomeError, setOutcomeError] = useState('')

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

  function onOutcomeChange(event) {
    const { name, value } = event.target
    setOutcomeForm((current) => ({ ...current, [name]: value }))
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
    setOutcomeForm({ possibleCause: '', confirmedRootCause: '', repairPerformed: '', repairOutcome: '', outcomeNotes: '' })
    setOutcomeSaved(false)
    setOutcomeError('')
    setHindsightStatus('loading')
    setLlmStatus('idle')

    const incident = {
      machineId: form.machineId.trim(),
      fault: form.fault.trim(),
      symptoms: [form.symptoms.trim(), form.incidentDate && `Incident date: ${form.incidentDate}`, form.technicianObservation.trim() && `Technician observation: ${form.technicianObservation.trim()}`].filter(Boolean).join('\n'),
      incidentDate: form.incidentDate,
      technicianObservation: form.technicianObservation.trim(),
    }
    for (const field of ['temperatureC', 'vibrationMmS', 'currentA', 'voltageV']) {
      if (form[field] !== '') incident[field] = Number(form[field])
    }
    setInvestigatedIncident({ ...incident, displaySymptoms: form.symptoms.trim() })

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
        if (Array.isArray(details.historicalContext)) {
          setMemories(details.historicalContext)
          setHindsightStatus('connected')
          saveRecent('unavailable', 'Memory retrieved · AI unavailable')
        } else {
          setHindsightStatus('unavailable')
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

  async function onSaveOutcome(event) {
    event.preventDefault()
    if (!investigatedIncident) return
    setSavingOutcome(true)
    setOutcomeError('')
    const incident = {
      machineId: investigatedIncident.machineId,
      fault: investigatedIncident.fault,
      incidentDate: investigatedIncident.incidentDate,
      symptoms: investigatedIncident.displaySymptoms,
      observedCondition: [
        investigatedIncident.temperatureC !== undefined && `Temperature: ${investigatedIncident.temperatureC} °C`,
        investigatedIncident.vibrationMmS !== undefined && `Vibration: ${investigatedIncident.vibrationMmS} mm/s`,
        investigatedIncident.currentA !== undefined && `Current: ${investigatedIncident.currentA} A`,
        investigatedIncident.voltageV !== undefined && `Voltage: ${investigatedIncident.voltageV} V`,
      ].filter(Boolean).join('; '),
      possibleCause: outcomeForm.possibleCause.trim(),
      confirmedRootCause: outcomeForm.confirmedRootCause.trim(),
      repairPerformed: outcomeForm.repairPerformed.trim(),
      repairOutcome: outcomeForm.repairOutcome.trim(),
      technicianObservation: [investigatedIncident.technicianObservation, outcomeForm.outcomeNotes.trim()].filter(Boolean).join('\n'),
      temperatureC: investigatedIncident.temperatureC,
      vibrationMmS: investigatedIncident.vibrationMmS,
      currentA: investigatedIncident.currentA,
      voltageV: investigatedIncident.voltageV,
    }
    Object.keys(incident).forEach((key) => incident[key] === undefined && delete incident[key])

    try {
      await apiPost('/memory/retain', incident)
      setOutcomeSaved(true)
      saveRecent('complete', 'Experience learned')
    } catch (error) {
      setOutcomeError(error.message || 'Hindsight could not save this experience. It was not marked as learned.')
    } finally {
      setSavingOutcome(false)
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

          <CurrentCondition incident={investigatedIncident} />

          {errorMessage && !loading && llmStatus !== 'unavailable' && <div className="notice notice--error" role="alert"><span className="notice__symbol" aria-hidden="true">!</span><span>{errorMessage}</span></div>}

          <div className="primary-grid">
            <InvestigationForm form={form} onChange={onChange} onSubmit={onSubmit} loading={loading} loadingMessage={loadingMessage} />
            <MemoryPanel memories={memories} status={loading ? 'loading' : hindsightStatus} attempted={attempted} />
          </div>

          <InvestigationResult investigation={investigation} incident={investigatedIncident} llmStatus={llmStatus} hindsightStatus={hindsightStatus} message={errorMessage} />

          {investigation && investigatedIncident && <MemoryComparison incident={investigatedIncident} memories={memories} />}
          {investigatedIncident && attempted && <InvestigationOutcome incident={investigatedIncident} form={outcomeForm} onChange={onOutcomeChange} onSubmit={onSaveOutcome} saving={savingOutcome} saved={outcomeSaved} error={outcomeError} />}

          <MemoryFlow />
          <div className="secondary-grid"><LearningExplanation /><RecentInvestigations items={recent} /></div>
          <footer className="workspace-footer"><span>SMART FACTORY MAINTENANCE AGENT</span><span>HINDSIGHT MEMORY · TECHNICIAN-LED INVESTIGATION</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
