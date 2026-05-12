import { Router, type IRouter } from "express";
import healthRouter from "./health";
import affiliateRouter from "./affiliate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(affiliateRouter);

export default router;
