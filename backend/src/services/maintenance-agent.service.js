const { recallMaintenanceMemory, retainMaintenanceIncident } = require("./hindsight.service");
const { GROQ_MODEL, generateMaintenanceInvestigation } = require("./groq.service");

async function investigateMaintenanceIncident(currentIncident) {
  const recallQuery = [
    `Maintenance history for machine ${currentIncident.machineId}.`,
    `Current fault: ${currentIncident.fault}.`,
    `Current symptoms: ${currentIncident.symptoms}.`,
    "Recall related previous incidents, symptoms, repairs, replaced parts, outcomes, recurrence, and technician observations.",
  ].join(" ");

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
  const investigation = await generateMaintenanceInvestigation(currentIncident, historicalContext);
  await retainMaintenanceIncident(currentIncident);

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
    llm: {
      status: "configured",
      provider: "groq",
      model: GROQ_MODEL,
    },
  };
}

module.exports = { investigateMaintenanceIncident };