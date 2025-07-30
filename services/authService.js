import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { db } from "../config/db.js";
import { oauthAccountsTable, passwordResetTokensTable, sessionsTable, usersTable, verifyEmailTokensTable } from "../drizzle/schema.js";
import { and, eq, gte, lt } from 'drizzle-orm';
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto"
import { sendEmail } from "../lib/send-email.js";
import path from "path";
import fs from "fs/promises";
import mjml2html from "mjml";
import ejs from "ejs";

export async function getUserByEmail(email) {
    const result = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
    return result[0];
};

export const createUser = async (name, email, password) => {
    try {
        return await db.insert(usersTable).values(name, email, password).$returningId()
    } catch (error) {
        console.error("Error in createUser:", error);
        throw error;
    }
};

export const hashedPassword = async (password) => argon2.hash(password);

export const verifyPassword = async (password, hashedPassword) => argon2.verify(hashedPassword, password);


export const createSession = async (userId, { ip, userAgent }) => {
    const session = await db.insert(sessionsTable).values({ userId, ip, userAgent }).$returningId()
    return session
}

export const generateAccessToken = ({ id, name, email, sessionId }) => {
    return jwt.sign({
        id, name, email, sessionId
    }, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
    })
}

export const generateRefreshToken = (sessionId) => {
    return jwt.sign({ sessionId }, process.env.JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
    })
}

export const findSessionById = async (sessionId) => {
    const [session] = await db.select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId));
    return session;
}

export const findUserById = async (userId) => {
    const [session] = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, userId));
    return session;
}

export const verifyJWTToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET)
};

export const refreshTokens = async (refreshToken) => {
    try {
        const decodedToken = verifyJWTToken(refreshToken);
        const currentSession = await findSessionById(decodedToken.sessionId);
        if (!currentSession || !currentSession.valid) {
            throw new Error("Invalid session")
        }
        const user = await findUserById(currentSession.userId)
        if (!user) {
            throw new Error("User not found")
        }
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailValid: user.isEmailValid,
            sessionId: currentSession.id
        }
        const newAccessToken = generateAccessToken(userData);
        const newRefreshToken = generateRefreshToken(currentSession.id);
        return { newAccessToken, newRefreshToken, userData }
    } catch (error) {
        console.log(error)
    }
}



export const clearUserSession = async (sessionId) => {
    return db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId))
};

export const autenticateUser = async ({ req, res, user }) => {
    const { name, email } = user;
    const [session] = await createSession(user.id, {
        ip: req.clientIp,
        userAgent: req.headers['user-agent']
    });
    const accessToken = generateAccessToken({
        id: user.id,
        name: name,
        email: email,
        isEmailValid: user.isEmailValid || false,
        sessionId: session.id
    });
    const refreshToken = generateRefreshToken(session.id);
    const baseConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }
    res.cookie('access_token', accessToken, {
        ...baseConfig,
        maxAge: ACCESS_TOKEN_EXPIRY
    });
    res.cookie('refresh_token', refreshToken, {
        ...baseConfig,
        maxAge: REFRESH_TOKEN_EXPIRY
    });
}

export const generateRandomToken = (digit = 8) => {
    const min = 10 ** (digit - 1);
    const max = 10 ** digit;
    return crypto.randomInt(min, max).toString();
}

const now = new Date();
const expiresIn24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

export const insertVerifyEmailToken = async ({ userId, token }) => {

    return db.transaction(async (tx) => {
        try {
            await tx.delete(verifyEmailTokensTable)
                .where(lt(verifyEmailTokensTable.expiredAt, now));

            // delete existing token
            await tx.delete(verifyEmailTokensTable)
                .where(eq(verifyEmailTokensTable.userId, userId));

            return await tx.insert(verifyEmailTokensTable).values({ userId, token, expiredAt: expiresIn24h });
        } catch (error) {
            console.error("Error in insertVerifyEmailToken:", error);
            throw error;
        }
    });
}

export const createVerifyEmailLink = async ({ email, token }) => {
    const url = new URL(`${process.env.FRONTEND_URL}/auth/verify-email-token`);
    url.searchParams.set('email', email);
    url.searchParams.set('token', token);
    return url.toString();
}

