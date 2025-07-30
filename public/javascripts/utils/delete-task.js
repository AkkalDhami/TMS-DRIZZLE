export const deleteTask = async (taskId) => {
    try {
        const task = await fetch(`/task/delete/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await task.json();
        return data;
    } catch (err) {
        console.error(err);
        return {
            success: false,
            message: 'Failed to delete task'
        }
    }
}