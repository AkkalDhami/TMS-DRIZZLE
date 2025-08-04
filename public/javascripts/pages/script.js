import { showToast } from "../utils/toast.js";
import {
    formatDateForInput,
    formattedDate,
    getPriorityColor,
    statusBadage,
} from "../utils/badage.js";
import { toggleTaskStatus } from "../utils/toggle-task.js";
import { deleteTask } from "../utils/delete-task.js";
import { togglesubtaskStatus } from "../utils/toggle-subtask.js";

let page = 1;
const limit = 10;
const paginationDiv = document.getElementById('pagination');
let alarmInterval = null;

const toDoForm = document.getElementById("toDoForm");
let modalTitle = toDoForm.querySelector("#modalTitle");
let addTaskBtn = toDoForm.querySelector("#addTaskBtn");
let spin = document.querySelector(".spin");

toDoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(toDoForm);
    const payload = Object.fromEntries(formData);

    //? Convert date inputs to ISO string (if not empty)
    if (payload.startDate)
        payload.startDate = new Date(payload.startDate).toISOString();
    if (payload.dueDate)
        payload.dueDate = new Date(payload.dueDate).toISOString();

    addTaskBtn.disabled = true;
    addTaskBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i>&nbsp;Adding Task...`;
    const isUpdate = toDoForm.action.includes("/task/update/");

    const actionUrl = toDoForm.action || "/task/add";
    const method = isUpdate ? "PATCH" : "POST";

    try {
        const res = await fetch(`${actionUrl}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const message = data?.message || "Error adding task";
            const fieldErrors = data?.errors;

            showToast(message, "error");

            if (fieldErrors) {
                const errorMessages = Object.values(fieldErrors).join(", ");
                showToast(errorMessages, "error");
            }

            return;
        }

        showToast(
            data?.message || (method === "PATCH" ? "Task updated" : "Task added"),
            "success"
        );
        toDoForm.reset();
        toDoForm.action = "";
        toDoForm.method = "POST";
        loadTasks();
        closeTaskModal();
    } catch (error) {
        console.error("Network or unexpected error:", error);
        showToast("Network error. Please try again.", "error");
    } finally {
        addTaskBtn.disabled = false;
        addTaskBtn.innerHTML = `Save Task`;
    }
});


const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sortSelect");
const clearBtn = document.getElementById("clearFiltersBtn");

let currentStatus = "";
let currentSort = "";
let currentView = "listView";
let currentOrder = "asc";

document.addEventListener("DOMContentLoaded", () => {
    loadTasks()
    checkDueDates();
    setInterval(checkDueDates, 30000);
});

function getBorderColor(status) {
    switch (status) {
        case "pending":
            return "border-amber-500";
        case "completed":
            return "border-green-500";
        case "in progress":
            return "border-blue-500";
        default:
            return "border-gray-500";
    }
}

//? open task modal
function openTaskModal() {
    const taskModal = document.getElementById("taskModal");
    taskModal.classList.remove("hidden");
    taskModal.classList.add("flex");
    toDoForm.action = `/task/add`;
    toDoForm.method = "POST";
}

//? close task modal
function closeTaskModal() {
    const taskModal = document.getElementById("taskModal");
    taskModal.classList.remove("flex");
    taskModal.classList.add("hidden");
    toDoForm.reset();
}

//? open subtask modal
function openSubTaskModal() {
    const taskModal = document.getElementById("subtaskModal");
    taskModal.classList.remove("hidden");
    taskModal.classList.add("flex");
}

//? close subtask modal
function closeSubTaskModal() {
    const taskModal = document.getElementById("subtaskModal");
    taskModal.classList.remove("flex");
    taskModal.classList.add("hidden");
}

//? open subtask modal
function openUpdateSubTaskModal() {
    const taskModal = document.getElementById("editSubtaskModal");
    taskModal.classList.remove("hidden");
    taskModal.classList.add("flex");
}

//? close subtask modal
function closeUpdateSubTaskModal() {
    const taskModal = document.getElementById("editSubtaskModal");
    taskModal.classList.remove("flex");
    taskModal.classList.add("hidden");
    document.getElementById('editSubtaskInput').value = '';
}

