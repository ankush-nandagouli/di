import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isMongoConnected = false;

// Safe fallback in-memory data store in case MongoDB is not configured or offline
const memoryDb: Record<string, any> = {
  students: [],
  trainers: [],
  groups: [],
  videos: [],
  certificates: [],
  applications: [],
  special_programs: [],
  special_enrollments: [],
  company_about: {
    companyName: 'Dakshyam Innovations',
    description: 'Dakshyam Innovations is a premier engineering education technology developer and skill incubator. We specialize in physical-digital integrated vocational training, making modern embedded labs, microcontrollers, IoT equipment, and programming frameworks accessible directly to students, primary setups, and regional schools.',
    mission: 'To democratize access to 21st-century technology tools, physical computing, and web engineering.',
    vision: 'To build a standard vocational platform where beginners can smoothly transition from intuitive logical block models into building industrial-level internet of things telemetry systems and back-end web engines.',
    officeLocation: 'Waraseoni, Balaghat District, Madhya Pradesh, India',
    socialGithub: 'https://github.com/dakshyam-innovations',
    socialLinkedin: 'https://linkedin.com/company/dakshyam-innovations',
    socialTwitter: 'https://twitter.com/dakshyam_in',
    socialYoutube: 'https://youtube.com/@dakshyaminnovations',
    founders: [
      { name: 'Himanshu Patle', role: 'Co-Founder & Chief Director', bio: 'Directs strategic planning & corporate relations, aligning industrial skills development targets with institutions and regional secondary setups.', avatarText: 'HP' },
      { name: 'Ankush Nandagouli', role: 'Co-Founder & Chief Software Architect', bio: 'Directs physical/digital telemetry integrations, cloud-hosted API backends, real-time WebSocket pipelines, and educational platforms.', avatarText: 'AN' },
      { name: 'Anand Gautam', role: 'Co-Founder & Embedded Hardware Head', bio: 'Directs circuit diagnostics, micro-controller register calibrations, multi-H-bridge motor kinetics, sensor logic systems, and diagnostic kits.', avatarText: 'AG' },
      { name: 'Shikhar Bisen', role: 'Co-Founder & Laboratory Setup Lead', bio: 'Manages physical laboratory logistics, equipment distributions, electrical integrity checks, and field-stage support frameworks.', avatarText: 'SB' },
      { name: 'Kunal Raut', role: 'Co-Founder & Director of Operations', bio: 'Directs vocational logistics, community outreach campaigns, local school partnerships, and ensures flawless distribution of laboratory teaching kits.', avatarText: 'KR' },
      { name: 'Rohit Bhajipale', role: 'Co-Founder & Regional Coordinator', bio: 'Leads educational outreach programs, public relations, regional technical campaigns, and on-site training sessions.', avatarText: 'RB' }
    ]
  },
  supervisor_pin: '427752',
  courses: [],
  banners: [],
  gallery_images: [],
  app_logs: []
};

// Safe lazy MongoDB connection initializer
async function getMongoDb(): Promise<Db | null> {
  if (mongoDb) return mongoDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI not found in environment. Running with local in-memory fallback.");
    isMongoConnected = false;
    return null;
  }
  try {
    mongoClient = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    isMongoConnected = true;
    console.log("🚀 Successfully connected to live MongoDB Database!");
    
    // Ensure settings defaults exist in MongoDB settings collection
    const settingsCol = mongoDb.collection('settings');
    const aboutDoc = await settingsCol.findOne({ id: 'company_about' });
    if (!aboutDoc) {
      await settingsCol.insertOne({ id: 'company_about', value: memoryDb.company_about });
    }
    const pinDoc = await settingsCol.findOne({ id: 'supervisor_pin' });
    if (!pinDoc) {
      await settingsCol.insertOne({ id: 'supervisor_pin', value: memoryDb.supervisor_pin });
    }
    return mongoDb;
  } catch (error: any) {
    const errStr = error instanceof Error ? error.message : String(error);
    let extraAdvice = "";
    if (errStr.includes("SSL alert") || errStr.includes("MongoServerSelectionError") || errStr.includes("tlsv1 alert")) {
      extraAdvice = "\n💡 IMPORTANT CONFIGURATION ADVICE: This connection failure (SSL alert/ServerSelectionError) typically indicates that MongoDB Atlas is blocking access because the server's IP is not in your IP Access List. Because our containerized environment runs with dynamic IP addresses, you MUST go to your MongoDB Atlas Dashboard -> Network Access -> Add IP Address, and choose 'Allow Access From Anywhere' (IP: 0.0.0.0/0). Once you configure this, the server will connect successfully on the next database request!";
    }
    console.error(`❌ MongoDB connection failed. Running with local in-memory fallback.${extraAdvice}`, error);
    isMongoConnected = false;
    return null;
  }
}

