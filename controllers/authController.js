

import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { autenticateUser, clearUserSession, clearVerifyEmailToken, createResetPasswordLink, createUser, createUserWithOauth, findUserById, findVerificationEmailToken, getHtmlFromMjmlTemplate, getUserByEmail, getUserWithOauthId, hashedPassword, linkUserWithOauth, sendNewVerifyEmailLink, updatePassword, updateUserName, verifyPassword, verifyUserEmailAndUpdate, getResetPasswordToken, clearResetPasswordToken } from "../services/authService.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, setPasswordSchema, verifyEmailSchema, verifyProfileSchema } from "../validators/authValidators.js";
import { OAUTH_EXCHANGE_EXPIRY } from "../config/constants.js";
import { google } from "../lib/oauth/google.js";
import { sendEmail } from "../lib/send-email.js";
import { github } from "../lib/oauth/github.js";

import fs from "fs/promises";
import path from "path";

export const getRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        errors: req.flash('errors')
    });
}

export const getLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        errors: req.flash('errors')
    });
}

export const getProfile = async (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const user = await findUserById(req.user.id);
    if (!user) return res.redirect('/auth/login');
    res.render('auth/profile', {
        title: 'Profile Page',
        user,
        hasPassword: Boolean(user.password),
        location: '/profile'
    });
}

export const getEditProfile = async (req, res) => {
    const user = await findUserById(req.params.id);
    if (!user) return res.redirect('/auth/login');
    res.render('auth/edit-profile', {
        title: 'Edit Profile Page',
        user,
        errors: req.flash('errors'),
        location: '/profile'
    });
}

export const getChangePasswordPage = (req, res) => {
    res.render('auth/change-password', {
        title: 'Change Password',
        errors: req.flash('errors')
    });
}

export const getSetPasswordPage = (req, res) => {
    res.render('auth/set-password', {
        title: 'Set Password',
        errors: req.flash('errors')
    });
}

export const postSetPassword = async (req, res) => {

    const { data, error } = setPasswordSchema.safeParse(req.body);

    if (error) {
        const errors = error.errors[0].message
        req.flash('errors', errors);
        return res.redirect(`/auth/set-password`);
    }
    const { newPassword } = data;

    const user = await findUserById(req.user.id);
    if (user.password) {
        req.flash('errors', 'Password already set');
        return res.redirect('/auth/set-password');
    }

    const hashedPasswd = await hashedPassword(newPassword);
    await updatePassword(req.user.id, hashedPasswd);
    res.redirect('/auth/profile');
}

export const postEditProfile = async (req, res) => {

    const { data, error } = verifyProfileSchema.safeParse(req.body);

    if (error) {
        const errors = error.errors[0].message
        req.flash('errors', errors);
        return res.redirect(`/auth/edit-profile/${req.user.id}`);
    }
    const { name } = data;

    const updatedUser = await findUserById(req.user.id);
    if (!updatedUser) return res.redirect('/auth/login');

    updateUserName({
        userId: updatedUser.id,
        name,
    });


    res.redirect('/auth/profile');
}

export const logout = async (req, res) => {
    await clearUserSession(req.user.sessionId);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.redirect('/auth/login');
}

export const getVerifyEmail = (req, res) => {
    if (!req.user || req.user.isEmailValid) return res.redirect('/');
    res.render('auth/verify-email', {
        title: 'Verify Email',
        user: req.user
    });
}

export const getVerifyEmailToken = async (req, res) => {
    const { data, error } = verifyEmailSchema.safeParse(req.query);

    if (error) return res.redirect('/auth/verify-email');

    const token = await findVerificationEmailToken(data);
    if (!token) return res.send('Invalid token');

    await verifyUserEmailAndUpdate(token.email);

    clearVerifyEmailToken(token.email).catch(console.error);

    return res.redirect('/auth/profile');
}

export const getResendVerificationLink = async (req, res) => {
    if (!req.user || req.user.isEmailValid) return res.redirect('/');

    await sendNewVerifyEmailLink({ userId: req.user.id, email: req.user.email }).catch(console.error);
    res.redirect('/auth/verify-email');
}

