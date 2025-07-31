import { formattedDate, formatTimeAgo, getPriorityColor, statusBadage } from "../utils/badage.js";

const taskId = window.location.pathname.split("/")[2];


fetch(`/task/api/task-details/${taskId}`)
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            console.log(data);
            renderTask(data.task);
        }
    })
    .catch((err) => console.error(err));

let taskCardContainer = document.querySelector("#taskCardContainer");

function returnTimeToCompleteTask(startDate, completedAt) {
    if (!startDate || !completedAt) return "N/A";
    const diffMs = new Date(completedAt) - new Date(startDate);
    if (diffMs <= 0) return "N/A";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(diffMins / (60 * 24));
    const hours = Math.floor((diffMins % (60 * 24)) / 60);
    const minutes = diffMins % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

    return parts.join(', ');
}

function renderTask(task) {
    taskCardContainer.innerHTML = "";
    let { id, title, category, dueDate, createdAt, startDate, updatedAt, notes, priority, status, repeat, subtasks, description, completedAt } = task;

    // document.querySelector("#taskDueDate").innerHTML = `${fromatDueDate}`;

    // let ctx = document.getElementById("dailyDistributionChart").getContext("2d");

    const hasSubtasks = task.subtasks.length > 0;
    // generateDailyChartByType(ctx, new Date(dueDate), 'bar');
    const completedSubtask = task.subtasks.filter((st) => st.isCompleted).length
    const subtasksTotal = task.subtasks.length
    taskCardContainer.innerHTML += `
         <div id="${id}"
                class="p-5 rounded-lg bg-primary  shadow-md hover:shadow-lg transition-shadow border-2 border-gray-500/20 hover:border-orange-500 duration-300">

                <div class="flex items-start gap-[4px] sm:gap-2">
                    <div class="mt-1 w-5 h-5 flex-shrink-0 flex items-center justify-center">
                        <i class="${status === 'completed' ? 'ri-checkbox-circle-fill text-green-500' : 'ri-circle-line text-gray'}  mr-2  text-base sm:text-[18px]"></i>
                    </div>
                    <div class="w-full">
                        <div class="mb-[2px]">
                            <h3 class="text-lg font-semibold ${status === 'completed' ? 'line-through opacity-70' : ''}">${title}</h3>
                            <p class="text-gray text-xs sm:text-base">${description || 'No description'}</p>
                        </div>
                        <div class="flex items-center text-gray justify-end mt-2 font-normal text-xs sm:text-[14px] gap-2">
                      ${task.status !== 'completed' ? getDueStatus(task.dueDate) : ''} 
                        </div>
                  
                        <section class="rounded-lg py-3 mt-2">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 space-x-1.5 gap-[18px_12px]">

                                <div
                                    class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-purple-500">
                                    <div>
                                        <p class="text-sm sm:text-[18px] text-purple-500 mb-2 font-semibold">
                                            <i class="ri-calendar-line"></i>&nbsp; CREATED AT
                                        </p>
                                        <p class="text-xs sm:text-base  font-medium">${formattedDate(createdAt)}</p>
                                    </div>
                                </div>

                                <div
                                    class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-fuchsia-500">
                                    <div>
                                        <p class="text-sm sm:text-[18px] text-fuchsia-500 mb-2 font-semibold">
                                            <i class="ri-calendar-2-line"></i>&nbsp; STARTED AT
                                        </p>
                                        <p class="text-xs sm:text-base  font-medium">${formattedDate(startDate)}</p>
                                    </div>
                                </div>

                                <div
                                    class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-green-500">
                                    <div>
                                        <p class="text-sm sm:text-[18px] mb-2 text-green-500 font-semibold">
                                            <i class="ri-timer-line"></i>&nbsp; DUE DATE
                                        </p>
                                        <p class="text-xs sm:text-base  font-medium">${formattedDate(dueDate)}</p>
                                    </div>
                                </div>

                                
                                <div class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-indigo-500">
                                <div>
                                    <p class="text-xs sm:text-base text-indigo-500 mb-2  font-semibold"> <i
                                                class="ri-calendar-line"></i>&nbsp; LAST COMPLETED</p>
                                    <p class="text-xs sm:text-sm  font-medium">${completedAt ? `${formatTimeAgo(completedAt)}` : 'Not Completed yet'}</p>
                                </div>
                            </div>  

                               


                                <div
                                    class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-orange-500">
                                    <div>
                                        <p class="text-sm sm:text-[18px] mb-2 text-orange-500 font-semibold">
                                            <i class="ri-repeat-line"></i>&nbsp; REPEATED
                                        </p>
                                        <p class="text-xs sm:text-base capitalize font-medium">${repeat}</p>
                                    </div>
                                </div>

                                <div
                                    class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-blue-500">
                                    <div>
                                        <p class="text-sm sm:text-[18px] mb-2 text-blue-500 font-semibold">
                                            <i class="ri-flashlight-line"></i>&nbsp; PRIORITY
                                        </p>
                                        <p class="text-xs sm:text-base font-medium capitalize">${priority}</p>
                                    </div>
                                </div>

                                
                                <div
                                    class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-cyan-500">
                                    <div>
                                        <p class="text-sm sm:text-[18px] text-cyan-500 mb-2 font-semibold">
                                            <i class="ri-node-tree"></i>&nbsp; CATEGORY
                                        </p>
                                        <p class="text-xs sm:text-base capitalize font-medium">${category}</p>
                                    </div>
                                </div>

                                <div
                                    class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-pink-500">
                                    <div>
                                        <p class="text-sm sm:text-[18px] mb-2 text-pink-500 font-semibold">
                                           <i class="ri-fire-line"></i>&nbsp; STATUS
                                        </p>
                                        <p class="text-xs sm:text-base font-medium">${task.status === "completed" ? "Completed" : task.status === "in-progress" ? "In Progress" : "Pending"}</p>
                                    </div>
                                </div>

                                <div
                                    class="p-3 bg-card rounded-xl border duration-300 border-gray-500/30 hover:border-red-500">
                                    <div>
                                        <p class="text-sm uppercase sm:text-[18px] text-red-500 mb-2 font-semibold">
                                          <i class="ri-hourglass-2-line"></i>&nbsp; Total Duration
                                        </p>
                                        <p class="text-xs sm:text-base  font-medium">${status !== 'completed' ? 'Not Completed Yet' : returnTimeToCompleteTask(startDate, completedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="notesSection" class="mt-6 border-t border-zinc-500/30 pt-4">
                            <h3 class="font-medium text-orange-500 text-[14px] sm:text-xl mb-3">
                                Notes &amp; Documentation
                            </h3>
                        ${notes?.length > 0
            ? `<div id="notesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-5 gap-6 mb-2">
                ${notes.map((note) => {
                let { id, title, content, updatedAt, createdAt } = note;
                return `  <div class="note-card bg-card  duration-300 rounded-xl  transition-all border-t-4 border-teal-500 overflow-hidden"
                                    data-note-id="note0">
                                    <div class="px-6 py-3">
                                        <div class="flex items-start justify-between mb-4">
                                            <h3 class="text-lg font-semibold">${title}</h3>
                                        </div>

                                        <p class="text-gray break-words line-clamp-3 whitespace-pre-line">${content} </p>
                                    </div>
                                    <div class="note-actions px-6 pb-3">
                                        <div class="flex justify-between text-sm space-x-3">
                                            <div class="text-gray">
                                                <span>${formattedDate(createdAt)}</span>
                                            </div>
                                            <div class="flex items-center gap-1">
                                                <button onclick="openNoteDetailsModal(${task.id}, ${id})"
                                                    class="view-note-btn p-2 text-gray hover:text-green-600 hover:bg-green-500/10 rounded-lg transition-colors">
                                                    <i class="fa-solid fa-expand"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>`
            }).join(" ")}
                              
            </div>`
            : `<p class="text-gray italic">No notes available for this task.</p>`}    
                        </section>
                   
                        <section id="subtaskSection" class="mt-6 border-t border-zinc-500/30 pt-4">
                            <h3 class="font-medium text-orange-500 text-[14px] sm:text-xl mb-3">
                                Subtasks
                            </h3>
                        ${hasSubtasks
            ? `   <div class="my-2.5">
                                <div
                                    class="flex font-medium items-center justify-between text-xs sm:text-sm text-gray mb-1.5">
                                    <div class="flex my-1 items-center gap-3">
                                        <span>${completedSubtask} of ${subtasksTotal} completed</span>
                                    </div>
                                    <span>${Math.round(
                (completedSubtask / subtasksTotal) * 100
            )}% complete</span>
                                </div>
                                <div class="h-1.5 my-1 bg-gray-200/50 rounded-md overflow-hidden">
                                    <div class="h-full bg-green-500 rounded-full transition-all duration-1000"
                                        style="width: ${(completedSubtask / subtasksTotal) * 100}%"></div>
                                </div>
                            </div>

                            <div id="subtasksDetailList" class="max-h-[300px] overflow-y-auto rounded-lg py-5 px-1">
                            ${subtasks.map((subtask, i) => {
                let { id, text, isCompleted } = subtask;

                return ` <div id="${id}"
                                    class="pl-2 mb-2 duration-300 flex gap-2 bg-card  py-4 rounded-md px-3">
                                    <i
                                        class="${isCompleted ? 'ri-checkbox-circle-fill text-green-500' : 'ri-circle-line text-gray'}  mr-2  text-base sm:text-[18px]"></i>
                                    <span class="${isCompleted ? 'line-through opacity-70' : ''}">${i + 1}. &nbsp;${text}</span>
                                </div>`
            }).join(" ")}
                              
                            </div>`
            : `<p class="text-gray italic">No subtask available for this task.</p>`}
                        </section>
                        <div class="flex justify-between flex-wrap gap-2 mt-4">
                            <div
                                class="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-cyan-500/10 text-cyan-600 capitalize">
                                ${category}
                            </div>
                            <div class="flex flex-wrap gap-1.5">
                                <span
                                    class="px-3 py-1.5 rounded-full text-xs sm:text-sm capitalize font-medium">
                                      ${getPriorityColor(priority)}</span>
                                <span
                                    class="px-3 py-1.5  rounded-full text-xs sm:text-sm font-medium "> ${statusBadage(task.status)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `

}

export function getDueStatus(dueDateStr) {
    const now = new Date();
    const dueDate = new Date(dueDateStr);
    const diffMs = dueDate - now;
    const isOverdue = diffMs < 0;
    const diff = Math.abs(diffMs);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (isOverdue) {
        if (days === 0 && hours === 0) {
            return `❌ Overdue by ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (days === 0) {
            return `❌ Overdue by ${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
            return `❌ Overdue by ${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
        }
    } else {
        if (days === 0 && hours === 0 && minutes <= 1) {
            return `🟡 Due very soon`;
        } else if (days === 0 && hours === 0) {
            return `🕐 Due in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (days === 0) {
            return `⏳ Due in ${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (days === 1) {
            return `📅 Due tomorrow (${hours}h ${minutes}m remaining)`;
        } else {
            return `📆 Due in ${days} days, ${hours} hour${hours !== 1 ? 's' : ''}`;
        }
    }
}