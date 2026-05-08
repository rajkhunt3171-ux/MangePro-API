import dotenv from 'dotenv';

dotenv.config();

//server configuration
export const PORT = process.env.PORT || 3000;

//database configuration
export const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/ManagePro';

//encryption key
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'GxN3wyQSaaEEQ3_S9DMayEpxr4JiLu706OchbvNkM3A';

//JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_change_me';
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

//CORS configuration
export const ORS_ORIGIN = process.env.ORS_ORIGIN || 'http://localhost:3000';