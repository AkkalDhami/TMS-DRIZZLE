import { Router } from "express";
import { getDashbaordPage } from "../controllers/dashboardController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

router.get('/', isAuthenticated, getDashbaordPage);


export const dashboardRoutes = router;