document.querySelectorAll(".addTaskBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
        openTaskModal();
    });
});

document.querySelectorAll(".closeUpdateSubtaskModal").forEach((btn) => {
    btn.addEventListener("click", () => {
        closeUpdateSubTaskModal();
    });
});

document.querySelectorAll(".closeSubtaskModalBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
        closeSubTaskModal();
    });
});

document.querySelectorAll(".closeTaskModal").forEach((btn) => {
    btn.addEventListener("click", () => {
        closeTaskModal();
    });
});

document.querySelectorAll("#taskDisplayBtns button").forEach((btn) => {
    btn.addEventListener("click", () => {
        currentView = btn.dataset.view;
        if (currentView === 'listView') {

            document.getElementById('taskLists').classList.remove('hidden');
            document.querySelector('.table-view').classList.add('hidden');
        } else {
            document.querySelector('#taskLists').classList.add('hidden');
            document.querySelector('.table-view').classList.remove('hidden');
        }
        document
            .querySelectorAll("#taskDisplayBtns button")
            .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        loadTasks();
    });
});


document.querySelectorAll(".closeDeleteTaskModalBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
        closeDeleteTaskModal();
    });
});

//? delete task modal
function openDeleteTaskModal() {
    const deleteModal = document.getElementById("deleteTaskModal");
    deleteModal.classList.remove("hidden");
    deleteModal.classList.add("flex");
}

function closeDeleteTaskModal() {
    const deleteModal = document.getElementById("deleteTaskModal");
    deleteModal.classList.remove("flex");
    deleteModal.classList.add("hidden");
}

//? Handle status filter
filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        //? Remove active class from all, add to current
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        currentStatus = btn.dataset.filter;
        loadTasks();
    });
});

//? Handle sort select
sortSelect.addEventListener("change", () => {
    const value = sortSelect.value;
    if (value === "date-desc") {
        currentSort = "createdAt";
        currentOrder = "desc";
    } else if (value === "date-asc") {
        currentSort = "createdAt";
        currentOrder = "asc";
    } else if (value === "priority") {
        currentSort = "priority";
        currentOrder = "asc";
    } else if (value === "due-date") {
        currentSort = "dueDate";
        currentOrder = "asc";
    }
    loadTasks();
});

//? Handle reset
clearBtn.addEventListener("click", () => {
    currentStatus = "";
    currentSort = "createdAt";
    currentOrder = "desc";

    //? Reset UI
    filterButtons.forEach((b) => b.classList.remove("active"));
    document.querySelector('[data-filter=""]').classList.add("active");
    sortSelect.selectedIndex = 0;

    loadTasks();
});

