import { showToast } from "../utils/toast.js";
import { formattedDate, statusBadage } from '../utils/badage.js';
import { toggleTaskStatus } from "../utils/toggle-task.js";
import { deleteTask } from "../utils/delete-task.js";
const toDoForm = document.getElementById("toDoForm");
const addTaskBtn = document.getElementById("addTaskBtn");
let spin = document.querySelector('.spin');

toDoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(toDoForm);
    const payload = Object.fromEntries(formData);

    // Convert date inputs to ISO string (if not empty)
    if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
    if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();

    addTaskBtn.disabled = true;
    addTaskBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i>&nbsp;Adding Task...`;

    try {
        const res = await fetch("/task/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}))

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

        // Success
        showToast(data.message || "Task added successfully", "success");
        toDoForm.reset();
        loadTasks();

    } catch (error) {
        console.error("Network or unexpected error:", error);
        showToast("Network error. Please try again.", "error");
    } finally {
        addTaskBtn.disabled = false;
        addTaskBtn.innerHTML = `<i class="fa-solid fa-plus"></i>&nbsp;Add New Task`;
    }
});


fetch('/task/api/all')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));

const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sortSelect');
const clearBtn = document.getElementById('clearFiltersBtn');

let currentStatus = "";
let currentSort = "";
let currentView = 'listView';

// Load tasks initially
loadTasks();

// open task modal
const openTaskModal = () => {
    const taskModal = document.getElementById('taskModal');
    taskModal.classList.remove('hidden');
    taskModal.classList.add('flex');
}

// close task modal
const closeTaskModal = () => {
    const taskModal = document.getElementById('taskModal');
    taskModal.classList.remove('flex');
    taskModal.classList.add('hidden');
}

document.querySelectorAll('.addTaskBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        openTaskModal();
    });
});

document.querySelectorAll('.closeTaskModal').forEach(btn => {
    btn.addEventListener('click', () => {
        closeTaskModal();
    });
});

document.querySelectorAll('#taskDisplayBtns button').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update current view
        currentView = btn.dataset.view;

        // Toggle active class
        document.querySelectorAll('#taskDisplayBtns button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Reload tasks in new format
        loadTasks();
    });
});

// delete task modal
function openDeleteTaskModal() {
    const deleteModal = document.getElementById('deleteTaskModal');
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
}

function closeDeleteTaskModal() {
    const deleteModal = document.getElementById('deleteTaskModal');
    deleteModal.classList.remove('flex');
    deleteModal.classList.add('hidden');
}

document.querySelectorAll('.closeDeleteTaskModalBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        closeDeleteTaskModal();
    });
});

// Handle status filter
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all, add to current
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentStatus = btn.dataset.filter;
        loadTasks();
    });
});

// Handle sort select
sortSelect.addEventListener('change', () => {
    const value = sortSelect.value;
    if (value === 'date-desc') {
        currentSort = 'createdAt';
        currentOrder = 'desc';
    } else if (value === 'date-asc') {
        currentSort = 'createdAt';
        currentOrder = 'asc';
    } else if (value === 'priority') {
        currentSort = 'priority';
        currentOrder = 'asc';
    } else if (value === 'due-date') {
        currentSort = 'dueDate';
        currentOrder = 'asc';
    }
    loadTasks();
});

// Handle reset
clearBtn.addEventListener('click', () => {
    currentStatus = "";
    currentSort = "createdAt";
    currentOrder = "desc";

    // Reset UI
    filterButtons.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter=""]').classList.add('active');
    sortSelect.selectedIndex = 0;

    loadTasks();
});

// Load and display tasks
async function loadTasks(page = 1) {
    const params = new URLSearchParams();
    if (currentStatus) params.append('status', currentStatus);
    if (currentSort) {
        params.append('sort', currentSort);
        params.append('order', currentOrder);
    }
    params.append('page', page);

    try {
        const res = await fetch(`/task/api/all?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
            renderTasks(data.tasks);
            // Optionally update pagination here
        } else {
            console.error('Failed to fetch tasks:', data.error);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

function renderTasks(tasks) {
    if (tasks.length === 0) {
        const container = document.getElementById('taskLists');
        container.innerHTML = '<p class="text-sm text-gray">No tasks found.</p>';
        return;
    }
    document.getElementById('taskCount').innerHTML = `All task${tasks.length > 1 ? 's' : ''}: ${tasks.length}`;
    if (currentView === 'listView') {
        const container = document.getElementById('taskLists');
        container.innerHTML = '';

        tasks.forEach(task => {
            const { title, description, subTasks, category, createdAt, dueDate, id, priority, remainder, repeat, status, startDate, updatedAt, userId } = task;
            const li = document.createElement("li");
            li.className = "task-item bg-primary ring ring-zinc-500/30 transform hover:translate-y-[-4px] relative py-3 mb-4 ring-l-2 rounded-xl border-l-5 border-blue-500  backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden";
            li.innerHTML = ` 
                    <div class="flex h-full items-start p-2 sm:p-4 gap-2 sm:gap-3 relative">

                        <div class="flex items-center">
                            <input type="checkbox" ${task.status === 'completed' ? "checked" : ""}
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
                                    <p class="line-clamp-1 text-sm sm:text-base text-gray my-1">${description}</p>
                                    <div class="flex flex-wrap text-xs sm:text-sm items-center justify-between">
                                        <div class="flex flex-wrap text-xs sm:text-sm items-center gap-4">
                                            <span
                                                class="flex items-center text-gray gap-1 py-1 rounded-full font-medium whitespace-nowrap">
                                                Due: ${formattedDate(dueDate)}
                                            </span>
                                            <span class="font-medium capitalize text-red-500">
                                                <i class="ri-flag-line mr-[2px]"></i>
                                                ${priority} Priority
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


                        ${subTasks.length > 0 ? `<div class="my-2.5">
                                <div
                                    class="flex font-medium items-center justify-between text-xs sm:text-sm text-[var(--text-gray)] mb-1.5">
                                    <div class="flex my-1 items-center gap-3">
                                        <span><i class="ri-node-tree"></i> 1/3 subtasks</span>
                                    </div>
                                    <span>33% complete</span>
                                </div>
                                <div class="h-1.5 my-1 bg-gray-200/50 rounded-md overflow-hidden">
                                    <div class="h-full bg-green-500 rounded-full transition-all duration-1000"
                                        style="width: 33.33333333333333%"></div>
                                </div>

                            </div>` : ''}


                            <div class="flex items-center flex-wrap gap-2 justify-between mt-2">
                                <div class="flex items-center gap-1">
                                    <button onclick="breakdownTask(1750328196785)"
                                        class="text-purple-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md bg-purple-500/10 hover:bg-purple-500/15 transition-colors"
                                        title="Break down task">
                                        <i class="ri-list-check-2"></i>
                                    </button>
                                    <button onclick="openEditModal(1750328196785)"
                                        class="text-blue-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md bg-blue-500/10  hover:bg-blue-500/15 transition-colors"
                                        title="Edit task">
                                        <i class="ri-edit-line"></i>
                                    </button>
                                    <button data-taskid="${id}"
                                        class="deleteTask text-red-500 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md bg-red-500/10  hover:bg-red-500/15 transition-colors"
                                        title="Delete task">
                                        <i data-taskid="${id}" class="deleteTask ri-delete-bin-line"></i>
                                    </button>
                                    <button onclick="showTaskDetailsModal(1750328196785)"
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

                    ${subTasks.length > 0 ? `<div class="subtasks-container max-h-[300px] overflow-y-auto px-1.5 sm:px-4 pb-3 pt-0 ml-8 mr-4">
                        <div class="subtasks-list space-y-2 mt-1">

                            <div class="subtask-item bg-card duration-300 flex items-center gap-2 p-2 pl-3 justify-between rounded-md border-l-3  border-green-500
                                                                                    transition-colors">
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" checked="" onchange="toggleSubtaskFromList(1750328196785, 1753700386685)"
                                        class="h-3 w-3 cursor-pointer accent-purple-500 rounded-full">
                                    <span class="text-sm line-through text-[var(--text-gray)]">
                                        1. &nbsp;asfdasdf
                                    </span>
                                </div>
                                <div class="flex text-[var(--text-gray)] items-center gap-1 sm:gap-3">
                                    <button onclick="editSubtask(1750328196785, 1753700386685)"
                                        class="p-1.5 rounded-lg  hover:text-blue-500 transition-colors" title="Edit subtask">
                                        <i class="ri-edit-line"></i>
                                    </button>
                                    <button onclick="removeSubtask(1750328196785, 1753700386685)"
                                        class="p-1.5 rounded-lg  hover:text-red-500 transition-colors" title="Delete subtask">
                                        <i class="ri-delete-bin-line"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="subtask-item bg-[var(--card-bg)] hover:bg-[var(--stat-bg)] duration-300 flex items-center gap-2 p-2 pl-3 justify-between rounded-md border-l-3  border-purple-500
                                                                                    transition-colors">
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" onchange="toggleSubtaskFromList(1750328196785, 1753700387304)"
                                        class="h-3 w-3 cursor-pointer accent-purple-500 rounded-full">
                                    <span class="text-sm text-[var(--text-color)]">
                                        2. &nbsp;asdfasdf
                                    </span>
                                </div>
                                <div class="flex text-[var(--text-gray)] items-center gap-1 sm:gap-3">
                                    <button onclick="editSubtask(1750328196785, 1753700387304)"
                                        class="p-1.5 rounded-lg  hover:text-blue-500 transition-colors" title="Edit subtask">
                                        <i class="ri-edit-line"></i>
                                    </button>
                                    <button onclick="removeSubtask(1750328196785, 1753700387304)"
                                        class="p-1.5 rounded-lg  hover:text-red-500 transition-colors" title="Delete subtask">
                                        <i class="ri-delete-bin-line"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="subtask-item bg-[var(--card-bg)] hover:bg-[var(--stat-bg)] duration-300 flex items-center gap-2 p-2 pl-3 justify-between rounded-md border-l-3  border-purple-500
                                                                                    transition-colors">
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" onchange="toggleSubtaskFromList(1750328196785, 1753700387731)"
                                        class="h-3 w-3 cursor-pointer accent-purple-500 rounded-full">
                                    <span class="text-sm text-[var(--text-color)]">
                                        3. &nbsp;asdf
                                    </span>
                                </div>
                                <div class="flex text-[var(--text-gray)] items-center gap-1 sm:gap-3">
                                    <button onclick="editSubtask(1750328196785, 1753700387731)"
                                        class="p-1.5 rounded-lg  hover:text-blue-500 transition-colors" title="Edit subtask">
                                        <i class="ri-edit-line"></i>
                                    </button>
                                    <button onclick="removeSubtask(1750328196785, 1753700387731)"
                                        class="p-1.5 rounded-lg  hover:text-red-500 transition-colors" title="Delete subtask">
                                        <i class="ri-delete-bin-line"></i>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>` : ''} 
                                    `;

            container.appendChild(li);
        })
    } else {
        const container = document.getElementById('tasksTableView');
        container.innerHTML = '';

        tasks.forEach(task => {
            const { title, description, category, createdAt, dueDate, id, priority, remainder, repeat, status, startDate, updatedAt, userId } = task;
            const row = document.createElement("tr");
            row.className = "task-text hover:bg-zinc-100 hover:dark:bg-zinc-800 duration-300";
            row.innerHTML = `
          <td class="py-4 px-4">
           <div class="flex items-center gap-3">
                <input ${status === 'completed' ? 'checked' : ''} type="checkbox" name="toggleStatus" class="w-3.5 h-3.5 cursor-pointer accent-orange-500">
                ${title}
           </div>
          </td>
          <td class="py-4 px-4">${description}</td>
          <td class="py-4 px-4">${formattedDate(dueDate)}</td>
          <td class="py-4 px-4">${priority}</td>
          <td class="py-4 px-4">${statusBadage(status)}</td>
          <td class="py-4 px-4 capitalize">${statusBadage(repeat)}</td>
           `;
            container.appendChild(row)
        });
    }
}

// task toggle
document.addEventListener('change', async (e) => {
    if (e.target.classList.contains('task-toggle-status')) {
        const taskId = e.target.dataset.taskid;
        console.log(taskId);

        spin.classList.remove('hidden');
        spin.classList.add('flex');
        const data = await toggleTaskStatus(taskId);
        if (!data.success) {
            return showToast(data.message, 'error');
        }
        spin.classList.remove('flex');
        spin.classList.add('hidden');
        loadTasks();
        showToast(data.message, 'success');
    }
});


// event listener for toggle status
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('deleteTask')) {
        const taskId = e.target.dataset.taskid;
        openDeleteTaskModal();
        document.getElementById("deleteTaskConfirmBtn").addEventListener('click', async () => {
            spin.classList.remove('hidden');
            spin.classList.add('flex');
            const data = await deleteTask(taskId);
            if (!data.success) {
                spin.classList.remove('flex');
                spin.classList.add('hidden');
                closeDeleteTaskModal();
                return showToast(data.message, 'error');
            }
            spin.classList.remove('flex');
            spin.classList.add('hidden');
            closeDeleteTaskModal();
            showToast(data.message, 'success');
            loadTasks();
        })
    }
})