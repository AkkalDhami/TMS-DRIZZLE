import { addNewTask, deleteTaskById, getAllTasksByUserId, getAllTasksDetailsByUserId, getCompletedTasksByUserId, getInProgressTasksByUserId, getPendingTasksByUserId, getTaskById, updateSubtasksStatus, updateTaskById, updateTaskStatus } from "../services/taskService.js";
import { addTaskSchema } from "../validators/taskValidators.js";

// get task page
export const getTaskPage = (req, res) => {
    try {
        res.render('pages/task', {
            title: 'Task Page',
            location: '/taskpage'
        });
    } catch (error) {
        console.error('Error rendering task page:', error);
        res.status(500).send('Internal Server Error');
    }
}

// get calender page
export const getCalenderPage = (req, res) => {
    try {
        res.render('pages/calender', {
            title: 'Calender Page',
            location: '/calender'
        });
    } catch (error) {
        console.error('Error rendering calender page:', error);
        res.status(500).send('Internal Server Error');
    }
}


// get task details page
export const getTaskDetailsPage = (req, res) => {
    try {
        res.render('pages/task-details', {
            title: 'Task Details Page',
            location: '/task'
        });
    } catch (error) {
        console.error('Error rendering task details page:', error);
        res.status(500).send('Internal Server Error');
    }
}

// add task
export const addTask = async (req, res) => {
    try {
        const result = addTaskSchema.safeParse(req.body);

        if (!result.success) {
            const errorMessage = result.error.errors[0].message;

            return res.status(400).json({
                success: false,
                message: errorMessage,
            });
        }

        const taskData = result.data;
        console.log(taskData);
        await addNewTask({ ...taskData, userId: req.user.id });

        return res.status(200).json({
            success: true,
            message: 'Task added successfully'
        });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
};

// all tasks
export const getAllTasks = async (req, res) => {
    try {
        const tasks = await getAllTasksByUserId(req.user.id);

        res.status(200).json({
            success: true,
            tasks
        })

    } catch (error) {
        console.log(error);
        res.status(200).json({
            success: true,
            message: error.message || 'Internal Server Error'
        })
    }
}

// all filtered tasks api
export const getFilteredTasks = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sort = 'createdAt', order = 'desc' } = req.query;

        const { tasks, totalCount } = await getAllTasksDetailsByUserId({
            userId: req.user.id,
            status,
            sort,
            order,
            limit: Number(limit),
            offset: (Number(page) - 1) * 10,
        });

        const totalTasks = await getAllTasksByUserId(req.user.id);
        const completedTasks = await getCompletedTasksByUserId(req.user.id);
        const pendingTasks = await getPendingTasksByUserId(req.user.id);
        const inProgressTasks = await getInProgressTasksByUserId(req.user.id);

        const totalPages = Math.ceil(totalCount / limit);
        res.status(200).json({
            success: true,
            tasks,
            totalPages,
            totalCount,
            completedTasks: completedTasks.length,
            pendingTasks: pendingTasks.length,
            inProgressTasks: inProgressTasks.length,
            totalTasks: totalTasks.length
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// task details api
export const getTaskDetailsApi = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        const task = await getTaskById(taskId);
        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
}

// update task
export const updateTask = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        if (!taskId) return res.status(400).json({
            success: false,
            message: 'Invalid task id'
        });

        const data = req.body;
      
        await updateTaskById({ taskId, userId: req.user.id, ...data });
        res.status(200).json({
            success: true,
            message: 'Task updated successfully'
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
}

// toggle status
export const toggleTaskStatus = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        const task = await getTaskById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date() : null;

        await updateTaskStatus(taskId, { status: newStatus, completedAt });

        await updateSubtasksStatus(taskId, { status: newStatus, completedAt });

        res.status(200).json({
            success: true,
            message: `Task marked as ${newStatus}`,
            newStatus,
        });
    } catch (error) {
        console.error('Error toggling task status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// delete task
export const deleteTask = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        if (!taskId) return res.status(400).json({ success: false, message: 'Invalid task id' });
        await deleteTaskById(taskId);
        res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};