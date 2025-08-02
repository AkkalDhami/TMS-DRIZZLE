
import { count, and, asc, desc, eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { subTasksTable, tasksTable, } from "../drizzle/schema.js";

export const addNewTask = async ({ title, description, category, priority, repeat, startDate, dueDate, remainder, userId }) => {
    return db
        .insert(tasksTable)
        .values({
            title,
            description,
            category,
            priority,
            repeat,
            startDate,
            dueDate,
            remainder,
            userId,
        }).$returningId()
}

export const getAllTasksDetailsByUserId = async ({
    userId,
    status,
    sort = 'createdAt',
    order = 'desc',
    limit,
    offset = 0,
}) => {
    const conditions = [eq(tasksTable.userId, userId)];

    if (status) {
        conditions.push(eq(tasksTable.status, status));
    }

    // Dynamically pick the sort column
    const sortColumn = {
        createdAt: tasksTable.createdAt,
        dueDate: tasksTable.dueDate,
        priority: tasksTable.priority
    }[sort] || tasksTable.createdAt;

    const orderBy = order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const tasks = await db
        .select()
        .from(tasksTable)
        .leftJoin(subTasksTable, eq(tasksTable.id, subTasksTable.taskId))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

    const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(tasksTable)
        .where(and(...conditions));

    return {
        tasks: groupTasksWithSubtasks(tasks),
        totalCount
    };
};

export function groupTasksWithSubtasks(rows) {
    const taskMap = new Map();

    for (const row of rows) {
        const task = row.tasks;
        const subtask = row.sub_tasks;
        if (!taskMap.has(task.id)) {
            taskMap.set(task.id, { ...task, subtasks: [] });
        }

        if (subtask && subtask.id) {
            taskMap.get(task.id).subtasks.push(subtask);
        }
    }

    return Array.from(taskMap.values());
}


export const addSubtaskByTaskId = async ({ text, taskId }) => {
    return db
        .insert(subTasksTable)
        .values({ text, taskId });
}

export const getTaskById = async (taskId) => {
    const rows = await db
        .select()
        .from(tasksTable)
        .leftJoin(subTasksTable, eq(tasksTable.id, subTasksTable.taskId))
        .where(eq(tasksTable.id, taskId));

    if (!rows.length) return null;

    // Extract base task info from first row
    const baseTask = rows[0].tasks;

    // Construct task object
    const task = {
        ...baseTask,
        subtasks: [],
    };

    // Collect all subtasks
    for (const row of rows) {
        if (row.sub_tasks && row.sub_tasks.id) {
            task.subtasks.push({ ...row.sub_tasks });
        }
    }

    return task;
};


export const updateTaskStatus = async (taskId, { status: newStatus, completedAt }) => {
    return db
        .update(tasksTable)
        .set({
            status: newStatus,
            completedAt,
        })
        .where(eq(tasksTable.id, taskId));
}

export const updateSubtasksStatus = async (taskId, { status: newStatus, completedAt }) => {

    return db
        .update(subTasksTable)
        .set({
            isCompleted: newStatus === 'completed',
            completedAt,
        })
        .where(eq(subTasksTable.taskId, taskId));
}

export const deleteTaskById = async (taskId) => {
    return db
        .delete(tasksTable)
        .where(eq(tasksTable.id, taskId));
}

export const updateTaskById = async ({ taskId, userId, title, description, category, priority, repeat, startDate, dueDate, remainder }) => {
    return db
        .update(tasksTable)
        .set({
            title,
            description,
            category,
            priority,
            repeat,
            startDate,
            dueDate,
            remainder,
            userId
        })
        .where(eq(tasksTable.id, taskId));
}

export const findSubtaskById = async (subtaskId) => {
    return db
        .select()
        .from(subTasksTable)
        .where(eq(subTasksTable.id, subtaskId));
}


export const updateSubtaskStatusById = async ({ subtaskId, isCompleted, completedAt }) => {
    return db
        .update(subTasksTable)
        .set({ isCompleted, completedAt })
        .where(eq(subTasksTable.id, subtaskId));
}

export const updateSubtaskById = async ({ subtaskId, text }) => {
    return db
        .update(subTasksTable)
        .set({ text })
        .where(eq(subTasksTable.id, subtaskId));
}

export const deleteSubtaskById = async (subtaskId) => {
    return db
        .delete(subTasksTable)
        .where(eq(subTasksTable.id, subtaskId));
}

export const getAllSubtasksByTaskId = async (taskId) => {
    return db
        .select()
        .from(subTasksTable)
        .where(eq(subTasksTable.taskId, taskId));
}

export const getAllTasksByUserId = async (userId) => {
    return db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.userId, userId));
}

export const getCompletedTasksByUserId = async (userId) => {
    return db
        .select()
        .from(tasksTable)
        .where(and(eq(tasksTable.userId, userId), eq(tasksTable.status, 'completed')));
}

export const getPendingTasksByUserId = async (userId) => {
    return db
        .select()
        .from(tasksTable)
        .where(and(eq(tasksTable.userId, userId), eq(tasksTable.status, 'pending')));
}

export const getInProgressTasksByUserId = async (userId) => {
    return db
        .select()
        .from(tasksTable)
        .where(and(eq(tasksTable.userId, userId), eq(tasksTable.status, 'in progress')));
}