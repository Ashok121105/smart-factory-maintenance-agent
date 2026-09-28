# My Hindsight maintenance investigation workflow

I built Smart Factory Maintenance Agent to help a technician investigate recurring machine faults with the right context. The project addresses a real factory problem: machines can develop abnormal conditions such as overheating, vibration, current changes, and other symptoms, but a technician may not have easy access to earlier maintenance experience when the same issue returns.

The system is technician-led. It combines current machine-condition readings, Hindsight persistent memory, Groq reasoning, and technician-confirmed maintenance outcomes. It is not an autonomous repair system. It supports investigation by helping a technician connect a current fault to prior work.

## The real maintenance problem

Factory machines can show abnormal behavior without an obvious cause. A technician may have a recent reading, a symptom report, and a checklist, but the same machine may have failed before with a similar pattern. Without historical context, a recurring issue can look like a fresh problem even when earlier maintenance experience is relevant.

This project addresses that gap. The goal is to make previous maintenance experience available during a new investigation so the technician can compare the current condition with what was learned before.

## Our solution

Smart Factory Maintenance Agent is an AI maintenance investigation system for technicians. It starts with the current machine condition: machine ID, fault, symptoms, and optional readings such as temperature, vibration, current, and voltage. The backend then recalls relevant Hindsight memories, sends the current condition and historical context to Groq, and returns investigation guidance that the technician can review.

The important part is that the system does not treat possible causes as confirmed root causes. It suggests likely causes and investigation checks. The technician inspects the machine, confirms the real cause, and records the outcome. Only a technician-confirmed result is stored as maintenance experience for future investigations.

## Core workflow: OBSERVE → RECALL → REASON → ACT → LEARN

The project follows one clear loop:

- OBSERVE: the technician records the current machine condition and readings.
- RECALL: Hindsight retrieves previous maintenance experience for the same machine or a related fault.
- REASON: Groq reasons over the current condition and recalled history.
- ACT: the technician inspects the equipment and confirms the action.
- LEARN: the technician records the outcome and saves it to Hindsight.

This flow is visible in the UI and in the backend design. The project is explicit that the investigation support remains with the technician, not the AI.

## Hindsight’s role

Hindsight is not just a database. In this project, it is the persistent maintenance memory layer that lets the system remember verified experience and recall it during future investigations.

The distinction matters:

- Recall: retrieving relevant previous maintenance experience.
- Retain: storing a technician-confirmed maintenance outcome so it can be reused later.

Recall helps with the current investigation. Retain grows the memory for future investigations. The backend includes separate recall and retain paths, and the UI states that only technician-recorded outcomes are saved to Hindsight.

This is a real boundary: the system does not invent experience. It stores what the technician has confirmed as a real action and result.

## Example with M-101

A realistic example in the project is the same machine, M-101, showing a similar overheating fault in two incidents.

Incident 1: the machine shows overheating, with temperature around 80–86°C depending on the verified run, vibration around 7.1 mm/s, and current around 12 A. The technician investigates the issue. The cooling fan issue is confirmed by the technician, the cooling fan is replaced, and the machine returns to normal operation. The outcome is then saved to Hindsight.

Incident 2: the same M-101 machine develops a similar overheating condition. Hindsight recalls the earlier maintenance experience. Groq receives both the current condition and the recalled Hindsight context. The AI then connects the current incident to the historical cooling-fan maintenance experience. This is investigation support, not guaranteed failure prediction. The system helps the technician reason with historical evidence, but it does not guarantee the same failure is occurring or that the root cause is certain.

This matches the project’s actual prompt behavior. The Groq instructions explicitly say to assist with investigation only and not to autonomously repair or control machines.

## Before/after memory demonstration

The UI includes an “Illustrative Counterfactual Baseline.” This is not a second AI run. It is a comparison showing the current-condition-only context versus the same condition with Hindsight memory available. The page explicitly states that the baseline is illustrative and not a separate memory-free inference pass.

With Hindsight memory, historical maintenance context is available to Groq. Without it, Groq reasons from the current-condition data only. The difference is not a different model; it is a different context.

## Technician control and learning loop

This system is intentionally controlled by the technician. The AI suggests possible causes and investigation checks, but it does not independently confirm the root cause. The technician remains responsible for inspection and diagnosis.

After the maintenance action, the technician records the confirmed root cause, the action taken, the result, and notes. Only the technician-recorded outcome is saved into Hindsight as maintenance experience. The agent does not store every investigation attempt as a resolved incident. It records only a confirmed outcome after the technician submits it successfully.

