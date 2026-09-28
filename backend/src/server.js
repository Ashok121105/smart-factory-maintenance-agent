const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const cors = require("cors");
const express = require("express");
const healthRoutes = require("./routes/health.routes");
const memoryRoutes = require("./routes/memory.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "32kb" }));
app.use("/api", healthRoutes);
app.use("/api", memoryRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use(errorMiddleware);

if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

module.exports = app;