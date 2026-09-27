function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: "Request body must contain valid JSON",
    });
  }

  if (error.code === "HINDSIGHT_NOT_CONFIGURED") {
    return res.status(503).json({
      success: false,
      error: "Hindsight memory service is not configured",
    });
  }

  if (error.code === "HINDSIGHT_REQUEST_FAILED") {
    return res.status(502).json({
      success: false,
      error: "Hindsight memory request failed",
    });
  }

  if (error.code === "GROQ_NOT_CONFIGURED") {
    return res.status(503).json({
      success: false,
      error: "Groq is not configured",
    });
  }

  if (error.code === "GROQ_REQUEST_FAILED") {
    const response = {
      success: false,
      error: error.providerMessage || "Groq investigation request failed",
    };
    if (Number.isInteger(error.providerStatus)) {
      response.providerStatus = error.providerStatus;
    }
    return res.status(502).json(response);
  }

  if (error.code === "GROQ_INVALID_RESPONSE") {
    return res.status(502).json({
      success: false,
      error: "Groq returned an invalid investigation response",
    });
  }

  return res.status(500).json({
    success: false,
    error: "Internal server error",
  });
}

module.exports = errorMiddleware;