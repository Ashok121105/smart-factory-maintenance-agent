function getHindsightConfig() {
  const config = {
    apiKey: process.env.HINDSIGHT_API_KEY,
    bankId: process.env.HINDSIGHT_BANK_ID,
    baseUrl: process.env.HINDSIGHT_BASE_URL,
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error("Hindsight configuration is incomplete");
    error.code = "HINDSIGHT_NOT_CONFIGURED";
    throw error;
  }

  return config;
}

module.exports = { getHindsightConfig };