export const getGoogleLoginPage = async (req, res) => {
    if (req.user) return res.redirect('/');
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = google.createAuthorizationURL(state, codeVerifier, [
        "openid",
        "profile",
        "email"
    ]);

    const cookieConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: OAUTH_EXCHANGE_EXPIRY
    };

    res.cookie('google_oauth_state', state, cookieConfig);
    res.cookie('google_oauth_code_verifier', codeVerifier, cookieConfig);

    res.redirect(url.toString());
}

export const getGoogleLoginCallbackPage = async (req, res) => {
    if (req.user) return res.redirect('/');

    const { code, state } = req.query;
    const { google_oauth_state: storedState, google_oauth_code_verifier: codeVerifier } = req.cookies;

    if (
        !code ||
        !state ||
        !storedState ||
        !codeVerifier ||
        state !== storedState
    ) {
        req.flash(
            "errors",
            "Couldn't login with Google because of invalid login attempt. Please try again!"
        );
        return res.redirect("/login");
    }

    let tokens;
    try {
        tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch {
        req.flash(
            "errors",
            "Couldn't login with Google because of invalid login attempt. Please try again!"
        );
        return res.redirect("/login");
    }

    const claims = decodeIdToken(tokens.idToken());
    const { sub: googleUserId, name, email, picture, email_verified } = claims;

    // if user is already linked then we will get the user
    let user = await getUserWithOauthId({
        provider: "google",
        email,
    });

    // if user exists but user is not linked with oauth
    if (user && !user.providerAccountId) {
        await linkUserWithOauth({
            userId: user.id,
            provider: "google",
            providerAccountId: googleUserId,
        });
    }

    // if user doesn't exist
    if (!user) {
        user = await createUserWithOauth({
            name,
            email,
            provider: "google",
            providerAccountId: googleUserId,
            email_verified
        });
    }
    await autenticateUser({ req, res, user });

    res.redirect("/");
}

export const getGithubLoginPage = async (req, res) => {
    if (req.user) return res.redirect('/');
    const state = generateState();

    const url = github.createAuthorizationURL(state, ["user:email"]);

    const cookieConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: OAUTH_EXCHANGE_EXPIRY
    };

    res.cookie('github_oauth_state', state, cookieConfig);

    res.redirect(url.toString());
}

export const getGithubLoginCallbackPage = async (req, res) => {
    if (req.user) return res.redirect('/');

    const { code, state } = req.query;
    const { github_oauth_state: storedState } = req.cookies;

    function handleFailedLogin() {
        req.flash(
            "errors",
            "Couldn't login with Github because of invalid login attempt. Please try again!"
        );
        return res.redirect("/login");
    }

    if (
        !code ||
        !state ||
        !storedState ||
        state !== storedState
    ) {
        return handleFailedLogin();
    }

    let tokens;
    try {
        tokens = await github.validateAuthorizationCode(code);
    } catch {
        return handleFailedLogin();
    }

    const githubUserResponse = await fetch(`https://api.github.com/user`, {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`,
        },
    })

    if (!githubUserResponse.ok) {
        return handleFailedLogin();
    }

    const githubUser = await githubUserResponse.json();
    const { id: githubUserId, name } = githubUser;

    const githubEmailResponse = await fetch(`https://api.github.com/user/emails`, {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`,
        },
    })

    if (!githubEmailResponse.ok) {
        return handleFailedLogin();
    }

    const githubEmails = await githubEmailResponse.json();

    const email = githubEmails.filter(email => email.primary)[0]?.email;
    if (!email) {
        return handleFailedLogin();
    }

    // if user is already linked then we will get the user
    let user = await getUserWithOauthId({
        provider: "github",
        email,
    });

    // if user exists but user is not linked with oauth
    if (user && !user.providerAccountId) {
        await linkUserWithOauth({
            userId: user.id,
            provider: "github",
            providerAccountId: githubUserId,
        });
    }

    // if user doesn't exist
    if (!user) {
        user = await createUserWithOauth({
            name,
            email,
            provider: "github",
            providerAccountId: githubUserId,
        });
    }

    await autenticateUser({ req, res, user });
    res.redirect("/");
}

export const getResetPasswordPage = (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('auth/reset-password', {
        title: 'Reset Password',
        formSubmitted: req.flash('formSubmitted')[0],
        errors: req.flash('errors')
    });
}

