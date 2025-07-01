const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
import { Request, Response } from "express";
import { isAdmin } from '../services/authService'; // Adjust the import path as necessary



export const authRoute = async (req: Request, res: Response): Promise<void> => {
  const { access_token } = req.body;
  try {
    
    // 1. Get user info from Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const profile = await googleRes.json();
    // 2. Validate profile
    if (profile.email.endsWith('@gosaas.io') === false) {
         const msg = `Unauthorized email domain: ${profile.email}`;
         res.status(403).json({ message: msg });
         res.locals.errorMessage = msg; // Set error message for error handler
         return;
    }   

    // 2. Check if user is admin (custom logic)
    const isAdminFlag = await isAdmin(profile.email);

    // 3. Generate JWT
    const jwtPayload = {
      email: profile.email,
      name: profile.name,
      isAdmin: isAdminFlag,
      // ...other fields...
    };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ jwt: jwtToken });
  } catch {
        res.status(401).json({ message: "Authentication failed" });
        res.locals.errorMessage = "Authentication failed"; // Set error message for error handler
  }
};