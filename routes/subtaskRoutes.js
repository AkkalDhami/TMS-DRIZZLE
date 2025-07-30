import { Router } from "express";
import { addSubtask } from "../controllers/subtaskController.js";


const router = Router();

router.post('/add/:taskId', addSubtask);

export const subtaskRoutes = router;
