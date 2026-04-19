import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware";
import { connectMongo, ScanModel } from "./mongo";
import { GoogleGenAI } from "@google/genai";

const router = Router();

function getAI() {
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "dummy";
  if (!baseUrl) throw new Error("Gemini AI not configured");
  return new GoogleGenAI({ apiKey, httpOptions: { baseUrl } });
}

function getScanPrompt(type: string) {
  if (type === "medicine") {
    return `You are a medical AI assistant. Analyze this medicine image and provide:
1. Medicine name and active ingredients
2. What it is used for (indications)
3. Common dosage information
4. Important warnings or side effects
5. Storage instructions

Format your response as a clear, helpful summary. Start with "Medicine Analysis:" and use simple language suitable for patients. If you cannot clearly identify the medicine, say so and advise consulting a pharmacist.`;
  }
  if (type === "prescription") {
    return `You are a medical AI assistant. Analyze this prescription and provide:
1. Medicines prescribed and their dosages
2. What each medicine is for
3. Important instructions (before/after food, frequency)
4. Duration of treatment
5. Any special precautions mentioned

Format as "Prescription Analysis:" with a clear, patient-friendly summary. Include a reminder to follow the doctor's instructions exactly.`;
  }
  return `You are a medical AI assistant. Analyze this medical report and provide:
1. Key findings and values
2. What these results mean in simple language
3. Values that are outside normal range (highlight if High/Low)
4. Recommended actions or follow-up
5. Lifestyle suggestions if applicable

Format as "Report Analysis:" with a clear, patient-friendly summary. Always advise consulting the doctor for medical decisions.`;
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const scans = await ScanModel.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(scans);
  } catch (err) {
    req.log.error(err, "listScans error");
    res.status(500).json({ error: "Failed to get scans" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const { type, imageBase64 } = req.body;
    if (!type || !imageBase64) return res.status(400).json({ error: "Type and image required" });

    let aiInsight = "";
    let summary = "";

    try {
      const ai = getAI();
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: getScanPrompt(type) },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }],
        config: { maxOutputTokens: 8192 }
      });

      aiInsight = response.text || "Analysis complete. Please consult your doctor for medical advice.";
      const lines = aiInsight.split("\n").filter((l: string) => l.trim());
      summary = lines.slice(0, 3).join(" ").slice(0, 200);
    } catch (aiErr) {
      req.log.error(aiErr, "AI scan error");
      aiInsight = `${type.charAt(0).toUpperCase() + type.slice(1)} scanned successfully. AI analysis temporarily unavailable. Please consult your healthcare provider for detailed information.`;
      summary = "Scan complete - please consult your doctor.";
    }

    const scan = await ScanModel.create({
      userId: req.userId,
      type,
      imageBase64: imageBase64.slice(0, 100),
      aiInsight,
      summary
    });

    res.json(scan);
  } catch (err) {
    req.log.error(err, "createScan error");
    res.status(500).json({ error: "Failed to process scan" });
  }
});

export default router;
