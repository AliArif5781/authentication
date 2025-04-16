import expres from "express";
import userAuth from "../middlewares/userAuth.js";
import { getUserData } from "../controllers/userController.js";

const userRoutes = expres.Router();

userRoutes.get("/data", userAuth, getUserData);

export default userRoutes;
