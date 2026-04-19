import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware";
import { connectMongo, ContactModel, UserModel } from "./mongo";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const { latitude, longitude, message } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Location required" });
    }

    const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const contacts = await ContactModel.find({ userId: req.userId }).lean();
    const user = await UserModel.findById(req.userId).lean() as { name?: string } | null;

    req.log.info({
      userId: req.userId,
      userName: user?.name,
      location: locationLink,
      contactsCount: contacts.length,
      message
    }, "SOS triggered");

    res.json({
      message: `SOS alert sent! ${contacts.length} contact(s) notified.`,
      contactsNotified: contacts.length,
      locationLink
    });
  } catch (err) {
    req.log.error(err, "SOS error");
    res.status(500).json({ error: "SOS failed" });
  }
});

export default router;
