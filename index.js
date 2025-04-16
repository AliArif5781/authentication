import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT;
// const port = process.env.PORT || 3000;
connectDB();

app.use(cookieParser());
app.use(express.json()); // All request pass through json. // If using express-session or JWT cookies

// app.use(cors({ credentials: true })); // So we send the cookies in the response from express app.

// const corsOption = {
//   origin: "http://localhost:5173", // specify the allowed origin
//   Credential: true, // allow credentials
// };
// app.use(cors(corsOption));

app.use(
  cors({
    origin: "http://localhost:5173", // 👈 your frontend URL
    credentials: true, // 👈 must be true
  })
);

// API End-Point
app.get("/", (req, res) => {
  res.send("api working");
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.listen(port, () => {
  console.log(`server running at port ${port}`);
});
