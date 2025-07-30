import { Router } from "express";
import { getLogin, getRegister, postLogin, postRegister, getProfile, logout, getVerifyEmail, getResendVerificationLink, getVerifyEmailToken, getEditProfile, postEditProfile, getChangePasswordPage, postChangePassword, getGoogleLoginPage, getGoogleLoginCallbackPage, getResetPasswordPage, postForgetPassword, getResetPasswordTokenPage, postResetPassword, getGithubLoginPage, getGithubLoginCallbackPage, getSetPasswordPage, postSetPassword } from "../controllers/authController.js";

import multer from "multer";
import path from "path";

const uploadPath = path.join(import.meta.dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(null, 'Only .jpg, .jpeg and .png format allowed!', false);
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

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


router.post('/edit-profile/', upload.single('avatarUrl'), postEditProfile);
router.post('/change-password', postChangePassword);
router.post('/login', postLogin);
router.post('/register', postRegister);
router.post('/resend-verification-link', getResendVerificationLink);

export const authRoutes = router;