import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// URL normalizer middleware: handles Vercel rewrites and direct subpaths
app.use((req, res, next) => {
  // If on Vercel with a rewrite to /api, check x-matched-path or originalUrl
  const matchedPath = (req.headers['x-matched-path'] as string) || '';
  if ((req.url === '/api' || req.url === '/api/') && matchedPath && matchedPath.startsWith('/api/')) {
    req.url = matchedPath;
  }

  if (!req.url.startsWith('/api') && (
    req.url.startsWith('/db') || 
    req.url.startsWith('/health') || 
    req.url.startsWith('/upload') || 
    req.url.startsWith('/verify') || 
    req.url.startsWith('/test-db')
  )) {
    req.url = `/api${req.url}`;
  }
  next();
});

// Static uploads directory (read-safe on Vercel serverless)
const uploadsDir = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    // Read-only filesystem warning
  }
}
app.use('/uploads', express.static(uploadsDir));

// Lazy configuration function for Cloudinary
function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are not configured. Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your settings.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  return cloudinary;
}

// Global caching for MongoDB connection in serverless warm environments
let mongoClient: MongoClient | null = (global as any)._mongoClient || null;
let mongoDb: Db | null = (global as any)._mongoDb || null;
let isMongoConnected = !!mongoDb;
let lastMongoError: string | null = null;

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
  page_loader_config: {
    enabled: true,
    videoUrl: '',
    mediaType: 'auto',
    showOnTabChange: true,
    minDurationMs: 850,
    title: 'DAKSHYAM INNOVATIONS',
    subtitle: 'Initializing Advanced Engineering & Telemetry Platform...',
    overlayTheme: 'glass',
    soundEnabled: false,
    showProgress: true,
    videoFit: 'contain'
  },
  home_3d_model: null,
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
  courses: [
    {
      id: 'CRS-IOT-101',
      title: 'IoT & Smart Robotics Engineering',
      duration: '3 Months',
      description: 'Comprehensive vocational training in physical computing, ESP32 microcontroller programming, Wi-Fi telemetry pipelines, and autonomous robotic rovers.',
      tags: ['ESP32', 'Robotics', 'Sensors', 'Telemetry', 'NEP-2020'],
      features: [
        'Hands-on ESP32 architecture & C++ firmware programming',
        'Dual H-Bridge Motor Kinetics & Sensor Diagnostics',
        'Real-time Telemetry Dashboard Deployment',
        'Complete Leased Hardware Kit Included'
      ],
      mobileHardwareIncluded: true
    },
    {
      id: 'CRS-WEB-201',
      title: 'Full-Stack Web & Real-Time Telemetry',
      duration: '8 Weeks',
      description: 'Build scalable web applications, RESTful microservices, and live IoT dashboards using React, TypeScript, Node.js, and MongoDB.',
      tags: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB'],
      features: [
        'Modern Reactive Component Architecture',
        'REST API Development with Express & Middleware',
        'Real-time WebSockets & Telemetry Streaming',
        'Production Deployment to Cloud Infrastructure'
      ],
      mobileHardwareIncluded: false
    },
    {
      id: 'CRS-NEP-301',
      title: 'NEP 2020 Computational Thinking & Coding',
      duration: '1 Month',
      description: 'Inquiry-based foundational coding aligned with the National Education Policy. Covers logical flowcharts, block coding to script transitions, and cyber safety.',
      tags: ['NEP-2020', 'Computational-Thinking', 'Python', 'Logic', 'STEM'],
      features: [
        'Flowchart Architecture & Algorithmic Design',
        'Interactive Simulator & Game Logic Development',
        'Micro:bit & Arduino Physical Logic Demonstrations',
        'Verifiable NEP 2020 Certificate of Completion'
      ],
      mobileHardwareIncluded: true
    },
    {
      id: 'CRS-EMB-401',
      title: 'Embedded Systems & Circuit Instrumentation',
      duration: '6 Weeks',
      description: 'Master electronic circuit schematics, analog-to-digital signal processing, bus protocols (I2C, SPI, UART), and industrial motor drives.',
      tags: ['Embedded-C', 'Circuits', 'PCB-Basics', 'Sensors', 'Hardware'],
      features: [
        'Breadboard Prototyping & Multimeter Testing',
        'Microcontroller Register-Level Interfacing',
        'Pulse-Width Modulation & Motor Velocity Control',
        'Diagnostic Telemetry Logging'
      ],
      mobileHardwareIncluded: true
    }
  ],
  banners: [
    {
      id: 'ban-1',
      title: 'Vocational STEM Laboratories Across Madhya Pradesh Schools',
      subtitle: 'Equipping rural and urban students with leased high-performance hardware kits and hands-on robotics labs under NEP 2020 guidelines.',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      actionUrl: '#services',
      isActive: true,
      createdAt: '2026-01-01'
    },
    {
      id: 'ban-2',
      title: 'Hands-on IoT & Embedded Systems Winter Bootcamp',
      subtitle: '100% practical, project-driven engineering camps where students design, build, and deploy functional IoT telemetric products.',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      actionUrl: '#services',
      isActive: true,
      createdAt: '2026-01-02'
    }
  ],
  gallery_images: [
    {
      id: 'gal-1',
      title: 'Robotics Assembly & Telemetry Testing',
      description: 'Students constructing autonomous wheeled robots with ultrasonic obstacle sensors and ESP32 microcontrollers.',
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
      category: 'iot_robotics',
      createdAt: '2026-01-01'
    },
    {
      id: 'gal-2',
      title: 'School Lab Installation & Microcontroller Workshops',
      description: 'Hands-on laboratory setup and diagnostic breadboard sessions conducted inside regional secondary schools.',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      category: 'school_programs',
      createdAt: '2026-01-02'
    },
    {
      id: 'gal-3',
      title: 'Full-Stack Software Development & Cloud Dashboards',
      description: 'Candidates designing real-time sensor dashboards and REST APIs using modern React and Node.js frameworks.',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
      category: 'mern_web',
      createdAt: '2026-01-03'
    }
  ],
  app_logs: []
};

