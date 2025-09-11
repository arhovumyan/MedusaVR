import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

const payload = {
  userId: "688964b9d8492bcf800b3060", // Real user ID from database
  uid: "688964b9d8492bcf800b3060",     // Alternative field
  _id: "688964b9d8492bcf800b3060",     // Alternative field
  username: "Areg Hovumyan1",
  email: "testC766965893@example.com",
  type: "access" // Add token type
};

const options = {
  expiresIn: '1h' // Token expires in 1 hour
};

const token = jwt.sign(payload, JWT_SECRET, options);

console.log("Generated JWT Token:", token);
