const express = require("express");
const { investigateMaintenanceIncident } = require("../services/maintenance-agent.service");

const router = express.Router();
const incidentFields = ["machineId", "fault", "symptoms"];
const optionalTextFields = ["incidentDate", "technicianObservation"];
const readingFields = ["temperatureC", "vibrationMmS", "currentA", "voltageV"];

router.post("/investigate", async (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ success: false, error: "Request body must be an incident object" });
  }

  const currentIncident = {};
  for (const field of incidentFields) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      return res.status(400).json({ success: false, error: `${field} is required` });
    }
    if (body[field].length > 2000) {
      return res.status(400).json({ success: false, error: `${field} must be 2000 characters or fewer` });
    }
    currentIncident[field] = body[field].trim();
  }

  for (const field of optionalTextFields) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      return res.status(400).json({ success: false, error: `${field} must be a string` });
    }
    if (typeof body[field] === "string" && body[field].length > 2000) {
      return res.status(400).json({ success: false, error: `${field} must be 2000 characters or fewer` });
    }
    if (typeof body[field] === "string" && body[field].trim()) {
      currentIncident[field] = body[field].trim();
    }
  }

  for (const field of readingFields) {
    if (body[field] !== undefined && (typeof body[field] !== "number" || !Number.isFinite(body[field]))) {
      return res.status(400).json({ success: false, error: `${field} must be a finite number` });
    }
    if (body[field] !== undefined) currentIncident[field] = body[field];
  }

  try {
    const data = await investigateMaintenanceIncident(currentIncident);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;