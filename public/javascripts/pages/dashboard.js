let tasks = [];
let trendChartInstance = null;
let categoryChartInstance = null;
let priorityChartInstance = null;
let repeatableChartInstance = null;
let weeklyChartInstance = null;
let dailyChartInstance = null;
let heatmapInstance = null;
let timeDistributionChartInstance = null;
let productivityChartInstance = null;
document.getElementById("dailyDistributionDate").valueAsDate = new Date();

fetch(`/task/api/all`)
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
        if (data.success) {
            tasks = data.tasks;
            updateDashboardStats();
            updateUserStats();
            renderCategoryChart();
            renderTrendChart();
            renderPriorityChart();
            updateRecentTasks();
            renderTimeDistributionChart();
            updateProductivityScore();
            renderCompletionHeatmap();
            updateCategoryPerformance();
            renderRepeatableChart();
        }
    })
    .catch((err) => console.error(err));


// Calculate user statistics
function updateUserStats() {

    console.log(tasks);
    const timeDistribution = Array(24).fill(0);
    tasks.forEach(task => {
        if (task.status === 'completed') {
            const hour = new Date(task.completedAt || task.createdAt).getHours();
            timeDistribution[hour]++;
        }
    });
    const maxCompletions = Math.max(...timeDistribution);
    const mostProductiveHour = timeDistribution.indexOf(maxCompletions);
    if (maxCompletions > 0) {
        document.getElementById('mostProductiveTime').textContent =
            `${mostProductiveHour}:00 to ${(mostProductiveHour + 1) % 24}:00`;
    }

    // Calculate favorite category
    const categoryCount = {};
    tasks.forEach(task => {
        categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    });
    const favoriteCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    if (favoriteCategory) {
        document.getElementById('favoriteCategory').textContent = favoriteCategory[0];
    }

    // Calculate best completion day
    const dayCompletion = {};
    tasks.forEach(task => {
        if (task.status === 'completed') {
            const day = new Date(task.completedAt || task.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
            dayCompletion[day] = (dayCompletion[day] || 0) + 1;
        }
    });
    const bestDay = Object.entries(dayCompletion).sort((a, b) => b[1] - a[1])[0];
    if (bestDay) {
        document.getElementById('bestCompletionDay').textContent = bestDay[0];
    }
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    const tooltip = document.getElementById("tooltip");
    document.getElementById("progress-bar").style.width = `${percentage}%`;
    tooltip.textContent = `${percentage}% completed`;
    document.getElementById(
        "progressPercentage"
    ).innerHTML = `${completed} of ${total} tasks completed`;
}



// Update dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    updateUserStats();
    renderCategoryChart();
    renderTrendChart();
    renderPriorityChart();
    updateRecentTasks();
    renderTimeDistributionChart();
    updateProductivityScore();
    renderCompletionHeatmap();
    updateCategoryPerformance();
    renderRepeatableChart();
});


// Update all dashboard statistics
function updateDashboardStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Due soon (next 24 hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueSoon = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return task.status !== 'completed' && dueDate >= now && dueDate <= tomorrow;
    }).length;

    // Overdue tasks
    const overdue = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return task.status !== 'completed' && dueDate < now;
    }).length;

    // Completed Tasks
    document.getElementById('completedTasksCount').textContent = completedTasks;

    // In Progress Tasks (not completed)
    const inProgressTasks = tasks.filter(task => task.status === 'in progress');
    const inPendingTasks = tasks.filter(task => task.status === 'pending');
    document.getElementById('inPendingCount').textContent = inPendingTasks.length;
    document.getElementById('inProgressCount').textContent = inProgressTasks.length;


    tomorrow.setDate(now.getDate() + 1);

    const dueSoonTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate > now && dueDate <= tomorrow && task.status !== 'completed';
    });
    document.getElementById('dueSoonCount').textContent = dueSoonTasks.length;


    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const upcomingTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate > now && dueDate <= nextWeek && task.status !== 'completed';
    });
    document.getElementById('upcomingTasksCount').textContent = upcomingTasks.length;

    // High Priority Tasks
    const highPriorityTasks = tasks.filter(task =>
        task.priority === 'high' && task.status !== 'completed'
    );
    document.getElementById('priorityCount').textContent = highPriorityTasks.length;

    document.getElementById('totalTasksCount').textContent = totalTasks;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    document.getElementById('dueSoonCount').textContent = dueSoon;
    document.getElementById('overdueCount').textContent = overdue;
}

