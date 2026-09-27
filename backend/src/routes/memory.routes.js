const express = require("express");
const {
  recallMaintenanceMemory,
  retainMaintenanceIncident,
} = require("../services/hindsight.service");

const router = express.Router();
const incidentTextFields = [
  "incidentDate",
  "symptoms",
  "repairPerformed",
  "partReplaced",
  "technicianAction",
  "repairOutcome",
  "technicianObservation",
];

function validateIncident(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be an incident object" };
  }
  if (typeof body.machineId !== "string" || !body.machineId.trim()) {
    return { error: "machineId is required" };
  }
  if (typeof body.fault !== "string" || !body.fault.trim()) {
    return { error: "fault is required" };
  }

  const incident = {
    machineId: body.machineId.trim(),
    fault: body.fault.trim(),
  };

  for (const field of incidentTextFields) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      return { error: `${field} must be a string` };
    }
    if (typeof body[field] === "string" && body[field].length > 2000) {
      return { error: `${field} must be 2000 characters or fewer` };
    }
    if (typeof body[field] === "string" && body[field].trim()) {
      incident[field] = body[field].trim();
    }
  }

  if (incident.incidentDate && Number.isNaN(Date.parse(incident.incidentDate))) {
    return { error: "incidentDate must be a valid date" };
  }

  if (body.recurrenceDays !== undefined) {
    if (!Number.isInteger(body.recurrenceDays) || body.recurrenceDays < 0) {
      return { error: "recurrenceDays must be a non-negative integer" };
    }
    incident.recurrenceDays = body.recurrenceDays;
  }

  return { incident };
}

router.post("/memory/retain", async (req, res, next) => {
  const { incident, error } = validateIncident(req.body);
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  try {
    const data = await retainMaintenanceIncident(incident);
    return res.json({ success: true, data });
  } catch (serviceError) {
    return next(serviceError);
  }
});

router.post("/memory/recall", async (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ success: false, error: "Request body must be an object" });
  }

  const { query, machineId } = body;
  if (typeof query !== "string" || !query.trim() || query.length > 2000) {
    return res.status(400).json({
      success: false,
      error: "query is required and must be 2000 characters or fewer",
    });
  }
  if (machineId !== undefined && (typeof machineId !== "string" || !machineId.trim())) {
    return res.status(400).json({ success: false, error: "machineId must be a non-empty string" });
  }

  try {
    const data = await recallMaintenanceMemory(query.trim(), machineId?.trim());
    return res.json({ success: true, data });
  } catch (serviceError) {
    return next(serviceError);
  }
});

module.exports = router;