//? Load and display tasks
async function loadTasks(p = 1) {
    page = p;

    const params = new URLSearchParams();
    if (currentStatus) params.append("status", currentStatus);
    if (currentSort) {
        params.append("sort", currentSort);
        params.append("order", currentOrder);
    }
    params.append("page", page);
    params.append('limit', limit);
    try {
        const res = await fetch(`/task/api/all?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
            renderTasks(data.tasks);
            updateStats(
                data.completedTasks,
                data.pendingTasks,
                data.inProgressTasks
            );
            renderPagination(data.totalPages, data.totalTasks);
        } else {
            console.error("Failed to fetch tasks:", data.error);
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

//? Render empty tasks
function renderEmptyTasks(id) {
    const container = document.getElementById(`${id}`);
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 text-center">
                <div class="w-16 h-16 mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <i class="ri-calendar-todo-line text-3xl text-orange-500"></i>
                </div>
                <span class="text-xl font-semibold text-[var(--text-color)] mb-2">No tasks available</span>
                <p class="text-gray max-w-md">Add a new task using the form above to get started with your productivity journey.</p>
            </div>
        `;
}

//? Render tasks
function renderTasks(tasks) {
    document.getElementById("taskCount").innerHTML =
        `All task${tasks.length > 1 ? "s" : ""}: ${tasks.length}`;
    if (currentView === "listView") {
        if (tasks.length === 0) {
            return renderEmptyTasks("taskLists");
        }
        const container = document.getElementById("taskLists");
        container.innerHTML = "";

        tasks.forEach((task) => {
            const {
                title,
                description,
                subtasks,
                category,
                createdAt,
                dueDate,
                id,
                priority,
                remainder,
                repeat,
                status,
                startDate,
                updatedAt,
                userId,
            } = task;

            let completedSubtasks = subtasks.filter(
                (subtask) => subtask.isCompleted
            ).length;
            let totalSubtasks = subtasks.length;

            let completedPercentage = 0;
            if (totalSubtasks > 0) {
                completedPercentage = Math.round(
                    (completedSubtasks / totalSubtasks) * 100
                );
            }

            const li = document.createElement("li");
            li.className =
                `task-item bg-primary ring ring-zinc-500/30 transform hover:translate-y-[-4px] relative py-3 mb-4 ring-l-2 rounded-xl border-l-5 ${getBorderColor(status)} backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`;
            li.innerHTML = ` 
                    <div class="flex h-full items-start p-2 sm:p-4 gap-2 sm:gap-3 relative">

                        <div class="flex items-center">
                            <input type="checkbox" ${task.status === "completed" ? "checked" : ""}
                                data-taskid="${id}" class="task-toggle-status sm:h-4.5 w-4 sm:w-4.5 h-4 cursor-pointer accent-blue-500 rounded-full">
                        </div>

                        <div class="flex-grow task-details">
                            <div class="flex flex-col mt-[-6px] sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div class="flex-grow">
                                    <div class="flex items-center justify-between flex-wrap gap-2">
                                        <h3 onclick="window.location.href='/task/${id}'"
                                            class="task-text line-clamp-1 text-sm sm:text-lg font-medium text-dark hover:text-orange-500 transition-colors cursor-pointer">
                                            ${title}
                                        </h3>

                                    </div>
                                    <p class="line-clamp-1 text-sm sm:text-base text-zinc my-1">${description}</p>
                                    <div class="flex flex-wrap text-xs sm:text-sm items-center justify-between">
                                        <div class="flex text-gray flex-wrap text-xs sm:text-sm items-center gap-1 sm:gap-4">
                                            <span
                                                class="flex items-center text-zinc gap-1 py-1 rounded-full font-medium whitespace-nowrap">
                                                 <i class="ri-calendar-line mr-[2px]"></i> Due: ${formattedDate(dueDate)}
                                            </span>
                                            <span class="font-medium capitalize ">
                                              |
                                            </span>
                                            <span class="font-medium capitalize ">
                                            <i class="ri-flag-line mr-[2px]"></i>
                                            ${priority} Priority
                                            </span>
                                            <span class="font-medium capitalize ">
                                              |
                                            </span>
                                            <span class="font-medium capitalize ">
                                            <i class="ri-node-tree mr-[2px]"></i>
                                                ${category} Category
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-xs hidden font-medium ">
                                                ❌ Overdue by 38 days, 20 hours
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            

                        ${subtasks?.length > 0
                    ? `<div class="my-2.5">
                                <div
                                    class="flex font-medium items-center justify-between text-xs sm:text-sm text-gray mb-1.5">
                                    <div class="flex my-1 items-center gap-3">
                                        <span><i class="ri-node-tree"></i> ${completedSubtasks}/${totalSubtasks} subtasks</span>
                                    </div>
                                    <span>${Math.round(completedPercentage)}% complete</span>
                                </div>
                                <div class="h-1.5 my-1 bg-zinc-400/50 overflow-hidden">
                                    <div class="h-full bg-green-500 rounded-full transition-all duration-1000"
                                        style="width: ${completedPercentage}%"></div>
                                </div>

                            </div>`
                    : ""
                }


                            <div class="flex items-center flex-wrap gap-2 justify-between mt-2">
                                <div class="flex items-center gap-1">
                                    <button data-taskid="${id}"
                                        class="addSubTask text-orange-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md bg-orange-500/10 hover:bg-orange-500/15 transition-colors">
                                        <i class="addSubTask ri-list-check-2" data-taskid="${id}"></i>
                                    </button>
                                    <button data-taskid="${id}"
                                        class="editTask text-blue-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md bg-blue-500/10  hover:bg-blue-500/15 transition-colors"
                                        title="Edit task">
                                        <i class="ri-edit-line editTask" data-taskid="${id}"></i>
                                    </button>
                                    <button data-taskid="${id}"
                                        class="deleteTask text-red-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md bg-red-500/10  hover:bg-red-500/15 transition-colors"
                                        title="Delete task">
                                        <i data-taskid="${id}" class="deleteTask ri-delete-bin-line"></i>
                                    </button>
                                    <button onclick="window.location.href='/task/${id}'"
                                        class="text-orange-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md bg-orange-500/10  hover:bg-orange-500/15 transition-colors"
                                        title="View task details">
                                        <i class="ri-external-link-line"></i>
                                    </button>
                                </div>

                                <div class="">
                                ${statusBadage(status)}
                                </div>
                            </div>
                        </div>
                    </div>

                    ${subtasks?.length > 0
                    ? `<div class="subtasks-container max-h-[200px] overflow-y-auto px-1.5 sm:px-4 pb-3 pt-0 ml-8 mr-4">
                        <div class="subtasks-list space-y-2 mt-1">
                        ${subtasks.map(
                        (subtask, index) => `
                            <div class="subtask-item bg-card duration-300 flex items-center gap-2 p-2 pl-3 justify-between rounded-md border-l-3 ${subtask.isCompleted ? "border-green-500" : "border-amber-500"} transition-colors">
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" data-subtaskid="${subtask.id}" ${subtask.isCompleted ? "checked" : ""} 
                                        class="subtask-toggle-status h-3 w-3 cursor-pointer accent-blue-500 rounded-full">
                                    <span class="text-sm ${subtask.isCompleted ? "line-through" : ""} text-gray">
                                        ${index + 1}. &nbsp; ${subtask.text}
                                    </span>
                                </div>
                                <div class="flex text-gray items-center gap-1 sm:gap-3">
                                    <button data-subtaskid="${subtask.id}"
                                        class="editSubtask p-1.5 rounded-lg  hover:text-blue-500 transition-colors" title="Edit subtask">
                                        <i class="editSubtask  ri-edit-line" data-subtaskid="${subtask.id}"></i>
                                    </button>
                                    <button data-subtaskid="${subtask.id}"
                                        class="deleteSubtask p-1.5 rounded-lg  hover:text-red-500 transition-colors">
                                        <i class="ri-delete-bin-line deleteSubtask" data-subtaskid="${subtask.id}"></i>
                                    </button>
                                </div>
                            </div> 
                            `
                    )
                        .join("")}


                        </div>
                    </div>`
                    : ""
                } 
                                    `;

            container.appendChild(li);
        });
    }
    if (currentView === "tableView") {
        const container = document.getElementById("tasksTableView");
        container.innerHTML = "";

        if (tasks.length === 0) {
            return `<tr>
                    <td colspan="7">${renderEmptyTasks("tasksTableView")}</td>
            </tr>`;
        }

        tasks.forEach((task) => {
            const {
                title,
                description,
                category,
                createdAt,
                dueDate,
                id,
                priority,
                remainder,
                repeat,
                status,
                startDate,
                updatedAt,
                userId,
            } = task;
            const row = document.createElement("tr");
            row.className =
                "task-text hover:bg-zinc-100 hover:dark:bg-[#091121] duration-300";
            row.innerHTML = `
          <td class="py-4 px-4">
           <div class="flex items-center gap-3">
                <input ${status === "completed" ? "checked" : ""} type="checkbox" data-taskid="${id}" class="task-toggle-status w-3.5 h-3.5 cursor-pointer accent-blue-500">
                <span onclick="window.location.href='/task/${id}'" class="text-sm hover:text-green-500 cursor-pointer font-medium ${status === "completed" ? "line-through text-gray" : "text-dark"}">${title.length > 20 ? title.slice(0, 20) + "..." : title}</span>
           </div>
          </td>
          <td class="py-4 px-4">${description.length > 20 ? description.slice(0, 20) + "..." : description}</td>
          <td class="py-4 px-4">${formattedDate(dueDate)}</td>
          <td class="py-4 px-4">${getPriorityColor(priority)}</td>
          <td class="py-4 px-4">${statusBadage(status)}</td>
          <td class="py-4 px-4 capitalize">${statusBadage(repeat)}</td>
          <td class="py-4 px-4 text-end capitalize">
                                 <button data-taskid="${id}"
                                        class="addSubTask text-orange-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md hover:bg-orange-500/10 transition-colors"
                                        title="Edit task">
                                        <i class="addSubTask ri-list-check-2" data-taskid="${id}"></i>
                                    </button>
                                 <button data-taskid="${id}"
                                        class="editTask text-blue-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md hover:bg-blue-500/10 transition-colors"
                                        title="Edit task">
                                        <i class="ri-edit-line editTask" data-taskid="${id}"></i>
                                    </button>
                                    <button data-taskid="${id}"
                                        class="deleteTask text-red-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                                        title="Delete task">
                                        <i data-taskid="${id}" class="deleteTask ri-delete-bin-line"></i>
                                    </button>
          </td>
           `;
            container.appendChild(row);
        });
    }
}

//? task toggle
document.addEventListener("change", async (e) => {

    //* event listener for toggle task status
    if (e.target.classList.contains("task-toggle-status")) {
        const taskId = e.target.dataset.taskid;

        spin.classList.remove("hidden");
        spin.classList.add("flex");
        const data = await toggleTaskStatus(taskId);
        if (!data.success) {
            spin.classList.remove("flex");
            spin.classList.add("hidden");
            return showToast(data?.message, "error");
        }

        spin.classList.remove("flex");
        spin.classList.add("hidden");
        loadTasks();
        showToast(data?.message, "success");
    }

    //* event listener for toggle subtask status
    if (e.target.classList.contains("subtask-toggle-status")) {
        try {
            const subtaskid = e.target.dataset.subtaskid;

            spin.classList.remove("hidden");
            spin.classList.add("flex");
            const data = await togglesubtaskStatus(subtaskid);

            if (!data.success) {
                return showToast(data?.message, "error");
            }
            loadTasks();
            showToast(data?.message, "success");
        } catch (error) {
            console.error(error);
            showToast(error.message, "error");
        } finally {
            spin.classList.remove("flex");
            spin.classList.add("hidden");
        }
    }

});

//? event listener for toggle status
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("deleteTask")) {
        const taskId = e.target.dataset.taskid;
        openDeleteTaskModal();
        document
            .getElementById("deleteTaskConfirmBtn")
            .addEventListener("click", async () => {
                spin.classList.remove("hidden");
                spin.classList.add("flex");
                const data = await deleteTask(taskId);
                if (!data.success) {
                    spin.classList.remove("flex");
                    spin.classList.add("hidden");
                    closeDeleteTaskModal();
                    return showToast(data?.message, "error");
                }
                spin.classList.remove("flex");
                spin.classList.add("hidden");
                closeDeleteTaskModal();
                showToast(data?.message, "success");
                loadTasks();
            });
    }
});

