import { showToast } from "./toast.js";

export const addTask = async (task) => {

    try {
        const res = await fetch("/task/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(task),
        });

        const payload = await res.json().catch(() => null);

        if (!res.ok) {
            const message = payload?.message || "Error adding task";
            const fieldErrors = payload?.errors;
            showToast(message, "error");
            return { success: false, message, fieldErrors };
        }

        showToast(payload.message || "Task added successfully", "success");
        return payload;
    } catch (err) {
        showToast(err.message, "error");
        console.error(err);
    }
};
