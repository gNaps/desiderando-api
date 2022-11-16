import fastify from "fastify";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import giftController from "./controllers/giftController";
import authController from "./controllers/authController";
import friendController from "./controllers/friendController";
import userController from "./controllers/userController";

const server = fastify({
  logger: true,
  bodyLimit: 30 * 1024 * 1024, // Default Limit set to 30MB
});
dotenv.config();

try {
  mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME,
  });
} catch (error) {
  console.error(error);
}

(cloudinary as any).config({
  secure: true,
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

server.register(giftController, { prefix: "/gifts" });
server.register(authController, { prefix: "/auth" });
server.register(friendController, { prefix: "/friends" });
server.register(userController, { prefix: "/users" });

server.listen({ port: 8080, host: "0.0.0.0" }, (error: any, address: any) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Server running on ${address}`);
});