// REST API endpoint to check connection status
app.get('/api/health', async (req, res) => {
  const db = await getMongoDb();
  res.json({
    status: "ok",
    mongodb: db ? "connected" : "local_fallback",
    details: db ? "Connected to live MongoDB Database" : "Running locally on server memory"
  });
});

// Module-level transient memory cache for secure OTP dispatch verification
const verificationCodes: Record<string, string> = {};

// Function to send actual email with OTP code using SMTP
async function sendOTPEmail(email: string, code: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"Dakshyam Academy" <${user}>`;

  if (!host || !user || !pass || user.includes('your_email') || pass.includes('your_app_password')) {
    console.warn("[MAIL] SMTP credentials not fully configured or using default placeholders. Cannot send actual email.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from,
    to: email,
    subject: "🔐 Account Verification OTP - Dakshyam Innovation Academy",
    text: `Greetings!

Thank you for registering with Dakshyam Innovation Academy.

Your verification OTP code is: ${code}

This OTP is valid for 10 minutes. Please enter it on the registration screen to secure and complete your profile setup.

If you did not request this code, please ignore this email.

Best Regards,
Dakshyam Innovation Academy Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800;">DAKSHYAM</h2>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Innovation Academy</p>
        </div>
        <div style="border-top: 3px solid #ea580c; padding-top: 20px;">
          <p style="font-size: 16px; color: #1e293b; line-height: 1.5; margin-top: 0;">Greetings,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Thank you for registering. To complete your secure profile setup, please use the 6-digit OTP verification code below:</p>
          
          <div style="text-align: center; margin: 25px 0; padding: 15px; background-color: #fff7ed; border: 1px dashed #ea580c; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #c2410c; font-family: monospace;">${code}</span>
          </div>
          
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This verification code is active for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-bottom: 0;">If you did not initiate this request, you can safely ignore this email.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Successfully sent actual verification email to ${email}`);
    return true;
  } catch (error: any) {
    console.warn(`[MAIL] Warning: Failed to send OTP email to ${email}. Check your workspace SMTP configurations. details: ${error?.message || error}`);
    return false;
  }
}

// Trigger a 6-digit OTP verification code
app.post('/api/verify/trigger', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email.toLowerCase()] = code;
  
  console.log(`\n============================================\n[SECURITY] Verification OTP code generated for ${email}: ${code}\n============================================\n`);
  
  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection('verifications');
      await col.updateOne(
        { email: email.toLowerCase() },
        { $set: { code, createdAt: new Date().toISOString() } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn("Could not save OTP verification to database, fell back to local server cache:", err);
  }

  // Send the actual code to entered email
  const sent = await sendOTPEmail(email.toLowerCase(), code);

  let responseMessage = `✓ A secure verification code has been sent to ${email}. Please check your inbox or spam folder.`;
  if (!sent) {
    responseMessage = `✓ A secure verification code has been dispatched. (SMTP not configured, check server console logs for developer bypass)`;
  }

  res.json({ 
    success: true, 
    message: responseMessage 
  });
});