// Helper function to diagnose and provide actionable troubleshooting guidance for MongoDB Atlas issues
function getMongoAdvice(errStr: string): string {
  if (
    errStr.includes("SSL alert") || 
    errStr.includes("MongoServerSelectionError") || 
    errStr.includes("tlsv1 alert") || 
    errStr.includes("ETIMEDOUT") || 
    errStr.includes("ECONNREFUSED") ||
    errStr.includes("ENOTFOUND")
  ) {
    return "MongoDB Atlas is blocking connections from Vercel's serverless IP addresses. In your MongoDB Atlas Dashboard, go to 'Network Access' -> click 'Add IP Address' -> select 'Allow Access From Anywhere' (0.0.0.0/0). Once saved in Atlas, connection requests will succeed immediately.";
  }
  if (errStr.includes("bad auth") || errStr.includes("AuthenticationFailed") || errStr.includes("auth failed")) {
    return "MongoDB Atlas authentication failed. Please verify your database username and password in MONGODB_URI. If your password contains special characters (e.g. @, #, $, %, +), ensure they are URL-encoded in the connection string (e.g. @ becomes %40).";
  }
  if (!process.env.MONGODB_URI) {
    return "MONGODB_URI is not configured in environment variables. If deploying to Vercel, navigate to Vercel Dashboard -> Project Settings -> Environment Variables, add MONGODB_URI with your Atlas connection string, and trigger a redeployment.";
  }
  return "Verify that MONGODB_URI follows the standard format: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority and that MongoDB Atlas Network Access has 0.0.0.0/0 enabled.";
}

// Safe resilient MongoDB Atlas connection initializer with global pooling
async function getMongoDb(): Promise<Db | null> {
  if (mongoDb) return mongoDb;
  if ((global as any)._mongoDb) {
    mongoDb = (global as any)._mongoDb;
    isMongoConnected = true;
    return mongoDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    lastMongoError = "MONGODB_URI environment variable is missing.";
    isMongoConnected = false;
    return null;
  }

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(uri, {
        connectTimeoutMS: 8000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 30000,
      });
      (global as any)._mongoClient = mongoClient;
    }

    await mongoClient.connect();
    mongoDb = mongoClient.db();
    (global as any)._mongoDb = mongoDb;
    isMongoConnected = true;
    lastMongoError = null;
    console.log("🚀 Successfully connected to live MongoDB Atlas Database!");
    
    // Ensure settings defaults exist in MongoDB settings collection
    try {
      const settingsCol = mongoDb.collection('settings');
      const aboutDoc = await settingsCol.findOne({ id: 'company_about' });
      if (!aboutDoc) {
        await settingsCol.insertOne({ id: 'company_about', value: memoryDb.company_about });
      }
      const pinDoc = await settingsCol.findOne({ id: 'supervisor_pin' });
      if (!pinDoc) {
        await settingsCol.insertOne({ id: 'supervisor_pin', value: memoryDb.supervisor_pin });
      }
    } catch (initErr) {
      console.warn("MongoDB initial collections setup notice:", initErr);
    }

    return mongoDb;
  } catch (error: any) {
    const errStr = error instanceof Error ? error.message : String(error);
    lastMongoError = errStr;
    isMongoConnected = false;
    const advice = getMongoAdvice(errStr);
    console.error(`❌ MongoDB Atlas connection failed. Falling back to local in-memory store.\n💡 Advice: ${advice}`, error);
    return null;
  }
}

// Base route for health & verification
app.get('/api', (req, res) => {
  res.json({
    status: "ok",
    service: "Dakshyam Innovations API Gateway",
    mongodb: isMongoConnected ? "connected" : "local_fallback",
    timestamp: new Date().toISOString()
  });
});

