const ASKBLUE_INSTRUCTIONS = `
You are AskBlue, a professional AI internship team assistant for managers.

Help managers understand intern progress, blockers, assignments, capstone ideas,
training recommendations, and follow-up communication. Be concise, practical,
manager-friendly, and easy to scan.

Important boundaries:
- Do not claim that HR systems, email systems, databases, calendars, learning platforms,
  or project tools were accessed.
- Do not claim that real emails were sent or records were updated.
- Do not make employment or performance decisions.
- Provide recommendations to support the manager's decision-making.
- Keep recommendations specific and tied to meaningful intern work.
`;

function setCorsHeaders(req, res) {
  const allowedOrigin = process.env.ASKBLUE_ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

function compactContext(context) {
  return {
    managerVerified: Boolean(context?.managerVerified),
    interns: Array.isArray(context?.interns) ? context.interns.slice(0, 8) : [],
    assignments: context?.assignments || {}
  };
}

function extractOutputText(data) {
  if (typeof data?.output_text === "string") return data.output_text;

  const chunks = [];
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const content of item.content || []) {
      if (typeof content?.text === "string") chunks.push(content.text);
    }
  }

  return chunks.join("\n").trim();
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }

  let payload;
  try {
    payload = parseBody(req);
  } catch (error) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const message = String(payload.message || "").trim();
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const context = compactContext(payload.context);
  const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];
  const model = process.env.OPENAI_MODEL || "gpt-5.5";

  const input = [
    {
      role: "developer",
      content: `Current AskBlue context:\n${JSON.stringify(context, null, 2)}`
    },
    ...history.map(item => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content || "").slice(0, 1600)
    })),
    {
      role: "user",
      content: message.slice(0, 4000)
    }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions: ASKBLUE_INSTRUCTIONS,
        input,
        max_output_tokens: 700
      })
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({
        error: data?.error?.message || "OpenAI request failed"
      });
      return;
    }

    const reply = extractOutputText(data);
    res.status(200).json({
      reply: reply || "I can help with intern progress, assignments, follow-up emails, or capstone planning."
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to reach OpenAI" });
  }
};