## Actual repository code

The workflow is visible in the implementation.

```js
const recallQuery = [
  `Maintenance history for machine ${currentIncident.machineId}.`,
  `Current fault: ${currentIncident.fault}.`,
  `Current symptoms: ${currentIncident.symptoms}.`,
  ...["temperatureC", "vibrationMmS", "currentA", "voltageV"]
    .filter((field) => currentIncident[field] !== undefined)
    .map((field) => `${field}: ${currentIncident[field]}.`),
  "Recall related previous incidents, symptoms, repairs, replaced parts, outcomes, recurrence, and technician observations.",
].filter(Boolean).join(" ");

const recallResponse = await recallMaintenanceMemory(recallQuery, currentIncident.machineId);
const historicalContext = recallResponse.results.map((memory) => ({
  id: memory.id,
  text: memory.text,
  metadata: memory.metadata,
  tags: memory.tags,
}));
```

This is the real Hindsight recall step. It builds a query from machine, fault, symptoms, and readings, then passes returned memories as context for the investigation.

```js
async function retainMaintenanceIncident(incident) {
  const { client, bankId } = getClientAndBankId();
  const options = {
    context: "Factory maintenance incident",
    metadata: {
      source: "factory-maintenance-api",
      machineId: incident.machineId,
      fault: incident.fault,
    },
    tags: ["factory-maintenance", `machine:${incident.machineId}`],
  };

  return await client.retain(bankId, formatIncident(incident), {
    ...options,
    async: false,
  });
}
```

This is the retain path. It saves a technician-confirmed maintenance outcome into Hindsight with metadata and tags.

```js
const SYSTEM_INSTRUCTION = [
  "You are an AI maintenance investigation assistant for a factory maintenance technician.",
  "Assist with investigation only; do not autonomously repair, control, or operate machines.",
  "Machine readings are technician-provided simulated/manual inputs unless explicitly stated otherwise; never describe them as live sensor data.",
  "Use historical maintenance context when relevant, but do not invent prior incidents, repairs, parts, dates, or outcomes.",
  "List diagnoses only as possible causes unless the technician explicitly supplied a confirmed root cause.",
].join(" ");
```

This keeps Groq grounded in actual technician-provided inputs and prevents it from claiming certainty beyond the evidence.

## Architecture and deployment

Technician
↓
React/Vite frontend
↓
Express backend
↓
Hindsight Recall
↓
Groq reasoning
↓
Technician investigation/outcome
↓
Hindsight Retain
↓
Future investigation

The actual deployment architecture matches that flow: frontend is on Vercel, backend/API is on Render, Hindsight provides persistent memory, and Groq handles reasoning.

Public URL: https://smart-factory-maintenance-agent.vercel.app

Official Hindsight references:
- GitHub: https://github.com/vectorize-io/hindsight
- Docs: https://hindsight.vectorize.io/

## Screenshot placeholders

![Screenshot 1 — System online with Hindsight and Groq connected](IMAGE_PLACEHOLDER_1)

![Screenshot 2 — Current machine condition](IMAGE_PLACEHOLDER_2)

![Screenshot 3 — Hindsight historical experience](IMAGE_PLACEHOLDER_3)

![Screenshot 4 — Groq investigation and historical connection](IMAGE_PLACEHOLDER_4)

![Screenshot 5 — Before/after memory demonstration](IMAGE_PLACEHOLDER_5)

![Screenshot 6 — Technician-confirmed maintenance outcome](IMAGE_PLACEHOLDER_6)

![Screenshot 7 — Experience learned and saved to Hindsight](IMAGE_PLACEHOLDER_7)

## What I learned

I learned that the strongest part of this project is not a prediction engine; it is the memory loop. The demo uses simulated or manual current readings rather than real factory sensor deployment, and the project is explicit that it is not claiming live industrial monitoring or autonomous machinery control. The system supports technicians; it does not operate equipment.

Possible causes are not treated as confirmed root causes. Historical memory quality depends on the quality of the technician-recorded outcome. Recall quality also varies with the stored memory and query. These are real limitations, and they are important.

The same architecture could later receive data from industrial sensors such as temperature, vibration, current, and voltage while keeping the technician-confirmed learning loop. The core idea remains the same: a maintenance agent becomes more useful when it can remember verified maintenance experience and use it during future investigations.

The key idea is that a maintenance agent becomes more useful when it can remember verified maintenance experience and use that experience during future investigations.
