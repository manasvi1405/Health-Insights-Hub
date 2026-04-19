import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware";
import { connectMongo, ReminderModel, ScanModel, UserModel } from "./mongo";

const router = Router();

function getGreeting(name?: string, language?: string) {
  const hour = new Date().getHours();
  const lang = (language || "English").toLowerCase();

  let timeGreet = "";
  if (lang.startsWith("hi")) {
    timeGreet = hour < 12 ? "शुभ प्रभात" : hour < 17 ? "नमस्ते" : "शुभ संध्या";
    return `${timeGreet}${name ? `, ${name}` : ""}!`;
  } else if (lang.startsWith("mr")) {
    timeGreet = hour < 12 ? "शुभ सकाळ" : hour < 17 ? "नमस्कार" : "शुभ संध्याकाळ";
    return `${timeGreet}${name ? `, ${name}` : ""}!`;
  }
  timeGreet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${timeGreet}${name ? `, ${name}` : ""}!`;
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const user = await UserModel.findById(req.userId).lean() as { name?: string; language?: string } | null;
    const allReminders = await ReminderModel.find({ userId: req.userId }).lean();
    const recentScans = await ScanModel.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const lowStockAlerts = allReminders.filter((r) => (r.stockCount ?? 30) <= 5);

    res.json({
      greeting: getGreeting(user?.name, user?.language),
      dueMedications: allReminders,
      recentScans,
      lowStockAlerts,
    });
  } catch (err) {
    req.log.error(err, "homeSummary error");
    res.status(500).json({ error: "Failed to get summary" });
  }
});

export default router;
