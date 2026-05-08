
import userModel from '../models/adminUser.js';
import { encrypt } from '../utils/encryptionDecryption.js';
import generateUniqueId from '../utils/generateId.js';

const createAdminUser = async (req, res) => {
    try {
        const { username, email, password, isAdmin, isActive, department, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: 'Email and Password are required'
            });
        }

        // Check if user already exists
        const userExists = await userModel.findOne({
            $or: [{ email }, { username }]
        });

        if (userExists) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        const encryptedPassword = encrypt(password);

        const user_id = await generateUniqueId(
            userModel,
            "user_id",
            "USR"
        );

        const admin = await userModel.create({
            id: user_id,
            username,
            email,
            password: encryptedPassword,
            isAdmin: isAdmin || false,
            isActive: isActive || true,
            department: department || null,
            role
        });

        res.status(200).json({
            code: 0,
            success: true,
            message: 'Admin User Created Successfully',
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                isAdmin: admin.isAdmin,
                isActive: admin.isActive,
                department: admin.department,
                role: admin.role
            }
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

export default createAdminUser;