//? edit task
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("editTask")) {
        const taskId = e.target.dataset.taskid;
        openTaskModal();
        updateFormElements(taskId);

    }
});

//? update form
function updateFormElements(taskId) {
    modalTitle.innerHTML = "Update Task";
    fetch(`/task/api/task-details/${taskId}`)
        .then((res) => res.json())
        .then(({ success, task }) => {
            if (!success) {
                return showToast(data?.message, "error");
            }

            toDoForm.elements["title"].value = task.title;
            toDoForm.elements["description"].value = task.description;
            toDoForm.elements["category"].value = task.category;
            toDoForm.elements["priority"].value = task.priority;
            toDoForm.elements["repeat"].value = task.repeat;
            toDoForm.elements["startDate"].value = formatDateForInput(
                task.startDate
            );
            toDoForm.elements["dueDate"].value = formatDateForInput(task.dueDate);
            toDoForm.elements["remainder"].value = task.remainder;

            toDoForm.action = `/task/update/${taskId}`;
            toDoForm.method = "PATCH";
        })
        .catch((err) => console.error(err))

}

//? subtask handlers
document.addEventListener("click", async (e) => {

    //? open subtask modal
    if (e.target.classList.contains("addSubTask")) {
        const taskId = e.target.dataset.taskid;

        try {
            const res = await fetch(`/task/api/task-details/${taskId}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                return showToast(data?.message || "Failed to load task", "error");
            }

            document.getElementById("parentTaskText").innerHTML =
                data.task?.title || "Unknown Task";
            document.getElementById("subtaskForm").dataset.taskid = taskId;
            openSubTaskModal();
        } catch (error) {
            console.error(error);
            showToast("Something went wrong while loading task", "error");
        }
    }

    //? add subtask when clicking actual submit button
    if (e.target.id === "submitSubtaskBtn") {
        e.preventDefault();
        const taskId = document.getElementById("subtaskForm").dataset.taskid;
        if (!taskId) return showToast("Parent task ID not found", "error");

        const data = await addSubTask(taskId);

        if (!data?.success) return showToast(data?.message, "error");
        showToast(data?.message || "Subtask added", "success");

        document.getElementById("subtaskForm").reset();
        closeSubTaskModal();
        loadTasks();
    }

    //? delete subtask
    if (e.target.classList.contains("deleteSubtask")) {
        const subtaskId = e.target.dataset.subtaskid;

        if (!subtaskId) return showToast("Subtask ID not found", "error");

        spin.classList.remove("hidden");
        spin.classList.add("flex");

        try {
            let res = await fetch(`/task/subtask/delete/${subtaskId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            });

            let data = await res.json();
            if (!res.ok) {
                return showToast(data?.message || "Failed to delete subtask", "error");
            }

            showToast(data?.message || "Subtask deleted", "success");
        } catch (error) {
            console.error("Error deleting subtask:", error);
            showToast("Network error occurred", "error");
        } finally {
            spin.classList.add("hidden");
            spin.classList.remove("flex");
            loadTasks();
        }
    }

    //? edit subtask
    if (e.target.classList.contains("editSubtask")) {
        const subtaskId = e.target.dataset.subtaskid;
        openUpdateSubTaskModal();
        await updateSubtaskFormElements(subtaskId);
    }
});