export const getResetPasswordTokenPage = async (req, res) => {
    if (req.user) return res.redirect('/');

    const { token } = req.params;

    const passwordResetData = await getResetPasswordToken(token);

    if (!passwordResetData) return res.redirect('/auth/reset-password');

    res.render('auth/reset-password-token', {
        title: 'Reset Password',
        formSubmitted: req.flash('formSubmitted')[0],
        errors: req.flash('errors'),
        token
    });
}

export const postLogin = async (req, res) => {
    if (req.user) return res.redirect('/');
    const { data, error } = loginSchema.safeParse(req.body);
    if (error) {
        const errors = error.errors[0].message
        req.flash('errors', errors);
        return res.redirect('/auth/login');
    }
    const { email, password } = data;

    try {
        if (!email || !password) {
            req.flash('errors', 'Email or password is missing');
            return res.redirect('/auth/login');
        }
        const user = await getUserByEmail(email);
        if (!user) {
            req.flash('errors', 'Invalid Credentials');
            return res.redirect('/auth/login');
        }

        if (!user.password) {
            req.flash('errors', 'You have created your account with social login. Please login with social account.');
            return res.redirect('/auth/login');
        }

        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            req.flash('errors', 'Invalid Credentials');
            return res.redirect('/auth/login');
        }

        await autenticateUser({ req, res, user });

    } catch (error) {
        console.error('Error during login:', error);
        return res.redirect('/auth/login');
    }
    res.redirect('/');
}

export const postRegister = async (req, res) => {
    if (req.user) return res.redirect('/');
    const { data, error } = registerSchema.safeParse(req.body);
    if (error) {
        const errors = error.errors[0].message
        req.flash('errors', errors);
        return res.redirect('/auth/register');
    }
    const { name, email, password } = data;
    try {
        const userExists = await getUserByEmail(email);
        if (userExists) {
            req.flash('errors', 'User already exists');
            return res.redirect('/auth/register');
        }

        const hashedPasswd = await hashedPassword(password);
        const [user] = await createUser({ name, email: email.toLowerCase(), password: hashedPasswd });
        await autenticateUser({ req, res, user });
        await sendNewVerifyEmailLink({ userId: user.id, email }).catch(console.error);
        return res.redirect('/');
    } catch (error) {
        console.error('Error during registration:', error);
        return res.redirect('/auth/register');
    }
}

export const postChangePassword = async (req, res) => {
    const { data, error } = changePasswordSchema.safeParse(req.body);
    if (error) {
        const errors = error.errors[0].message
        req.flash('errors', errors);
        return res.redirect('/auth/change-password');
    }

    const user = await findUserById(req.user.id);
    if (!user) return res.redirect('/auth/login');
    // get current password, new password
    const { currentPassword, newPassword } = data;

    // check if current password is correct
    const isPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
        req.flash('errors', 'Current password is incorrect');
        return res.redirect('/auth/change-password');
    }

    // update password
    const hashedPasswd = await hashedPassword(newPassword);
    await updatePassword(user.id, hashedPasswd);

    res.redirect('/auth/profile');
}

export const postForgetPassword = async (req, res) => {
    const { data, error } = forgotPasswordSchema.safeParse(req.body);
    if (error) {
        const errors = error.errors[0].message
        req.flash('errors', errors);
        return res.redirect('/auth/reset-password');
    }
    const { email } = data;

    const user = await getUserByEmail(email);


    const resetPasswordLink = await createResetPasswordLink({ userId: user?.id, }).catch(console.error);

    const html = await getHtmlFromMjmlTemplate({ name: user.name, link: resetPasswordLink }).catch(console.error);

    await sendEmail({
        to: email,
        subject: 'Reset your password',
        html
    }).catch(console.error);

    res.redirect('/auth/reset-password');
}

export const postResetPassword = async (req, res) => {
    const { data, error } = resetPasswordSchema.safeParse(req.body);

    const { token } = req.params;
    const passwordResetData = await getResetPasswordToken(token);
    if (error) {
        const errors = error.errors[0].message
        req.flash('errors', errors);
        return res.redirect(`/auth/reset-password/${token}`);
    }

    const { newPassword } = data;
    const user = await findUserById(passwordResetData.userId);
    if (!user) {
        req.flash('errors', 'User not found');
        return res.redirect(`/auth/reset-password/${token}`);
    }

    await clearResetPasswordToken(passwordResetData.userId);
    const hashedPasswd = await hashedPassword(newPassword);
    await updatePassword(user.id, hashedPasswd);

    res.redirect('/auth/login');
}