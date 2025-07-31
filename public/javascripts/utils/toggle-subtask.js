export const togglesubtaskStatus = async (subtaskId) => {
    try {
        const task = await fetch(`/task/subtask/update/${subtaskId}/toggle-status`, {
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