import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware";
import { connectMongo, ContactModel } from "./mongo";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const contacts = await ContactModel.find({ userId: req.userId }).lean();
    res.json(contacts);
  } catch (err) {
    req.log.error(err, "listContacts error");
    res.status(500).json({ error: "Failed to get contacts" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const { name, phone, relation, isPrimary } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Name and phone required" });

    if (isPrimary) {
      await ContactModel.updateMany({ userId: req.userId }, { isPrimary: false });
    }

    const contact = await ContactModel.create({ userId: req.userId, name, phone, relation, isPrimary: isPrimary ?? false });
    res.status(201).json(contact);
  } catch (err) {
    req.log.error(err, "createContact error");
    res.status(500).json({ error: "Failed to create contact" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    await ContactModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Contact deleted" });
  } catch (err) {
    req.log.error(err, "deleteContact error");
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
