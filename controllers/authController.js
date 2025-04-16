import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transpoter from "../config/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      // when we run this project on live server then it will run on https then it will be true, while running in local environment/development environment it will run on http it mean not secureit will be false, then make it true or false make env.
      secure: process.env.NODE_ENV === "production", // so secure will be false for development env it will true in production env.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d in milli-second
    });

    // Sending Welcome Email
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to website",
      text: `Welcome to website.Your account  has been created with email id ${email}`,
      html: `
    
      <h2 style="color: #333;">Welcome to webApp, ${name}!</h2>
      
      <p style="color: #555; line-height: 1.6;">
        Thank you for creating an account with us. We're excited to have you on board!
      </p>
      
      <p style="color: #555; line-height: 1.6;">
        Your account has been successfully registered with the email: <strong>${email}</strong>
      </p>
      
      <p style="color: #555; line-height: 1.6;">
        Here's what you can do next:
      </p>
      
      <ul style="color: #555; line-height: 1.6; padding-left: 20px;">
        <li>Complete your profile</li>
        <li>Explore our services/products</li>
        <li>Get started with your first project</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourcompany.com/get-started" 
           style="background-color: #0066ff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Get Started
        </a>
      </div>
      
      <p style="color: #888; font-size: 14px; line-height: 1.6;">
        If you didn't create this account, please contact our support team immediately at 
        <a href="mailto:support@yourcompany.com">support@yourcompany.com</a>.
      </p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
        <p style="color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} Your Company Name. All rights reserved.<br>
          [Company Address] | <a href="https://yourcompany.com">yourcompany.com</a>
        </p>
      </div>
    </div>
  `,
    };

    await transpoter.sendMail(mailOption);

    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid Email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({ success: true, message: "User logout" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// now create api end point using this controller function  for that we create route

// Send Verification OTP to the user Email,
export const sendVerifyOTP = async (req, res) => {
  try {
    // actially we get the userID from the token and token store in cookies so we need a middleware that will get the cookie and from that we will find the token and from that token we will find the userId, and userId will be added in the req.body that will done using function so that we will create a middleware in middleware folder

    // const { userId } = req.body;

    const user = await userModel.findById(req.userId);

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "User already verified" });
    }
    // script generate one OTP that will send on users email id
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Your OTP is ${otp}. Verify your account using this OTP.`,
    };

    await transpoter.sendMail(mailOption);
    res.json({
      success: true,
      message: "Verification OTP send on Email",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Verify email using otp
export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userId = req.userId;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: "Missing Details" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (String(user.verifyOtp) !== String(otp)) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(401).json({ success: false, message: "OTP expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = null;
    await user.save();

    return res.json({ success: true, message: "Email Verified successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    // const userId = req.body.userId;

    const user = await userModel.findById(req.userId).select("-password"); // remove password
    console.log(user, "user isAuthenticated");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    // Return user data without modifying the token
    return res.status(200).json({
      success: true,
      // user,
      // token: req.cookies.token, // or reissue token if needed
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        isAuthenticated: user.isAuthenticated,
      },
    });
  } catch (error) {
    // return res.status(500).json({ success: false, message: error.message });
    console.error("Authentication check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// send password reset otp
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for resetting your password is ${otp}. Use this Otp to proceed with resetting your password.`,
    };
    await transpoter.sendMail(mailOption);

    return res.json({ success: true, message: "OTP send to your email." });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// reset user password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({
      success: false,
      message: "Email, Otp and newPassword are required.",
    });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTp" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;

    await user.save();
    return res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
