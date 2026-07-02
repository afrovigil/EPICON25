var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but was not found. Please configure it in your Secrets / Environment settings.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/extract", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Missing or invalid prompt string in request body." });
      }
      const ai = getGeminiClient();
      const systemInstruction = `You are an expert administrative assistant specializing in parsing recommendations, compliance criteria, and audit findings.
Extract the characteristics of the recommendation provided by the user.
The current date is Thursday, July 2, 2026. If the user mentions relative deadlines (e.g., "by next Friday", "in 3 months", "end of next month", "by December"), calculate the exact target date relative to July 2, 2026.
If no deadline is mentioned, default to 30 days from today (which would be 2026-08-01).
Format the deadline strictly as 'YYYY-MM-DD'.
Provide concise and clear categorization names for 'field', 'beneficiaries', and 'actionTakers'. Use Title Case.
Propose a professional reference number in the 'refNumber' field (e.g., if there's a reference like "finding 4.2" or "audit #8" mentioned, use "REC-4.2" or "AUD-008", otherwise generate a suitable sequential-style code like "REC-2026-XYZ").
For example, if the operator says: "Safety audit requires IT dept to encrypt all backup drives by August 15th for the engineering team.", you should extract:
- text: "Encrypt all backup drives"
- field: "Safety & Security"
- beneficiaries: "Engineering Team"
- actionTakers: "IT Department"
- deadline: "2026-08-15"
- refNumber: "REC-2026-SEC"`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              refNumber: {
                type: import_genai.Type.STRING,
                description: "A proposed or extracted short reference code, e.g., 'REC-2026-042', 'AUD-008', 'COMP-110'."
              },
              text: {
                type: import_genai.Type.STRING,
                description: "The core recommendation or action item (clear, concise command)."
              },
              field: {
                type: import_genai.Type.STRING,
                description: "Broad category or field of the recommendation, e.g., 'Safety', 'Compliance', 'Operations', 'Finance', 'Security'."
              },
              beneficiaries: {
                type: import_genai.Type.STRING,
                description: "The stakeholders or group that benefits from this recommendation, e.g., 'All Staff', 'Field Operations', 'Finance Department'."
              },
              actionTakers: {
                type: import_genai.Type.STRING,
                description: "The team, role, or department responsible for executing the recommendation, e.g., 'Facilities Team', 'IT Department', 'HR Team'."
              },
              deadline: {
                type: import_genai.Type.STRING,
                description: "The formatted target date (YYYY-MM-DD)."
              }
            },
            required: ["refNumber", "text", "field", "beneficiaries", "actionTakers", "deadline"]
          }
        }
      });
      const text = response.text;
      if (!text) {
        throw new Error("No response text received from the Gemini model.");
      }
      const extracted = JSON.parse(text.trim());
      return res.json({ success: true, data: extracted });
    } catch (error) {
      console.error("Extraction API Error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An unexpected error occurred during AI extraction."
      });
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT} under environment: ${process.env.NODE_ENV || "development"}`);
  });
}
startServer().catch((err) => {
  console.error("[Server] Startup failed:", err);
});
//# sourceMappingURL=server.cjs.map
