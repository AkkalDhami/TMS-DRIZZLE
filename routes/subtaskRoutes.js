import { Router } from "express";
import { addSubtask, deleteSubtask, getSubtaskDetails, toggleSubtaskStatus, updateSubtask } from "../controllers/subtaskController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";


const router = Router();

router.get('/api/details/:id', isAuthenticated, getSubtaskDetails)

router.post('/add/:taskId', isAuthenticated, addSubtask);

router.patch('/update/:id/toggle-status', isAuthenticated, toggleSubtaskStatus);

router.delete('/delete/:id', isAuthenticated, deleteSubtask);

router.patch('/update/:id', isAuthenticated, updateSubtask);

export const subtaskRoutes = router;
