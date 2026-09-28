const { recallMaintenanceMemory } = require("./hindsight.service");
const { GROQ_MODEL, generateMaintenanceInvestigation } = require("./groq.service");

async function investigateMaintenanceIncident(currentIncident) {
  const recallQuery = [
    `Maintenance history for machine ${currentIncident.machineId}.`,
    `Current fault: ${currentIncident.fault}.`,
    `Current symptoms: ${currentIncident.symptoms}.`,
    currentIncident.technicianObservation && `Technician observation: ${currentIncident.technicianObservation}.`,
    ...["temperatureC", "vibrationMmS", "currentA", "voltageV"]
      .filter((field) => currentIncident[field] !== undefined)
      .map((field) => `${field}: ${currentIncident[field]}.`),
    "Recall related previous incidents, symptoms, repairs, replaced parts, outcomes, recurrence, and technician observations.",
  ].filter(Boolean).join(" ");

  // Reuse the existing Hindsight client/service; these memories are returned directly from recall.
  const recallResponse = await recallMaintenanceMemory(recallQuery, currentIncident.machineId);
  const historicalContext = recallResponse.results.map((memory) => ({
    id: memory.id,
    text: memory.text,
    type: memory.type,
    context: memory.context,
    occurredStart: memory.occurred_start,
    occurredEnd: memory.occurred_end,
    metadata: memory.metadata,
    tags: memory.tags,
  }));
  let investigation;
  try {
    investigation = await generateMaintenanceInvestigation(currentIncident, historicalContext);
  } catch (error) {
    error.historicalContext = historicalContext;
    throw error;
  }

  return {
    machineId: currentIncident.machineId,
    currentIncident,
    historicalContext,
    investigationContext: {
      currentIncident,
      historicalMaintenanceExperience: historicalContext,
      source: "hindsight",
    },
    investigation,
    memoryRecall: {
      source: "hindsight",
      resultCount: historicalContext.length,
    },
    llm: {
      status: "configured",
      provider: "groq",
      model: GROQ_MODEL,
    },
  };
}

module.exports = { investigateMaintenanceIncident };