//? add subtask
async function addSubTask(taskId) {
    const subTaskForm = document.getElementById("subtaskForm");
    const formData = new FormData(subTaskForm);
    const payload = Object.fromEntries(formData);

    try {
        spin.classList.remove("hidden");
        spin.classList.add("flex");

        const res = await fetch(`/task/subtask/add/${taskId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        return data;
    } catch (error) {
        console.error("Error adding subtask:", error);
        return { success: false, message: "Network error occurred" };
    } finally {
        spin.classList.add("hidden");
        spin.classList.remove("flex");
    }
}

//? update subtask form elements
async function updateSubtaskFormElements(subtaskId) {

    try {
        const res = await fetch(`/task/subtask/api/details/${subtaskId}`);
        const subtaskData = await res.json();

        if (!res.ok || !subtaskData.success) {
            return showToast(subtaskData?.message || "Failed to load subtask", "error");
        }

        document.getElementById('editSubtaskInput').value = subtaskData.subtask.text.trim();
        document.getElementById('editSubtaskInput').focus();
        document
            .getElementById("updateSubtaskForm")
            .addEventListener("submit", async (e) => {
                e.preventDefault();
                const data = await updateSubTask(subtaskId);
                if (!data) return;
                if (!data.success) return showToast(data?.message, "error");
                showToast(data?.message || "Subtask updated successfully", "success");
                document.getElementById("updateSubtaskForm").reset();
                closeUpdateSubTaskModal();
                loadTasks();
            }, { once: true });
    } catch (error) {
        console.error(error);
        showToast("Something went wrong while loading subtask", "error");
    }

}

//? update subtask
async function updateSubTask(subtaskId) {
    const subTaskForm = document.getElementById("updateSubtaskForm");
    const formData = new FormData(subTaskForm);
    const payload = Object.fromEntries(formData);
    if (!payload.text.trim()) return showToast("Subtask is required", 'error');
    try {
        spin.classList.remove("hidden");
        spin.classList.add("flex");

        const res = await fetch(`/task/subtask/update/${subtaskId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
            return {
                success: false,
                message: data?.message || "Failed to update subtask",
            };
        }

        return data;
    } catch (error) {
        console.error("Error updating subtask:", error);
        return { success: false, message: "Network error occurred" };
    } finally {
        spin.classList.add("hidden");
        spin.classList.remove("flex");
        subTaskForm.reset();
    }
}

//? pagination
function renderPagination(totalPages, totalTasks) {
    paginationDiv.innerHTML = '';
    if (totalPages <= 1) return;

    const createBtn = (label, disabled = false, isActive = false, onClick = null) => {
        const btn = document.createElement('button');
        btn.innerHTML = label;
        btn.className = `mx-1 px-3 py-1 rounded text-sm ${isActive ? 'bg-orange-600 text-white'
            : disabled ? 'bg-zinc-500/10 text-dark cursor-not-allowed'
                : 'bg-zinc-500/20 hover:bg-zinc-500/30'
            }`;
        if (!disabled && onClick) btn.addEventListener('click', onClick);
        return btn;
    };

    // ← Previous
    paginationDiv.appendChild(
        createBtn(`<i class="ri-arrow-left-double-line"></i>`, page === 1, false, () => {
            if (page > 1) {
                page--;
                loadTasks(page);
            }
        })
    );

    // First
    if (page > 2) {
        paginationDiv.appendChild(createBtn('1', false, page === 1, () => loadTasks(1)));
        if (page > 3) {
            paginationDiv.appendChild(document.createTextNode('...'));
        }
    }

    // Previous Page
    if (page > 1) {
        paginationDiv.appendChild(createBtn(`${page - 1}`, false, false, () => loadTasks(page - 1)));
    }



    // Current
    paginationDiv.appendChild(createBtn(`${page}`, false, true));

    // Next Page
    if (page < totalPages) {
        paginationDiv.appendChild(createBtn(`${page + 1}`, false, false, () => loadTasks(page + 1)));
    }

    // Last Page
    if (page < totalPages - 1) {
        if (page < totalPages - 2) {
            paginationDiv.appendChild(document.createTextNode('...'));
        }
        paginationDiv.appendChild(createBtn(`${totalPages}`, false, page === totalPages, () => loadTasks(totalPages)));
    }

    // → Next
    paginationDiv.appendChild(
        createBtn(`<i class="ri-arrow-right-double-line"></i>`, page === totalPages, false, () => {
            if (page < totalPages) {
                loadTasks(page + 1);
            }
        })
    );
}


//? update stats
function updateStats(completedTasks, pendingTasks, inProgressTasks) {
    const totalTasks = completedTasks + pendingTasks + inProgressTasks;
    document.getElementById('totalTasksCount').textContent = totalTasks;
    document.getElementById('completedTasksCount').textContent = completedTasks;
    document.getElementById('pendingTasksCount').textContent = pendingTasks;
    document.getElementById('inProgressTasksCount').textContent = inProgressTasks;
}


async function checkDueDates() {
    try {
        const now = new Date();
        let tasks = []
        const res = await fetch('/task/all')
        const data = await res.json();
        console.log(data);
        if (!data.success) {
            return showToast(data?.message, 'error')
        }
        data.tasks.forEach((task) => {
            const dueDate = new Date(task.dueDate);
            const alarmDateTime = new Date(dueDate.getTime() - task.remainder * 1000);

            if (
                task.status === "pending" &&
                alarmDateTime <= now

            ) {
                showToast(`${task.title} is due now`, 'alarm')
                if (task.repeat !== "none") {
                    // resetRepeatingTask(task);
                    console.log('asdfasdf');
                }
            }
        });

        loadTasks();
    } catch (error) {
        console.error(error);
    }
}

function playAlarm() {
    const alarm = document.getElementById("alarmSound");
    alarm.play().catch((error) => console.log("Error playing alarm:", error));
}

function stopAlarm() {
    const alarm = document.getElementById("alarmSound");
    alarm.pause();
    alarm.currentTime = 0;
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
}
