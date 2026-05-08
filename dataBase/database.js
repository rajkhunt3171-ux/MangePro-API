import mongoose from "mongoose";
import { DATABASE_URL } from "../config/env.js";

const connectDB = async () => {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log("connection done ");
    } catch (err) {
        console.log("Error connecting to database: ", err);
    }
}

export default connectDB;