const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
import { Request, Response } from "express";

export const authRoute = router.post('/google', async (req: Request, res: Response) => {
  const { access_token } = req.body;
  try {
    // 1. Get user info from Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const profile = await googleRes.json();
    // 2. Validate profile
    if (profile.email.endsWith('@gosaas.io') === false) {
        return res.status(403).json({ error: "Unauthorized email domain" });
        }   

    // 2. Check if user is admin (custom logic)
    const isAdmin = profile.email === "admin@gosaas.io"; // Example logic

    // 3. Generate JWT
    const jwtPayload = {
      email: profile.email,
      name: profile.name,
      isAdmin,
      // ...other fields...
    };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ jwt: jwtToken });
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
});