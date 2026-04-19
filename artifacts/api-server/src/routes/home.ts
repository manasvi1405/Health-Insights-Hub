import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware";
import { connectMongo, ReminderModel, ScanModel, UserModel } from "./mongo";

const router = Router();

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${timeGreet}${name ? `, ${name}` : ""}!`;
}

function isDueSoon(times: string[]) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return times.some((t) => {
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const diff = h * 60 + m - nowMinutes;
    return diff >= -10 && diff <= 60;
  });
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const user = await UserModel.findById(req.userId).lean() as { name?: string } | null;
    const reminders = await ReminderModel.find({ userId: req.userId }).lean();
    const recentScans = await ScanModel.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const dueMedications = reminders.filter((r) => isDueSoon(r.times || []));
    const lowStockAlerts = reminders.filter((r) => (r.stockCount ?? 30) <= 5);

    res.json({
      greeting: getGreeting(user?.name),
      dueMedications,
      recentScans,
      lowStockAlerts
    });
  } catch (err) {
    req.log.error(err, "homeSummary error");
    res.status(500).json({ error: "Failed to get summary" });
  }
});

export default router;
