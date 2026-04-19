import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware";
import { connectMongo, ReminderModel } from "./mongo";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const reminders = await ReminderModel.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json(reminders);
  } catch (err) {
    req.log.error(err, "listReminders error");
    res.status(500).json({ error: "Failed to get reminders" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const { medName, dosage, frequency, times, stockCount, autoReminder } = req.body;
    const reminder = await ReminderModel.create({
      userId: req.userId,
      medName, dosage, frequency, times, stockCount: stockCount ?? 30, autoReminder: autoReminder ?? true
    });
    res.status(201).json(reminder);
  } catch (err) {
    req.log.error(err, "createReminder error");
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

router.put("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const reminder = await ReminderModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, lean: true }
    );
    if (!reminder) return res.status(404).json({ error: "Reminder not found" });
    res.json(reminder);
  } catch (err) {
    req.log.error(err, "updateReminder error");
    res.status(500).json({ error: "Failed to update reminder" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    await ReminderModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    req.log.error(err, "deleteReminder error");
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

router.post("/:id/taken", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const reminder = await ReminderModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!reminder) return res.status(404).json({ error: "Reminder not found" });

    reminder.stockCount = Math.max(0, (reminder.stockCount || 0) - 1);
    await reminder.save();

    let stockAlert: string | undefined;
    if (reminder.stockCount === 0) {
      stockAlert = "OUT_OF_STOCK";
    } else if (reminder.stockCount <= 2) {
      stockAlert = "RUNNING_LOW";
    }

    res.json({ reminder, stockAlert, stockCount: reminder.stockCount });
  } catch (err) {
    req.log.error(err, "markTaken error");
    res.status(500).json({ error: "Failed to mark as taken" });
  }
});

export default router;
