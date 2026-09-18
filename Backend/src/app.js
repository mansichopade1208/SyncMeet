import dns from "dns";
dns.setServers(["8.8.8.8"]);

import express from "express";
const app = express();
import {createServer} from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8080)); //kind of a local storage
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/v1/users", userRoutes);

const start = async() => {
    const connectDb = await mongoose.connect("mongodb+srv://mansichopade1208_db_user:C5ArQFL2Y9wWtsb2@cluster0.wy7rbdx.mongodb.net/")
    console.log("mongodb connected");
    server.listen(app.get("port"), () => {
        console.log("listening on port 8080");
    });
}
start();