// Render category distribution chart
function renderCategoryChart() {
    const categories = {};
    tasks.forEach(task => {
        categories[task.category] = (categories[task.category] || 0) + 1;
    });
    console.log(tasks);

    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#8b5cf6',
                    '#3b82f6',
                    '#ef4444',
                    '#22c55e',
                    '#f59e0b',
                    '#64748b'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index'
                },
                legend: {
                    position: 'right'
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

// Render task completion trend chart
function renderTrendChart() {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
    }).reverse();

    const completedByDay = last7Days.map(date => {
        return tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate.toDateString() === date.toDateString() && task.status === 'completed';
        }).length;
    });

    const totalByDay = last7Days.map(date => {
        return tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate.toDateString() === date.toDateString();
        }).length;
    });

    const ctx = document.getElementById('trendChart').getContext('2d');

    // ✅ Destroy previous instance
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    // Create new instance
    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(date => date.toLocaleDateString('en-US', { weekday: 'short' })),
            datasets: [
                {
                    label: 'Total Tasks',
                    data: totalByDay,
                    borderColor: '#8b5cf6',
                    tension: 0.4
                },
                {
                    label: 'Completed Tasks',
                    data: completedByDay,
                    borderColor: '#22c55e',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index'
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Render priority distribution chart
function renderPriorityChart() {
    const priorities = {
        high: tasks.filter(task => task.priority === 'high').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        low: tasks.filter(task => task.priority === 'low').length
    };

    const ctx = document.getElementById('priorityChart').getContext('2d');
    if (priorityChartInstance) {
        priorityChartInstance.destroy();
    }
    priorityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [priorities.high, priorities.medium, priorities.low],
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Repeat the task distribution 
function renderRepeatableChart() {
    const repeatableTasks = tasks.filter(task => task.repeat);
    const dailyCount = repeatableTasks.filter(task => task.repeat === 'daily').length;
    const weeklyCount = repeatableTasks.filter(task => task.repeat === 'weekly').length;
    const monthlyCount = repeatableTasks.filter(task => task.repeat === 'monthly').length;
    const noneCount = repeatableTasks.filter(task => task.repeat === 'none').length;


    const ctx = document.getElementById('repeatableChart').getContext('2d');

    if (repeatableChartInstance) {
        repeatableChartInstance.destroy();
    }

    repeatableChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Daily', 'Weekly', 'Monthly', 'No Repeat'],
            datasets: [{
                data: [dailyCount, weeklyCount, monthlyCount, noneCount],
                backgroundColor: ['#8b5cf6', '#3b82f6', '#ef4444', '#22c55e']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} tasks`;
                        }
                    }
                }
            }

        }
    });

}

// Update recent tasks list
function updateRecentTasks() {
    const recentTasksContainer = document.getElementById('recentTasks');
    const recentTasks = [...tasks]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    recentTasksContainer.innerHTML = recentTasks.length > 0 ?
        recentTasks.map(task => {
            let formattedCreatedAt = new Date(task.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })
            return `
            <div class="flex items-center justify-between duration-300 p-4 bg-card rounded-lg">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}"></div>
                    <span class="${task.status === 'completed' ? 'line-through opacity-70' : ''}">${task.title}</span>
                </div>
                <span class="text-sm text-[var(--text-gray)]">${formattedCreatedAt}</span>
            </div>
        `}).join('') :
        '<p class="text-center text-[var(--text-gray)]">No tasks available</p>';
}

// Render time distribution chart
function renderTimeDistributionChart() {
    const timeSlots = Array.from({ length: 24 }, (_, i) => i);
    const distribution = timeSlots.map(hour => {
        return tasks.filter(task => new Date(task.createdAt).getHours() === hour).length;
    });

    const ctx = document.getElementById('timeDistributionChart').getContext('2d');

    if (timeDistributionChartInstance) {
        timeDistributionChartInstance.destroy();
    }

    timeDistributionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: timeSlots.map(hour => `${hour}:00`),
            datasets: [{
                data: distribution,
                backgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Calculate and update productivity score
function updateProductivityScore() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeekTasks = tasks.filter(task => new Date(task.createdAt) >= startOfWeek);
    const lastWeekTasks = tasks.filter(task => {
        const date = new Date(task.createdAt);
        return date >= startOfLastWeek && date < startOfWeek;
    });

    const thisWeekScore = calculateProductivityScore(thisWeekTasks);
    const lastWeekScore = calculateProductivityScore(lastWeekTasks);
    const trend = lastWeekScore ? ((thisWeekScore - lastWeekScore) / lastWeekScore * 100).toFixed(1) : 0;

    document.getElementById('productivityScore').textContent = thisWeekScore;
    document.getElementById('productivityTrend').textContent = `${trend > 0 ? '+' : ''}${trend}%`;

    renderProductivityTrendChart(thisWeekTasks);
}

function calculateProductivityScore(taskList) {
    const completed = taskList.filter(task => task.status === 'completed').length;
    const onTime = taskList.filter(task => {
        if (task.status !== 'completed') return false;
        const dueDate = new Date(task.dueDate);
        const completedDate = new Date(task.completedAt || task.createdAt);
        return completedDate <= dueDate;
    }).length;

    return Math.round((completed * 0.6 + onTime * 0.4) * 100 / (taskList.length || 1));
}

function renderProductivityTrendChart(weekTasks) {
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - date.getDay() + i);
        return date;
    });

    const scores = days.map(date => {
        const dayTasks = weekTasks.filter(task =>
            new Date(task.createdAt).toDateString() === date.toDateString()
        );
        return calculateProductivityScore(dayTasks);
    });

    const ctx = document.getElementById('productivityTrendChart').getContext('2d');

    if (productivityChartInstance) {
        productivityChartInstance.destroy();
    }

    productivityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days.map(date => date.toLocaleDateString('en-US', { weekday: 'short' })),
            datasets: [{
                data: scores,
                borderColor: '#8b5cf6',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Render task completion heatmap
function renderCompletionHeatmap() {
    const weeks = 4;
    const days = Array.from({ length: weeks * 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (weeks * 7 - i - 1));
        return date;
    });

    const data = days.map(date => ({
        x: date.getDay(),
        y: Math.floor((weeks * 7 - (days[days.length - 1].getTime() - date.getTime()) / (24 * 60 * 60 * 1000)) / 7),
        v: tasks.filter(task =>
            new Date(task.completedAt || task.createdAt).toDateString() === date.toDateString() && task.status === 'completed'
        ).length
    }));

    const ctx = document.getElementById('completionHeatmap').getContext('2d');

    if (heatmapInstance) {
        heatmapInstance.destroy();
    }
    heatmapInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                data: data.map(d => ({ x: d.x, y: d.y, value: d.v })),
                pointBackgroundColor: data.map(d => {
                    const value = d.v;
                    const alpha = value === 0 ? 0.1 : (0.2 + value * 0.2);
                    return `rgba(139, 92, 246, ${alpha})`;
                }),
                pointRadius: 15,
                pointHoverRadius: 15,
                borderWidth: 1,
                borderColor: 'rgba(139, 92, 246, 0.2)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    min: -0.5,
                    max: 3.5,
                    reverse: true,
                    ticks: {
                        display: false
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    type: 'linear',
                    min: -0.5,
                    max: 6.5,
                    ticks: {
                        callback: value => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][value],
                        stepSize: 1
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label: (context) => {
                            const data = context.dataset.data[context.dataIndex];
                            const date = days[context.dataIndex];
                            return `${date.toLocaleDateString()}: ${data.value} tasks completed`;
                        }
                    }
                }
            }
        }
    });
}

// Update category performance analysis
function updateCategoryPerformance() {
    const categoryStats = {};
    tasks.forEach(task => {
        if (!categoryStats[task.category]) {
            categoryStats[task.category] = {
                total: 0,
                completed: 0,
                onTime: 0
            };
        }

        categoryStats[task.category].total++;
        if (task.status === 'completed') {
            categoryStats[task.category].completed++;
            const completedDate = new Date(task.completedAt || task.createdAt);
            const dueDate = new Date(task.dueDate);
            if (completedDate <= dueDate) {
                categoryStats[task.category].onTime++;
            }
        }
    });

    const categoryPerformanceContainer = document.getElementById('categoryPerformance');
    categoryPerformanceContainer.innerHTML = Object.entries(categoryStats)
        .map(([category, stats]) => {
            const completionRate = Math.round((stats.completed / stats.total) * 100);
            const onTimeRate = Math.round((stats.onTime / stats.completed) * 100) || 0;

            return `
                <div class="p-4 bg-card rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-semibold">${category}</h4>
                        <span class="text-sm text-[var(--text-gray)]">${stats.completed}/${stats.total} tasks</span>
                    </div>
                    <div class="space-y-2">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span>Completion Rate</span>
                                <span>${completionRate}%</span>
                            </div>
                            <div class="h-2 bg-[var(--primary-bg)] rounded-full overflow-hidden">
                                <div class="h-full bg-purple-500" style="width: ${completionRate}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span>On-time Rate</span>
                                <span>${onTimeRate}%</span>
                            </div>
                            <div class="h-2 bg-[var(--primary-bg)] rounded-full overflow-hidden">
                                <div class="h-full bg-green-500" style="width: ${onTimeRate}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('') || '<p class="text-center text-[var(--text-gray)]">No categories available</p>';
}

document.getElementById("updateDailyDistributionBtn").addEventListener("click", function (e) {
    e.preventDefault();
    const dueDateInput = document.getElementById("dailyDistributionDate");

    const dueDate = new Date(dueDateInput.value);
    const ctx = document.getElementById("dailyDistributionChart").getContext("2d");

    if (!isNaN(dueDate.getTime())) {
        generateDailyChartByType(ctx, dueDate);

    }

    if (dueDateInput) {
        dueDate.setHours(0, 0, 0, 0);
        if (!isNaN(dueDate.getTime())) {
            generateDailyChartByType(ctx, dueDate);
        } else {
            alert("Please enter a valid date.");
        }
    }
});

function generateDailyChartByType(ctx, targetDate = new Date()) {
    const date = new Date(targetDate);

    const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
    });

    const taskCounts = {
        completed: dayTasks.filter(task => task.status === 'completed').length,
        pending: dayTasks.filter(task => task.status === 'pending').length,
        inProgress: dayTasks.filter(task => task.status === 'in progress').length
    };

    const total = dayTasks.length;

    const percentages = {
        completed: total ? ((taskCounts.completed / total) * 100).toFixed(1) : 0,
        pending: total ? ((taskCounts.pending / total) * 100).toFixed(1) : 0,
        inProgress: total ? ((taskCounts.inProgress / total) * 100).toFixed(1) : 0
    };

    if (dailyChartInstance) {
        dailyChartInstance.destroy();
    }

    dailyChartInstance = new Chart(ctx, {
        type: 'doughnut', // Always pie
        data: {
            labels: ['Completed', 'Pending', 'In Progress'],
            datasets: [{
                data: [taskCounts.completed, taskCounts.pending, taskCounts.inProgress],
                backgroundColor: ['#4CAF50', '#FFC107', '#2196F3'],
                borderColor: ['#388E3C', '#FFA000', '#1976D2'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            radius: '90%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: 'gray',
                        font: { size: 14 },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: '#121212',
                    titleColor: 'white',
                    bodyColor: 'white',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            const percentage = Object.values(percentages)[context.dataIndex];
                            return ` ${value} tasks (${percentage}%)`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: `Tasks Distribution - ${new Date(targetDate).toLocaleDateString("en-US", {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}`,
                    color: 'gray',
                    font: { size: 16, weight: 'bold' },
                    padding: 20
                }
            }
        }
    });

    return dailyChartInstance;
}