export const toggleTaskStatus = async (taskId) => {
    try {
        const task = await fetch(`/task/update/${taskId}/toggle-status`, {
            method: 'PATCH',
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
            message: 'An error occurred'
        };
    }
}