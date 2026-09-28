const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

const SYSTEM_INSTRUCTION = [
  "You are an AI maintenance investigation assistant for a factory maintenance technician.",
  "Assist with investigation only; do not autonomously repair, control, or operate machines.",
  "Machine readings are technician-provided simulated/manual inputs unless explicitly stated otherwise; never describe them as live sensor data.",
  "You have not physically inspected the machine. Say 'based on the provided machine-condition data' and recommend inspection to confirm a cause.",
  "Use historical maintenance context when relevant, but do not invent prior incidents, repairs, parts, dates, or outcomes.",
  "Clearly distinguish historical facts from reasoning and suggestions. If history is insufficient, say so.",
  "List diagnoses only as possible causes unless the technician explicitly supplied a confirmed root cause.",
  "Focus only on the current machine fault. Give practical, concise troubleshooting guidance.",
  "When a recurring fault exists, explicitly connect the current incident to relevant historical incidents.",
  "Include appropriate safety precautions and follow site procedures; do not advise bypassing safeguards.",
  "Do not claim certainty unless the evidence supports it.",
  "Return only a JSON object with string fields summary, historicalConnection, reasoning, confidenceNote, and arrays of strings observedAbnormalConditions, possibleCauses, recommendedChecks, and safetyConsiderations.",
].join(" ");

function parseInvestigation(text) {
  if (typeof text !== "string" || !text.trim()) {
    const error = new Error("Groq returned an empty response");
    error.code = "GROQ_INVALID_RESPONSE";
    throw error;
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    const error = new Error("Groq returned an invalid response");
    error.code = "GROQ_INVALID_RESPONSE";
    throw error;
  }

  const valid = result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    typeof result.summary === "string" &&
    typeof result.historicalConnection === "string" &&
    typeof result.reasoning === "string" &&
    Array.isArray(result.recommendedChecks) &&
    result.recommendedChecks.every((check) => typeof check === "string");

  if (!valid) {
    const error = new Error("Groq returned an unexpected response structure");
    error.code = "GROQ_INVALID_RESPONSE";
    throw error;
  }

  return {
    summary: result.summary,
    historicalConnection: result.historicalConnection,
    recommendedChecks: result.recommendedChecks,
    reasoning: result.reasoning,
    confidenceNote: typeof result.confidenceNote === "string" ? result.confidenceNote : "Possible causes are unconfirmed; inspection is required.",
    observedAbnormalConditions: Array.isArray(result.observedAbnormalConditions) ? result.observedAbnormalConditions : [],
    possibleCauses: Array.isArray(result.possibleCauses) ? result.possibleCauses : [],
    safetyConsiderations: Array.isArray(result.safetyConsiderations) ? result.safetyConsiderations : [],
  };
}

async function generateMaintenanceInvestigation(currentIncident, historicalContext) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error("Groq is not configured");
    error.code = "GROQ_NOT_CONFIGURED";
    throw error;
  }

  let response;
  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: JSON.stringify({ currentIncident, historicalContext }) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
  } catch {
    const error = new Error("Groq investigation request failed");
    error.code = "GROQ_REQUEST_FAILED";
    throw error;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error("Groq investigation request failed");
    error.code = "GROQ_REQUEST_FAILED";
    error.providerStatus = response.status;
    if (typeof payload?.error?.message === "string") {
      error.providerMessage = payload.error.message.split(apiKey).join("[REDACTED]");
    }
    throw error;
  }

  return parseInvestigation(payload?.choices?.[0]?.message?.content);
}

module.exports = { GROQ_MODEL, generateMaintenanceInvestigation };