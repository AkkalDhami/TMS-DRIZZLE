import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { refreshTokens, verifyJWTToken } from "../services/authService.js";

export const verifyAuthentication = async (req, res, next) => {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;
    req.user = null;
    if (!accessToken && !refreshToken) {
        return next();
    }

    if (accessToken) {
        const decodedToken = verifyJWTToken(accessToken);
        req.user = decodedToken;
        return next();
    }
    if (refreshToken) {
        try {
            const { newAccessToken, newRefreshToken, userData } = await refreshTokens(refreshToken);
            req.user = userData;

            const baseConfig = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
            }

            res.cookie('access_token', newAccessToken, {
                ...baseConfig,
                maxAge: ACCESS_TOKEN_EXPIRY
            });

            res.cookie('refresh_token', newRefreshToken, {
                ...baseConfig,
                maxAge: REFRESH_TOKEN_EXPIRY
            });
            return next();
        } catch (error) {
            console.log(error)
            return next();
        }
    }
    return next();
};

export const isAuthenticated = (req, res, next) => {
    if (req.user) {
        return next();
    }
    return res.redirect('/auth/login');
};