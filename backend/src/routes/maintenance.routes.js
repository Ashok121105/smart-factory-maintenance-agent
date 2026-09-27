const express = require("express");
const { investigateMaintenanceIncident } = require("../services/maintenance-agent.service");

const router = express.Router();
const incidentFields = ["machineId", "fault", "symptoms"];

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

  try {
    const data = await investigateMaintenanceIncident(currentIncident);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;