import { z } from "zod";
function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export const addTaskSchema = z.object({
    title: z.string().trim()
        .min(3, { message: "Title must be at least 3 characters long" })
        .max(100, { message: "Title must be at most 100 characters long" }),

    description: z.string().trim()
        .min(3, { message: "Description must be at least 3 characters long" })
        .max(500, { message: "Description must be at most 500 characters long" }),

    category: z.string().trim()
        .min(1, { message: "Please select a category" }),

    priority: z.string().trim()
        .min(1, { message: "Please select a priority" }),

    repeat: z.string().trim()
        .min(1, { message: "Please select a repeat option" }),

    remainder: z.string().trim()
        .min(1, { message: "Please select a remainder" }),

    startDate: z.coerce.date(),
    dueDate: z.coerce.date()
})
    .refine(data => {
        const today = stripTime(new Date());
        const inputDate = stripTime(data.startDate);
        return inputDate >= today;
    }, {
        message: "Start date cannot be in the past",
        path: ["startDate"]
    })
    .refine(data => {
        const start = stripTime(data.startDate);
        const due = stripTime(data.dueDate);
        return due > start;
    }, {
        message: "Due date must be after the start date",
        path: ["dueDate"]
    });