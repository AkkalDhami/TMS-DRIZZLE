import { addSubtaskByTaskId } from "../services/taskService.js";

export const addSubtask = async (req, res) => {
    const { taskId } = req.params;
    const st = await addSubtaskByTaskId({ text: req.body.text, taskId: taskId });
    console.log("st: ", st);
    res.redirect(`/task`);
}