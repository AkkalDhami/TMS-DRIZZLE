import { addSubtaskByTaskId, deleteSubtaskById, findSubtaskById, updateSubtaskById, updateSubtaskStatusById } from "../services/taskService.js";

//? GET SUBTASK DETAILS
export const getSubtaskDetails = async (req, res) => {
    try {
        const subtaskId = Number(req.params.id);
        const [subtask] = await findSubtaskById(subtaskId);
        res.status(200).json({
            success: true,
            subtask
        });
    } catch (error) {
        console.error('Error fetching subtask details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

//? ADD SUBTASK
export const addSubtask = async (req, res) => {
    let { taskId } = req.params
    try {
        if (!taskId) return res.status(400).json({
            success: false,
            message: 'Invalid task id'
        });
        await addSubtaskByTaskId({ text: req.body.text, taskId });
        res.status(200).json({
            success: true,
            message: 'Subtask added successfully'
        });
    } catch (error) {
        console.error("Error adding subtask:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
}

//? TOGGLE SUBTASK STATUS
export const toggleSubtaskStatus = async (req, res) => {
    try {
        const subtaskId = Number(req.params.id);

        if (!subtaskId) return res.status(400).json({
            success: false,
            message: 'Subtask not found'
        });

        const [subtask] = await findSubtaskById(subtaskId);

        if (!subtask) return res.status(400).json({
            success: false,
            message: 'Subtask not found'
        });

        const isCompleted = !subtask.isCompleted;

        await updateSubtaskStatusById({ subtaskId, isCompleted });

        res.status(200).json({
            success: true,
            message: `Subtask marked as ${isCompleted ? 'completed' : 'incomplete'}`
        });
    } catch (error) {
        console.error('Error toggling subtask status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

//? DELETE SUBTASK
export const deleteSubtask = async (req, res) => {
    try {
        const subtaskId = Number(req.params.id);

        if (!subtaskId) return res.status(400).json({
            success: false,
            message: 'Invalid subtask id'
        });

        await deleteSubtaskById(subtaskId);

        res.status(200).json({
            success: true,
            message: 'Subtask deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

//? UPDATE SUBTASK
export const updateSubtask = async (req, res) => {
    try {
        const subtaskId = Number(req.params.id);
        if (!subtaskId) return res.status(400).json({
            success: false,
            message: 'Invalid subtask id'
        });
        await updateSubtaskById({ subtaskId, text: req.body.text });
        res.status(200).json({
            success: true,
            message: 'Subtask updated successfully'
        });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}