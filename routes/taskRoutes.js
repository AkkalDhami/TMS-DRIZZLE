import { Router } from "express";
import { addTask, deleteTask, getAllTasks, getCalenderPage, getFilteredTasks, getTaskDetailsApi, getTaskDetailsPage, getTaskPage, toggleTaskStatus, updateTask } from "../controllers/taskController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";


const router = Router();

router.get('/', isAuthenticated, getTaskPage);
router.get('/calender', isAuthenticated, getCalenderPage);
router.get('/all', isAuthenticated, getAllTasks);

router.get('/api/all', isAuthenticated, getFilteredTasks);
router.get('/:id', isAuthenticated, getTaskDetailsPage);
router.get('/api/task-details/:id', isAuthenticated, getTaskDetailsApi);

router.post('/add', isAuthenticated, addTask);

router.patch('/update/:id', isAuthenticated, updateTask);
router.patch('/update/:id/toggle-status', isAuthenticated, toggleTaskStatus);

router.delete('/delete/:id', isAuthenticated, deleteTask);
export const taskRoutes = router;