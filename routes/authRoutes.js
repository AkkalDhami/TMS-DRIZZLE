import { Router } from "express";
import { getLogin, getRegister, postLogin, postRegister, getProfile, logout, getVerifyEmail, getResendVerificationLink, getVerifyEmailToken, getEditProfile, postEditProfile, getChangePasswordPage, postChangePassword, getGoogleLoginPage, getGoogleLoginCallbackPage, getResetPasswordPage, postForgetPassword, getResetPasswordTokenPage, postResetPassword, getGithubLoginPage, getGithubLoginCallbackPage, getSetPasswordPage, postSetPassword } from "../controllers/authController.js";

const router = Router();

router.get('/register', getRegister);
router.get('/login', getLogin);
router.get('/profile', getProfile);
router.get('/edit-profile/:id', getEditProfile);

router.get('/change-password', getChangePasswordPage);
router.route('/set-password').get(getSetPasswordPage).post(postSetPassword)

router.get('/logout', logout);
router.get('/verify-email', getVerifyEmail);
router.get('/verify-email-token', getVerifyEmailToken);

router.route('/reset-password').get(getResetPasswordPage).post(postForgetPassword);
router.route('/reset-password/:token')
    .get(getResetPasswordTokenPage)
    .post(postResetPassword);

router.route('/google').get(getGoogleLoginPage);
router.route('/google/callback').get(getGoogleLoginCallbackPage);

router.route('/github').get(getGithubLoginPage);
router.route('/github/callback').get(getGithubLoginCallbackPage);


router.post('/edit-profile/', postEditProfile);
router.post('/change-password', postChangePassword);
router.post('/login', postLogin);
router.post('/register', postRegister);
router.post('/resend-verification-link', getResendVerificationLink);

export const authRoutes = router;