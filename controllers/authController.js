
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRE } from '../config/env.js';
import loginUserReqModel from '../models/login.js';
import { decrypt } from '../utils/encryptionDecryption.js';
import userModel from '../models/adminUser.js';
import loginUserModel from '../models/login.js';


const generateToken = (id, username) => {
    return jwt.sign({ id, username }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: 'Email and Password are required'
            });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                code: 1,
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                code: 1,
                success: false,
                message: 'User is not active'
            });
        }

        // AES Decrypt & Compare
        const decryptedPassword = decrypt(user.password);

        if (decryptedPassword !== password) {
            return res.status(401).json({
                code: 1,
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT Token
        const token = generateToken(user._id, user.username);

        await loginUserModel.updateOne(
            {
                user_id: user.id
            },
            { 
                $set: {
                    id: user._id,
                    token: token
                }
            },
            {
                upsert: true
            }
        );

        res.status(200).json({
            code: 0,
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin,
                isActive: user.isActive
            },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 1,
            success: false,
            message: 'Internal server error'
        });
    }
};

export { loginUser };