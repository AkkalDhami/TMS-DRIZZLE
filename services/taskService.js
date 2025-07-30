
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
    limit = 10,
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
        tasks,
        totalCount
    };
};

export const groupTasksWithSubtasks = (rows) => {
    const taskMap = new Map();

    for (const row of rows) {
        const task = row.task ?? row.tasks; // fallback in case alias is different
        const subTask = row.subTask;

        if (!taskMap.has(task.id)) {
            taskMap.set(task.id, {
                ...task,
                subTasks: [],
            });
        }

        if (subTask?.id) {
            taskMap.get(task.id).subTasks.push(subTask);
        }
    }

    return Array.from(taskMap.values());
};

export const addSubtaskByTaskId = async ({ text, taskId }) => {
    return db
        .insert(subTasksTable)
        .values({ text, taskId })
        .$returningId()
}

export const getTaskById = async (taskId) => {
    const [task] = await db.select()
        .from(tasksTable)
        .leftJoin(subTasksTable, eq(tasksTable.id, subTasksTable.taskId))
        .where(eq(tasksTable.id, taskId));
    return task;
}

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
            status: newStatus,
            completedAt,
        })
        .where(eq(subTasksTable.taskId, taskId));
}

export const deleteTaskById = async (taskId) => {
    return db
        .delete(tasksTable)
        .where(eq(tasksTable.id, taskId));
}
