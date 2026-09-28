# Smart Factory Maintenance Agent: 3-Minute Video Script

**Format:** Deployed application screen recording with voice-over

**Target runtime:** Approximately 3:00, including brief screen holds between voice-over sections
**Application:** https://smart-factory-maintenance-agent.vercel.app

## 0:00–0:20 — The Problem

[SCREEN: Start from a freshly loaded deployed application. Show the “Investigate a machine fault” page title and the “Current machine fault” form.]

[VOICE:]
Maintenance teams often investigate the same faults more than once. A current reading describes what is happening now, but may not show what happened during earlier repairs. Technician-confirmed experience can give the next investigation useful context.

## 0:20–0:40 — Meet the Project

[SCREEN: Show the application header, “Hindsight Memory,” “AI Reasoning,” and “Maintenance Agent” status cards. Add a brief technical caption: React/Vite on Vercel; Express on Render; Hindsight; Groq. Investigation route: POST /api/maintenance/investigate.]

[VOICE:]
This is Smart Factory Maintenance Agent: a React and Vite frontend on Vercel, with an Express backend on Render. Hindsight provides persistent memory; Groq provides reasoning. The technician stays in control. The agent supports investigation; it does not operate machinery or confirm a root cause.

## 0:40–1:15 — M-101 Investigation

[SCREEN: Show the prefilled “Machine ID” M-101, “Fault” Overheating, the symptoms and technician observation. Show the incident date and blank reading fields, then the “SIMULATED / MANUAL INPUTS” label. Click “Investigate fault” and show the “Current machine condition” summary with readings marked “Not provided.”]

[VOICE:]
This screen is prefilled for M-101 and Overheating. The symptoms say, “Temperature rising above normal during long operating cycles.” The technician observation says, “Machine overheats after extended operation.” The incident date shown is 2026-09-28. No numerical readings were entered; the summary shows “Not provided.” This demo uses manual or simulated input, not live factory sensors. Selecting “Investigate fault” queries Hindsight for relevant maintenance experience.

## 1:15–1:45 — Hindsight Recall

[SCREEN: Show the “Hindsight memory” panel, “23 HINDSIGHT RESULTS,” the result count, and the previous maintenance experience records describing M-101 overheating and cooling-fan maintenance.]

[VOICE:]
This live capture shows 23 relevant memories returned; the count can vary between investigations. The records include previous M-101 overheating incidents and a technician-recorded cooling-fan replacement followed by a return to normal operation. These are historical records, not current readings. Hindsight passes the recalled context to Groq.

## 1:45–2:10 — AI Reasoning

[SCREEN: Show “AI investigation,” “HISTORICAL CONNECTION,” “Possible causes · inspection required,” “Recommended checks,” “AI reasoning,” and “Confidence & uncertainty.”]

[VOICE:]
Groq combines the investigation with Hindsight context and returns guidance. Possible causes include a cooling-fan problem, labeled “inspection required.” This response mentions 80 degrees Celsius, 7.1 millimeters per second, and 12 amps from recalled records; the current fields still say “Not provided.” The AI has not inspected the machine or confirmed a cause.

## 2:10–2:35 — Technician Outcome and Learning

[SCREEN: Show the “Investigation outcome” form and the recalled record stating that the technician replaced the cooling fan and the machine returned to normal operation. Point out “Confirmed root cause,” “Maintenance action taken,” “Result / resolution,” and “Save experience to Hindsight.” Show an existing, verified “Experience Learned” confirmation if available; do not create a duplicate production write for filming.]

[VOICE:]
The outcome form lets a technician record a confirmed cause if known, the maintenance action, and the result. A recalled M-101 record says the cooling fan was replaced and operation returned to normal. On technician submission, `POST /api/memory/retain` saves the outcome; “Experience Learned” appears only after Hindsight confirms the write. Memory quality depends on accurate technician-confirmed outcomes.

## 2:35–2:50 — Before and After Memory

[SCREEN: Show “BEFORE / AFTER MEMORY DEMO,” “WITHOUT RELEVANT MEMORY,” “Illustrative Counterfactual Baseline,” and “WITH HINDSIGHT MEMORY.”]

[VOICE:]
“Illustrative Counterfactual Baseline” is a UI comparison, not a second AI run. Without relevant memory, reasoning has only the current condition; with Hindsight, Groq also receives previous maintenance experience.

## 2:50–3:00 — Takeaway

[SCREEN: End on the flow label: OBSERVE → RECALL → REASON → ACT → LEARN.]

[VOICE:]
The key idea is simple: a maintenance agent becomes more useful when it can remember verified maintenance experience and use that experience during future investigations.

## Video Title Ideas

1. Hindsight for Smart Factory Maintenance Memory
2. Using Hindsight to Recall Machine Maintenance Experience
3. Hindsight Memory in a Technician-Led Fault Investigation
4. How Hindsight Connects Past Repairs to New Faults
5. Smart Factory Maintenance: Learning from Hindsight Records

## Recording Checklist

- [ ] Record in 16:9.
- [ ] Use a clear microphone and voice-over.
- [ ] Record the deployed Vercel application: https://smart-factory-maintenance-agent.vercel.app
- [ ] Show Hindsight recall and the actual result count for the captured run; do not imply it is fixed.
- [ ] Show the AI reasoning section and keep possible causes labeled as unconfirmed.
- [ ] Show the technician-confirmed outcome example.
- [ ] Show Hindsight learning/retain, preferably with an existing verified success state; avoid duplicate production writes.
- [ ] Show the before/after memory comparison and explain its illustrative baseline.
- [ ] Keep the total video between 2 and 5 minutes.
- [ ] Do not expose API keys, passwords, `.env` files, or private credentials.
- [ ] Make clear that the demo uses simulated/manual data, not live factory sensors, and supports technicians rather than autonomously operating machinery.