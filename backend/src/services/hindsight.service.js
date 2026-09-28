const { HindsightClient } = require("@vectorize-io/hindsight-client");
const { getHindsightConfig } = require("../config/hindsight.config");

let hindsightClient;

function getClientAndBankId() {
  const { apiKey, bankId, baseUrl } = getHindsightConfig();

  // This SDK requires baseUrl and sends apiKey as a Bearer token when provided.
  if (!hindsightClient) {
    hindsightClient = new HindsightClient({ baseUrl, apiKey });
  }

  return { client: hindsightClient, bankId };
}

function formatIncident(incident) {
  const fields = [
    ["Machine", incident.machineId],
    ["Fault", incident.fault],
    ["Incident date", incident.incidentDate],
    ["Symptoms", incident.symptoms],
    ["Observed condition", incident.observedCondition],
    ["Temperature (C)", incident.temperatureC],
    ["Vibration (mm/s)", incident.vibrationMmS],
    ["Current (A)", incident.currentA],
    ["Voltage (V)", incident.voltageV],
    ["Possible cause (unconfirmed)", incident.possibleCause],
    ["Confirmed root cause (technician recorded)", incident.confirmedRootCause],
    ["Repair performed", incident.repairPerformed],
    ["Part replaced", incident.partReplaced],
    ["Technician action", incident.technicianAction],
    ["Repair outcome", incident.repairOutcome],
    ["Recurrence days", incident.recurrenceDays],
    ["Technician observation", incident.technicianObservation],
  ];

  return fields
    .filter(([, value]) => value !== undefined)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function toHindsightRequestError() {
  const error = new Error("Hindsight memory request failed");
  error.code = "HINDSIGHT_REQUEST_FAILED";
  return error;
}

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

  if (incident.incidentDate) {
    options.timestamp = incident.incidentDate;
  }

  try {
    return await client.retain(bankId, formatIncident(incident), {
      ...options,
      async: false,
    });
  } catch {
    throw toHindsightRequestError();
  }
}

async function recallMaintenanceMemory(query, machineId) {
  const { client, bankId } = getClientAndBankId();
  const recallQuery = machineId ? `${query}\nMachine: ${machineId}` : query;
  const options = machineId
    ? { tags: [`machine:${machineId}`], tagsMatch: "any_strict" }
    : undefined;

  try {
    return await client.recall(bankId, recallQuery, options);
  } catch {
    throw toHindsightRequestError();
  }
}

module.exports = { recallMaintenanceMemory, retainMaintenanceIncident };