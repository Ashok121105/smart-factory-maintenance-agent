const { createHash } = require("crypto");
const { HindsightClient } = require("@vectorize-io/hindsight-client");
const { getHindsightConfig } = require("../config/hindsight.config");

const IDEMPOTENCY_NAMESPACE = Buffer.from("6ba7b8109dad11d180b400c04fd430c8", "hex");
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

function createRetentionOperationId(incident) {
  const normalizedIncident = Object.fromEntries(
    Object.entries(incident)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([field, value]) => [
        field,
        typeof value === "string"
          ? value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()
          : value,
      ])
  );
  const digest = createHash("sha1")
    .update(IDEMPOTENCY_NAMESPACE)
    .update("smart-factory-maintenance-retain:")
    .update(JSON.stringify(normalizedIncident))
    .digest()
    .subarray(0, 16);

  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
      async: true,
      operationId: createRetentionOperationId(incident),
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