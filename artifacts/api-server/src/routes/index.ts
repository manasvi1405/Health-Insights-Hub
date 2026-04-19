import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import remindersRouter from "./reminders";
import scansRouter from "./scans";
import sosRouter from "./sos";
import contactsRouter from "./contacts";
import homeRouter from "./home";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/reminders", remindersRouter);
router.use("/scans", scansRouter);
router.use("/sos", sosRouter);
router.use("/contacts", contactsRouter);
router.use("/home/summary", homeRouter);

export default router;
