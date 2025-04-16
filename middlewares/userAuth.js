// now we add the fucntion that will find the token from the cookie and from that token will find the userId so here let add.
import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({ success: false, message: "Not Authorized Login Again" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    console.log(tokenDecode, "tokenDecode");

    if (tokenDecode.id) {
      console.log(tokenDecode.id);
      // req.body.userId = tokenDecode.id;
      req.userId = tokenDecode.id; // Attach to request object
    } else {
      return res.json({
        success: false,
        message: "Not Authorized Login Again",
      });
    }
    next(); // If everything is successful, passes control to the next middleware/route.
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;
