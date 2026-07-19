let sseClients = [];

export const subscribeLiveUpdates = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send connection confirmation ping
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  sseClients.push(res);

  req.on("close", () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
};

export const broadcastLiveUpdate = (type) => {
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify({ type })}\n\n`);
    } catch (err) {
      console.error("Error sending SSE update:", err);
    }
  });
};