export const findVerificationEmailToken = async ({ token, email }) => {
    try {
        // const tokenData = await db
        //     .select({
        //         userId: verifyEmailTokensTable.userId,
        //         token: verifyEmailTokensTable.token,
        //         expiredAt: verifyEmailTokensTable.expiredAt
        //     })
        //     .from(verifyEmailTokensTable)
        //     .where(
        //         and(
        //             eq(verifyEmailTokensTable.token, token),
        //             gte(verifyEmailTokensTable.expiredAt, now),
        //         )
        //     );

        // if (!tokenData.length) return null;

        // const { userId } = tokenData[0];

        // const user = await db.select({
        //     userId: usersTable.id,
        //     email: usersTable.email,

        // }).from(usersTable).where(eq(usersTable.id, userId));

        // if (!user.length) return null;

        // return {
        //     userId: user[0].userId,
        //     email: user[0].email,
        //     token: tokenData[0].token,
        //     expiredAt: tokenData[0].expiredAt
        // }

        const result = await db
            .select({
                userId: usersTable.id,
                email: usersTable.email,
                token: verifyEmailTokensTable.token,
                expiredAt: verifyEmailTokensTable.expiredAt
            })
            .from(verifyEmailTokensTable)
            .innerJoin(usersTable, eq(verifyEmailTokensTable.userId, usersTable.id))
            .where(
                and(
                    eq(verifyEmailTokensTable.token, token),
                    eq(usersTable.email, email),
                    gte(verifyEmailTokensTable.expiredAt, now)
                )
            );

        if (!result.length) return null;

        return result[0];

    } catch (error) {
        console.error("Error in findVerificationEmailToken:", error);
        throw error;
    }
}

export const verifyUserEmailAndUpdate = async (email) => {
    await db.update(usersTable).set({ isEmailValid: true }).where(eq(usersTable.email, email));
}

export const clearVerifyEmailToken = async (email) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return db.delete(verifyEmailTokensTable).where(eq(verifyEmailTokensTable.userId, user.id));
}

export const sendNewVerifyEmailLink = async ({ userId, email }) => {
    const randomToken = generateRandomToken();
    await insertVerifyEmailToken({
        userId,
        token: randomToken
    })
    const verifyEmailLink = await createVerifyEmailLink({
        email,
        token: randomToken
    });

    const mjmlTemplate = await fs
        .readFile(path.join(import.meta.dirname, '..', 'emails', 'verify-email.mjml'), 'utf-8')


    const filledTemplate = ejs.render(mjmlTemplate, {
        code: randomToken,
        link: verifyEmailLink
    });

    const htmlOutput = mjml2html(filledTemplate).html;


    sendEmail({
        to: email,
        subject: 'Verify your email',
        html: htmlOutput
    }).catch(console.error);
}

export const updateUserName = async ({ userId, name, avatarUrl }) => {
  
    await db
        .update(usersTable)
        .set({ name, avatarUrl })
        .where(eq(usersTable.id, userId));
}

export const updatePassword = async (userId, password) => {
    await db.update(usersTable).set({ password }).where(eq(usersTable.id, userId));
}

export const createResetPasswordLink = async ({ userId }) => {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db
        .delete(passwordResetTokensTable)
        .where(eq(passwordResetTokensTable.userId, userId));

    await db.insert(passwordResetTokensTable).values({
        userId,
        tokenHash
    });

    const url = new URL(`${process.env.FRONTEND_URL}/auth/reset-password/${token}`);
    return url.toString();
}

export const getHtmlFromMjmlTemplate = async ({ name, link }) => {
    const mjmlTemplate = await fs
        .readFile(path.join(import.meta.dirname, '..', 'emails', 'reset-password.mjml'), 'utf-8')

    const filledTemplate = ejs.render(mjmlTemplate, {
        name,
        link
    });

    return mjml2html(filledTemplate).html
}


export const getResetPasswordToken = async (token) => {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [user] = await db
        .select()
        .from(passwordResetTokensTable)
        .where(
            and(
                eq(passwordResetTokensTable.tokenHash, tokenHash),
                gte(passwordResetTokensTable.expiresAt, new Date())
            )
        );

    return user;
}

export const clearResetPasswordToken = async (userId) => {
    return db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, userId));
}



export async function getUserWithOauthId({ email, provider }) {
    const [user] = await db
        .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            isEmailValid: usersTable.isEmailValid,
            providerAccountId: oauthAccountsTable.providerAccountId,
            provider: oauthAccountsTable.provider,
        })
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .leftJoin(
            oauthAccountsTable,
            and(
                eq(oauthAccountsTable.provider, provider),
                eq(oauthAccountsTable.userId, usersTable.id)
            )
        );

    return user;
}

export async function linkUserWithOauth({
    userId,
    provider,
    providerAccountId,
    avatarUrl
}) {
    console.log("avatarUrl2: ", avatarUrl);
    await db.insert(oauthAccountsTable).values({
        userId,
        provider,
        providerAccountId,
        avatarUrl
    });
}

export async function createUserWithOauth({
    name,
    email,
    provider,
    providerAccountId,
    avatarUrl,
    email_verified
}) {
    console.log("avatarUrl: ", avatarUrl);
    const user = await db.transaction(async (trx) => {
        const [user] = await trx
            .insert(usersTable)
            .values({
                email,
                name,
                isEmailValid: email_verified || true,
                avatarUrl
            })
            .$returningId();

        await trx.insert(oauthAccountsTable).values({
            provider,
            providerAccountId,
            userId: user.id,
        });

        return {
            id: user.id,
            name,
            email,
            isEmailValid: email_verified,
            provider,
            providerAccountId,
            avatarUrl
        };
    });

    return user;
}