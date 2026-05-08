import loginUserModel from '../models/login.js';

const authMiddleware = async (req, res, next) => {
    try {
        // get token from header
        const token = req.headers.authorization;

        // token not found
        if (!token) {
            return res.status(401).json({
                code: 1,
                success: false,
                message: "Token not found"
            });
        }

        // check token in database
        const userToken = await loginUserModel.findOne({
            token: token
        });

        // invalid token
        if (!userToken) {
            return res.status(401).json({
                code: 1,
                success: false,
                message: "Invalid token"
            });
        }

        // store token and user info in request
        req.token = token;
        req.user = userToken;
        next();
    } catch (error) {
        return res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

export default authMiddleware;