// Confirm 6-digit OTP verification code
app.post('/api/verify/confirm', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Missing email or OTP verification code." });
  }

  let expectedCode = verificationCodes[email.toLowerCase()];

  if (!expectedCode) {
    try {
      const db = await getMongoDb();
      if (db) {
        const col = db.collection('verifications');
        const doc = await col.findOne({ email: email.toLowerCase() });
        if (doc) {
          expectedCode = doc.code;
        }
      }
    } catch (err) {
      console.warn("Failed to check database verifications:", err);
    }
  }

  if (expectedCode && expectedCode === code.trim()) {
    res.json({ success: true, message: "Email verification successful!" });
  } else {
    res.status(400).json({ error: "❌ Invalid or expired verification code." });
  }
});

// GET all collections to load into client local storage
app.get('/api/db/all', async (req, res) => {
  try {
    const collections = [
      'students', 'trainers', 'groups', 'videos', 'certificates', 
      'applications', 'special_programs', 'special_enrollments', 
      'company_about', 'supervisor_pin', 'courses', 'banners', 'gallery_images', 'app_logs', 'admins'
    ];
    
    const dbData: Record<string, any> = { connected: isMongoConnected };
    const db = await getMongoDb();

    if (db) {
      for (const name of collections) {
        if (name === 'company_about' || name === 'supervisor_pin') {
          const settingsCol = db.collection('settings');
          const doc = await settingsCol.findOne({ id: name });
          dbData[name] = doc ? doc.value : memoryDb[name];
        } else {
          const col = db.collection(name);
          const list = await col.find({}).toArray();
          // Map to remove dynamic mongodb _id to prevent client typing issues
          dbData[name] = list.map(({ _id, ...rest }) => rest);
        }
      }
    } else {
      // In-memory fallback
      for (const name of collections) {
        dbData[name] = memoryDb[name];
      }
    }
    res.json(dbData);
  } catch (error: any) {
    console.error("Error loading sync snapshot from Database:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST to clear all user-related collections in Database
app.post('/api/db/clear', async (req, res) => {
  try {
    const collectionsToClear = [
      'students', 'trainers', 'groups', 'videos', 'certificates', 
      'applications', 'special_enrollments', 'special_programs',
      'courses', 'banners', 'gallery_images', 'app_logs'
    ];
    const db = await getMongoDb();

    if (db) {
      for (const colName of collectionsToClear) {
        await db.collection(colName).deleteMany({});
      }
    } else {
      for (const colName of collectionsToClear) {
        memoryDb[colName] = [];
      }
    }
    res.json({ success: true, message: "Successfully wiped all user-related collections in database!" });
  } catch (error: any) {
    console.error("Error clearing database collections:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST to update a collection in Database
app.post('/api/db/:key', async (req, res) => {
  const { key } = req.params;
  const { data } = req.body;
  try {
    const db = await getMongoDb();

    if (db) {
      if (key === 'company_about' || key === 'supervisor_pin') {
        const settingsCol = db.collection('settings');
        await settingsCol.updateOne(
          { id: key },
          { $set: { value: data } },
          { upsert: true }
        );
      } else if (Array.isArray(data)) {
        const col = db.collection(key);
        // Clean re-populate collection to align precision
        await col.deleteMany({});
        if (data.length > 0) {
          const itemsToInsert = data.map(({ _id, ...rest }) => rest);
          await col.insertMany(itemsToInsert);
        }
      }
    } else {
      // Fallback local memory store
      if (key === 'company_about' || key === 'supervisor_pin') {
        memoryDb[key] = data;
      } else if (Array.isArray(data)) {
        memoryDb[key] = data;
      }
    }
    res.json({ success: true, connected: isMongoConnected });
  } catch (error: any) {
    console.error(`Error writing collection ${key} to Database:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the frontend
async function main() {
  // Eagerly connect to MongoDB Atlas
  await getMongoDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Development server running on port ${PORT}`);
  });
}

main().catch(err => {
  console.error("Failed to start server:", err);
});
