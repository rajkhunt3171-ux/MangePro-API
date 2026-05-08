import departmentModel from "../../models/Department/departments.js";
import generateUniqueId from "../../utils/generateId.js";

const createAdminUser = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;

        if (!name) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: 'Name is required'
            });
        }

        const department_id = await generateUniqueId(
            departmentModel,
            "id",
            "DEPT"
        );

        const department = await departmentModel.create({
            id: department_id,
            name,
            description,
            isActive: isActive || true
        });

        res.status(200).json({
            code: 0,
            success: true,
            message: 'Department Created Successfully',
            id: department.id
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