// REST API endpoint to check connection status and diagnostics
app.get('/api/health', async (req, res) => {
  const db = await getMongoDb();
  res.json({
    status: "ok",
    mongodb: db ? "connected" : "local_fallback",
    connected: isMongoConnected,
    hasMongoUri: !!process.env.MONGODB_URI,
    databaseName: db?.databaseName || null,
    environment: process.env.VERCEL ? "vercel" : (process.env.NODE_ENV || "development"),
    details: db ? "Connected to live MongoDB Atlas Database" : "Running on resilient local storage fallback",
    error: lastMongoError || null,
    advice: lastMongoError ? getMongoAdvice(lastMongoError) : null
  });
});

// Dedicated Diagnostic ping test endpoint for admin checks
app.get('/api/test-db', async (req, res) => {
  const startTime = Date.now();
  try {
    const db = await getMongoDb();
    if (!db) {
      return res.json({
        success: false,
        connected: false,
        hasUri: !!process.env.MONGODB_URI,
        error: lastMongoError || 'Could not connect to MongoDB Atlas',
        advice: getMongoAdvice(lastMongoError || '')
      });
    }
    
    // Run real ping on Atlas cluster
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      connected: true,
      database: db.databaseName,
      latencyMs,
      message: `Successfully reached live MongoDB Atlas cluster in ${latencyMs}ms!`
    });
  } catch (err: any) {
    const msg = err.message || String(err);
    return res.json({
      success: false,
      connected: false,
      error: msg,
      advice: getMongoAdvice(msg)
    });
  }
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
      'company_about', 'supervisor_pin', 'page_loader_config', 'home_3d_model', 'courses', 'banners', 'gallery_images', 'app_logs', 'admins'
    ];
    
    const dbData: Record<string, any> = { connected: isMongoConnected };
    const db = await getMongoDb();

    if (db) {
      for (const name of collections) {
        if (name === 'company_about' || name === 'supervisor_pin' || name === 'page_loader_config' || name === 'home_3d_model') {
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

// POST to upload a media or 3D model file (photo, video, or 3D model)
app.post('/api/upload', async (req, res) => {
  const { file, resourceType, fileName } = req.body;
  if (!file) {
    return res.status(400).json({ error: 'No file data received.' });
  }

  // 1. Try Cloudinary if environment credentials are present
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const cSdk = getCloudinary();
      const uploadResponse = await cSdk.uploader.upload(file, {
        resource_type: resourceType || 'auto',
        folder: 'dakshyam_media'
      });

      return res.json({
        success: true,
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
        duration: uploadResponse.duration || 0,
        provider: 'cloudinary'
      });
    } catch (error: any) {
      console.warn('Cloudinary upload warning, falling back to server disk storage:', error.message);
    }
  }

  // 2. Resilient fallback to static server storage in /uploads
  try {
    let fileBuffer: Buffer;
    let ext = 'bin';

    if (typeof file === 'string' && file.startsWith('data:')) {
      const matches = file.match(/^data:([A-Za-z-+/0-9]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        const base64Data = matches[2];
        fileBuffer = Buffer.from(base64Data, 'base64');
        if (mime.includes('mp4')) ext = 'mp4';
        else if (mime.includes('webm')) ext = 'webm';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mov';
        else if (mime.includes('png')) ext = 'png';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('gltf') || mime.includes('glb')) ext = 'glb';
        else if (mime.includes('obj') || mime.includes('plain')) ext = 'obj';
      } else {
        const base64Raw = file.split(',')[1] || file;
        fileBuffer = Buffer.from(base64Raw, 'base64');
      }
    } else if (typeof file === 'string') {
      fileBuffer = Buffer.from(file, 'utf-8');
    } else {
      fileBuffer = Buffer.from(file);
    }

    if (fileName && fileName.includes('.')) {
      const parts = fileName.split('.');
      ext = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    const safeName = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, fileBuffer);

    return res.json({
      success: true,
      url: `/uploads/${safeName}`,
      public_id: safeName,
      provider: 'server_storage'
    });
  } catch (localErr: any) {
    console.error('Server storage upload error:', localErr);
    return res.status(500).json({ 
      error: localErr.message || 'Failed to process file upload.' 
    });
  }
});

// POST to update a collection in Database
app.post('/api/db/:key', async (req, res) => {
  const { key } = req.params;
  const { data } = req.body;
  try {
    const db = await getMongoDb();

    if (db) {
      if (key === 'company_about' || key === 'supervisor_pin' || key === 'page_loader_config' || key === 'home_3d_model') {
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
      if (key === 'company_about' || key === 'supervisor_pin' || key === 'page_loader_config' || key === 'home_3d_model') {
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

// Export app and getMongoDb for server.ts and Vercel serverless execution
export { app, getMongoDb, memoryDb };
export default app;
