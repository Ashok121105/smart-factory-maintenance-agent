const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const cors = require("cors");
const express = require("express");
const healthRoutes = require("./routes/health.routes");
const memoryRoutes = require("./routes/memory.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());
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