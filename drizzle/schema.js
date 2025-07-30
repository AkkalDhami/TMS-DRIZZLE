import { relations, sql } from 'drizzle-orm';
import {
    mysqlTable,
    boolean,
    text,
    int,
    varchar,
    timestamp,
    mysqlEnum
} from 'drizzle-orm/mysql-core';

export const subTasksTable = mysqlTable('sub_tasks', {
    id: int('id').autoincrement().primaryKey(),
    text: varchar({ length: 255 }).notNull(),
    isCompleted: boolean('is_completed').notNull().default(false),
    completedAt: timestamp('completed_at'),
    taskId: int('task_id').notNull().references(() => tasksTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tasksTable = mysqlTable('tasks', {
    id: int('id').autoincrement().primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 255 }).notNull(),
    priority: varchar({ length: 255 }).notNull(),
    repeat: varchar({ length: 255 }).notNull(),
    startDate: timestamp('start_date').notNull(),
    dueDate: timestamp('due_date').notNull(),
    remainder: varchar({ length: 255 }).notNull(),
    userId: int('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    status: mysqlEnum(['pending', 'completed', 'in progress']).notNull().default('pending'),
    completedAt: timestamp('completed_at'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessionsTable = mysqlTable('sessions', {
    id: int().autoincrement().primaryKey(),
    userId: int('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    valid: boolean().notNull().default(true),
    userAgent: text('user_agent'),
    ip: varchar({ length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export const oauthAccountsTable = mysqlTable('oauth_accounts', {
    id: int('id').autoincrement().primaryKey(),
    userId: int('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    provider: mysqlEnum('provider', ['github', 'google',]).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTokensTable = mysqlTable("password_reset_tokens", {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" })
        .unique(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at")
        .default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 HOUR)`)
        .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersTable = mysqlTable('users', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }),
    isEmailValid: boolean('is_email_valid').notNull().default(false),
    avatarUrl: varchar('avatar_url', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const verifyEmailTokensTable = mysqlTable('verify_email_tokens', {
    id: int('id').autoincrement().primaryKey(),
    token: varchar({ length: 8 }).notNull(),
    userId: int('user_id')
        .notNull()
        .references(() => usersTable.id, { onDelete: 'cascade' }),
    expiredAt: timestamp('expired_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
})

export const usersRelation = relations(usersTable, ({ many }) => ({
    shortLink: many(tasksTable),
    session: many(sessionsTable),
}));

// a task belongs to a user
export const tasksRelation = relations(tasksTable, ({ one, many }) => ({
    user: one(usersTable, {
        fields: [tasksTable.userId], // foreign key
        references: [usersTable.id],
    }),
    subTasks: many(subTasksTable),
}));

export const subTasksRelations = relations(subTasksTable, ({ one }) => ({
    task: one(tasksTable, {
        fields: [subTasksTable.taskId],
        references: [tasksTable.id],
    }),
}));


// // a session belongs to a user
export const sessionsRelation = relations(sessionsTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [sessionsTable.userId], // foreign key
        references: [usersTable.id],
    })
}));

