import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    // event when we connected with db we get the msg
    console.log("database connected");
  });

  const db_uri = process.env.MONGODB_URI;

  await mongoose.connect(db_uri);
};

export default connectDB;
