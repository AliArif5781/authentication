import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verifyOtp: { type: String, default: "" }, // email/user verification otp. when user created this verifyOTp craeted and default value empty string.
    verifyOtpExpireAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: "" },
    resetOtpExpireAt: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
// they search the user models if userModel avaible this userModel will be use if not avaiable it will create (mongoose.model("user", userSchema);) the userModel

export default userModel;
