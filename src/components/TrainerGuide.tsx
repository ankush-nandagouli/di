import React, { useState } from 'react';
import { BookOpen, Cpu, Globe, Database, HelpCircle, Copy, Check, Terminal, Code, Settings, ChevronRight } from 'lucide-react';

interface GuideBlockProps {
  key?: React.Key;
  title: string;
  desc: string;
  commands?: string[];
  code?: string;
  language?: string;
  explanation: string;
  theme?: 'light' | 'dark';
}

function GuideBlock({ title, desc, commands, code, language = 'javascript', explanation, theme = 'dark' }: GuideBlockProps) {
  const isLight = theme === 'light';
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmdIndex, setCopiedCmdIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, isCode: boolean, index?: number) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (index !== undefined) {
      setCopiedCmdIndex(index);
      setTimeout(() => setCopiedCmdIndex(null), 2000);
    }
  };

  return (
    <div className={`border rounded-2xl p-5 space-y-4 text-left transition-all duration-300 ${
      isLight 
        ? 'bg-slate-50/50 border-slate-200 hover:border-amber-500/20' 
        : 'bg-[#050505]/85 border-cyan-500/10 hover:border-cyan-500/20'
    }`}>
      <div className={`border-b pb-2 ${isLight ? 'border-slate-200/60' : 'border-cyan-500/15'}`}>
        <h4 className={`text-xs font-black font-mono tracking-wide uppercase flex items-center gap-1.5 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          <ChevronRight className={`w-4 h-4 ${isLight ? 'text-amber-700' : 'text-cyan-400'}`} /> {title}
        </h4>
        <p className={`text-[10px] mt-1 leading-relaxed font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{desc}</p>
      </div>

      {commands && commands.length > 0 && (
        <div className="space-y-1.5">
          <span className={`text-[8px] font-mono uppercase tracking-wider block ${
            isLight ? 'text-amber-850 font-extrabold' : 'text-cyan-400/80'
          }`}>Terminal / Installation Commands:</span>
          <div className="space-y-1">
            {commands.map((cmd, idx) => (
              <div key={idx} className={`flex items-center justify-between border px-3 py-1.5 rounded-xl font-mono text-[10px] ${
                isLight 
                  ? 'bg-slate-100 border-slate-200 text-slate-750' 
                  : 'bg-black/60 border-cyan-500/5 text-slate-350'
              }`}>
                <span className="select-all">$ {cmd}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cmd, false, idx)}
                  className={`cursor-pointer p-0.5 transition-colors ${
                    isLight ? 'text-slate-400 hover:text-amber-700' : 'text-slate-500 hover:text-cyan-400'
                  }`}
                  title="Copy command"
                >
                  {copiedCmdIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500 font-extrabold" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {code && (
        <div className="space-y-1.5 relative">
          <div className={`flex justify-between items-center border-b px-3.5 py-1.5 rounded-t-xl ${
            isLight 
              ? 'bg-amber-50/70 border-slate-200 text-amber-900' 
              : 'bg-cyan-950/20 border-cyan-500/10 text-cyan-400/80'
          }`}>
            <span className="text-[8px] font-mono uppercase tracking-wider">Code Snippet ({language})</span>
            <button
              type="button"
              onClick={() => copyToClipboard(code, true)}
              className={`flex items-center gap-1 text-[9px] font-mono cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-amber-800' : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500 font-bold" />
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>
          <pre className={`p-4 rounded-b-xl border border-t-0 font-mono text-[10px] overflow-x-auto max-h-72 select-text ${
            isLight 
              ? 'bg-slate-900 border-slate-200 text-emerald-300' 
              : 'bg-black/90 border-cyan-500/10 text-emerald-400'
          }`}>
            <code>{code}</code>
          </pre>
        </div>
      )}

      <div className={`border rounded-xl p-3 text-3xs leading-relaxed font-mono ${
        isLight 
          ? 'bg-amber-500/5 border-amber-500/10 text-slate-650' 
          : 'bg-cyan-500/5 border-cyan-500/10 text-slate-400'
      }`}>
        <strong className={`font-bold block uppercase mb-1 ${isLight ? 'text-amber-850' : 'text-slate-300'}`}>Architecture & Implementation Insights:</strong>
        <p>{explanation}</p>
      </div>
    </div>
  );
}

interface TrainerGuideProps {
  theme?: 'light' | 'dark';
}

export default function TrainerGuide({ theme = 'dark' }: TrainerGuideProps) {
  const isLight = theme === 'light';
  const [guideCategory, setGuideCategory] = useState<'iot' | 'mern' | 'django' | 'robotics' | 'essential'>('iot');
  const [searchQuery, setSearchQuery] = useState('');

  // Course Guide Topics list
  const guideData = {
    iot: {
      title: 'Advanced IoT with Web Dashboards',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      tagline: 'Bridging physical sensor clusters and microcontrollers to React web infrastructure in real time.',
      blocks: [
        {
          title: 'ESP32 Wi-Fi & MQTT Client Setup',
          desc: 'Establish solid communication loops over IEEE 82.11 b/g/n protocols to broker dynamic JSON telemetry packets.',
          commands: [
            '# Install PubSubClient and ArduinoJson libraries inside Arduino library manager',
            'lib_deps = bblanchon/ArduinoJson@^6.19.4, knolleary/PubSubClient@^2.8'
          ],
          code: `// ESP32 Telemetry Transmitter Protocol
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "Dakshyam_IoT_Hub";
const char* password = "SovereignSecurityNode8";
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.print("Connecting to wifi: ");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected. IP: " + WiFi.localIP().toString());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("DakshyamEsp32Node01")) {
      Serial.println("connected client!");
      client.publish("dakshyam/telemetry/status", "{\"status\":\"ONLINE\"}");
    } else {
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // Create Telemetry Payload
  StaticJsonDocument<200> doc;
  doc["node_id"] = "dkm-esp32-01";
  doc["air_temp"] = 24.5 + (random(-10, 10) * 0.1);
  doc["soil_moisture"] = random(40, 75);
  doc["battery_v"] = 3.92;

  char buffer[200];
  serializeJson(doc, buffer);
  
  client.publish("dakshyam/telemetry/data", buffer);
  delay(10000); // Send telemetry packet every 10 seconds
}`,
          language: 'cpp',
          explanation: 'This code implements an autonomic network listener. It initializes ESP32 registers, connects to securing nodes, and executes formatted MQTT publications. Instruct students to hook up their digital pinouts (DHT22 on GPIO 4, standard capacitive moisture probes on ADC pin GPIO 34) and calibrate inputs.'
        },
        {
          title: 'React Real-time WebSocket Receiver Component',
          desc: 'Listen for real-time socket events on the web portal dashboard and update high-performance state indicators seamlessly.',
          commands: [
            'npm install @google/genai recharts socket.io-client'
          ],
          code: `// React Web Socket Telemetry Hook
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TelemetryPacket {
  node_id: string;
  air_temp: number;
  soil_moisture: number;
  timestamp: string;
}

export function LiveTelemetryWidget() {
  const [history, setHistory] = useState<TelemetryPacket[]>([]);
  const [status, setStatus] = useState('OFFLINE');

  useEffect(() => {
    // Establish socket pipeline
    const socket = io('https://api.dakshyam.in/iot', {
      transports: ['websocket']
    });

    socket.on('connect', () => setStatus('SECURED LIVE'));
    
    socket.on('telemetry_payload', (packet: TelemetryPacket) => {
      const formatted = {
        ...packet,
        timestamp: new Date().toLocaleTimeString()
      };
      setHistory(prev => {
        const keeps = [...prev, formatted];
        if (keeps.length > 20) keeps.shift(); // Keep latest 20 telemetry ticks
        return keeps;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-4 bg-black/80 border border-cyan-500/10 rounded-2xl">
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-xs font-mono font-bold text-cyan-400 uppercase">Live Sensor Track: {status}</h5>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <XAxis dataKey="timestamp" stroke="#64748b" fontSize={8} />
            <YAxis stroke="#64748b" fontSize={8} />
            <Tooltip contentStyle={{ background: '#050505', border: '1px solid #06b6d4' }} />
            <Line type="monotone" dataKey="soil_moisture" stroke="#22d3ee" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="air_temp" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}`,
          language: 'tsx',
          explanation: 'Standardizes Socket.IO client connectors and utilizes rendering boundaries. The hook handles live telemetry parsing, tracks continuous state logs safely, and maps keys inside responsive Recharts canvases.'
        },
        {
          title: 'Advanced IoT Analog Noise Smoothing & Calibration Code',
          desc: 'Filter capacitive soil moisture and raw photoelectric ADC values using an Exponential Moving Average (EMA) noise cancellation algorithm on-device.',
          commands: [
            '# Calibrate capacitive sensor pin on GPIO 34, set ESP32 resolution to 12 bits (0 - 4095)'
          ],
          code: `// Hardware Exponential Moving Average EMA Filter
#define ANALOG_PIN 34
#define BETA 0.15 // Smoothing factor (0.0 < BETA <= 1.0)

double smoothedVal = 0.0;

void setup() {
  Serial.begin(115200);
  pinMode(ANALOG_PIN, INPUT);
  // Establish baseline
  smoothedVal = analogRead(ANALOG_PIN);
}

void loop() {
  int rawVal = analogRead(ANALOG_PIN);
  
  // EMA Filter Formula: S_t = Beta * Y_t + (1 - Beta) * S_{t-1}
  smoothedVal = (BETA * rawVal) + ((1.0 - BETA) * smoothedVal);
  
  // Convert 12-bit ADC to nominal voltage (0 - 3.3V)
  double voltage = (smoothedVal / 4095.0) * 3.3;
  
  Serial.print("Raw_ADC:"); Serial.print(rawVal);
  Serial.print(",Smoothed_ADC:"); Serial.print(smoothedVal);
  Serial.print(",Voltage:"); Serial.println(voltage);
  
  delay(100); // 10Hz sampling frequency
}`,
          language: 'cpp',
          explanation: 'Raw ADC lines pick up heavy ambient electromagnetic noise. An EMA filter provides hardware-level digital signal smoothing on the microchip itself before transmitting wireless packets, avoiding telemetry clutter.'
        }
      ]
    },
    mern: {
      title: 'MERN Stack Applications',
      icon: <Database className="w-4 h-4 text-cyan-400" />,
      tagline: 'JavaScript end-to-end setups linking Express REST interfaces, Mongo collections, and React rendering layouts.',
      blocks: [
        {
          title: 'Express Server & MongoDB connection with Mongoose',
          desc: 'Establish solid cluster pipelines, design student progress metrics and wrap security models.',
          commands: [
            'npm init -y',
            'npm install express mongoose cors dotenv jsonwebtoken bcryptjs',
            'npm install --save-dev typescript @types/express @types/node ts-node-dev'
          ],
          code: `// Express server.ts configuration with Mongoose
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dakshyam_portal';
const PORT = process.env.PORT || 3000;

// Connect Database Clusters
mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ Enterprise MongoDB Database connected'))
  .catch((err) => console.error('✗ Cluster failed: ', err));

// Define Student Progress Class Core Schema
const ProjectReviewSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  projectTitle: { type: String, required: true },
  achievedXp: { type: Number, default: 0 },
  milestones: [{
    title: String,
    isCompleted: Boolean,
    checkedAt: Date
  }]
}, { timestamps: true });

export const ProjectReview = mongoose.model('ProjectReview', ProjectReviewSchema);

app.post('/api/grades/assign', async (req, res) => {
  try {
    const { studentId, courseId, projectTitle, achievedXp } = req.body;
    const review = await ProjectReview.findOneAndUpdate(
      { studentId, courseId },
      { projectTitle, achievedXp, $push: { milestones: { title: 'Assessed By Supervisor', isCompleted: true, checkedAt: new Date() } } },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, payload: review });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`Server routing active on host http://0.0.0.0:\${PORT}\`);
});`,
          language: 'typescript',
          explanation: 'Demonstrates cluster orchestration, payload extraction, model schemas, and error boundaries. Perfect example for teaching REST design rules, CORS middleware policies, and database upserts.'
        },
        {
          title: 'Custom Token JWT Authentication Middleware',
          desc: 'Secure private training pipelines using modern cryptographically signed JSON Web Tokens (JWT).',
          code: `// Security Middleware: authjwt.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userSession?: {
    userId: string;
    role: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <JWT_SECRET>

  if (!token) {
    return res.status(401).json({ error: 'Sovereign permission credentials token missing.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'DakshyamSecretAuthKeyCell', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Auth credentials invalid/stale.' });
    }
    req.userSession = decoded as any;
    next();
  });
};`,
          language: 'typescript',
          explanation: 'Instructors should teach students how credentials validation protects REST models. Explain payload dissection, cryptographic signing, and safe request context extensions.'
        },
        {
          title: 'Express aggregation pipeline: Course Average Grades',
          desc: 'Trigger MongoDB aggregation queries to summarize course statistical distributions, student counters, and average marks dynamically.',
          commands: [
            '# Ensure mongoose schema matches referenced collections correctly'
          ],
          code: `// REST Aggregation Controller Express Route
import { Router } from 'express';
import { ProjectReview } from './server';
const router = Router();

router.get('/api/analytics/course-summary/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const report = await ProjectReview.aggregate([
      { $match: { courseId: courseId } },
      { 
        $group: {
          _id: "$courseId",
          totalStudentsReviewed: { $sum: 1 },
          averageXpEarned: { $avg: "$achievedXp" },
          highestXpEarned: { $max: "$achievedXp" },
          milestonesFinished: { 
            $sum: { $size: { $ifNull: ["$milestones", []] } } 
          }
        }
      }
    ]);
    if (report.length === 0) {
      return res.status(404).json({ message: "No review logs discovered for this ID." });
    }
    res.json({ success: true, metrics: report[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;`,
          language: 'typescript',
          explanation: 'Using Mongoose aggregate arrays shifts heavy computation workloads directly onto the database cluster engine, eliminating slow memory-heavy client-side sorting algorithms.'
        }
      ]
    },
    django: {
      title: 'Python Django & DRF',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      tagline: 'High-performance API engineering using Django, PostgreSQL, and Django Rest Framework (DRF) serializers.',
      blocks: [
        {
          title: 'Django Models & PostgreSQL Migration Schemes',
          desc: 'Create highly robust Python database models for curriculum and assessment indices, complete with migration schemes.',
          commands: [
            'python3 -m venv venv',
            'source venv/bin/activate  # On Windows: venv\\Scripts\\activate.bat',
            'pip install django djangorestframework django-cors-headers psycopg2-binary',
            'django-admin startproject dakshyam_api .',
            'django-admin startapp core'
          ],
          code: `# core/models.py
from django.db import models
from django.contrib.auth.models import User

class StudentSyllabus(models.Model):
    title = models.CharField(max_length=200, help_text="Syllabus module title")
    course_code = models.CharField(max_length=50, unique=True)
    duration_weeks = models.IntegerField(default=12)
    objectives = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Student Syllabi"

    def __str__(self):
        return f"[{self.course_code}] {self.title}"

class CourseUnit(models.Model):
    syllabus = models.ForeignKey(StudentSyllabus, on_relationship=models.CASCADE, related_name="units")
    week_number = models.IntegerField()
    unit_title = models.CharField(max_length=200)
    topics = models.TextField(help_text="Comma-separated topics")
    skills_acquired = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"W{self.week_number}: {self.unit_title}"`,
          language: 'python',
          explanation: 'This models the syllabus and unit maps using Django Object Relational Mapping (ORM). Show the students how to make migrations (makemigrations, migrate) and how foreign keys establish relation tables.'
        },
        {
          title: 'DRF Serializers & Protected ViewSets',
          desc: 'Serialize complex ORM tables, parse relations, and protect APIs using standard REST Framework permission guards.',
          code: `# core/serializers.py
from rest_framework import serializers
from .models import StudentSyllabus, CourseUnit

class CourseUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseUnit
        fields = ['id', 'week_number', 'unit_title', 'topics', 'skills_acquired']

class StudentSyllabusSerializer(serializers.ModelSerializer):
    units = CourseUnitSerializer(many=True, read_only=True)

    class Meta:
        model = StudentSyllabus
        fields = ['id', 'title', 'course_code', 'duration_weeks', 'objectives', 'units']


# core/views.py
from rest_framework import viewsets, permissions
from .models import StudentSyllabus
from .serializers import StudentSyllabusSerializer

class SyllabusViewSet(viewsets.ModelViewSet):
    queryset = StudentSyllabus.objects.all().prefetch_related('units')
    serializer_name = StudentSyllabusSerializer
    
    # Secure API endpoint
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]`,
          language: 'python',
          explanation: 'The Django Rest Framework (DRF) patterns serialize relational databases into highly accessible JSON formats. Explain the query performance benefits of using prefetch_related for many-to-one models.'
        },
        {
          title: 'Secure Grade Submission with Transaction Rollback',
          desc: 'Trigger bulk marks uploads within atomic database transactions, rolling back any partial changes if errors arise.',
          commands: [
            '# Setup Django transactional decorators to lock atomic writes'
          ],
          code: `# core/views.py
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import CourseUnit
from django.contrib.auth.models import User

class BulkGradeSubmissionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        grades_list = request.data.get('grades', [])
        
        try:
            with transaction.atomic():
                # Any query inside this context manager executes as a singular transaction
                for entry in grades_list:
                    student_email = entry.get('student_email')
                    xp_value = int(entry.get('achieved_xp', 0))
                    
                    # Log audit records and assert validity
                    if xp_value < 0 or xp_value > 100:
                        raise ValueError(f"XP bounds violated (0-100) for {student_email}")
                    
                    # Update table entries safely
                    self.save_audit_record(student_email, xp_value)
                    
            return Response({"success": True, "details": "Transactions locked!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Automatic rollback occurs here if any check fails
            return Response({"error": str(e), "rollback": True}, status=status.HTTP_400_BAD_REQUEST)
            
    def save_audit_record(self, email, xp):
        # Audit trace helper placeholder
        pass`,
          language: 'python',
          explanation: 'Atomic database transactions shield relational storage systems from transient thread blockages. Emphasize how transaction rollbacks keep records completely integral.'
        }
      ]
    },
    robotics: {
      title: 'Robotics, Actuators & Kinematics',
      icon: <Settings className="w-4 h-4 text-cyan-400" />,
      tagline: 'Physical engineering, bluetooth, control nodes, and kinematics equations to manipulate gears and chassis.',
      blocks: [
        {
          title: 'Arduino L298N Motor Driver Control Snippet',
          desc: 'Write microsecond PWM values, set direction codes, and execute turning mechanics on small tracked bots.',
          commands: [
            '# Connect L298N pins: IN1->D5, IN2->D6, ENA->D9 (PWM), IN3->D7, IN4->D8, ENB->D10 (PWM)'
          ],
          code: `// Dual motor differential drive driver loop
const int IN1 = 5;
const int IN2 = 6;
const int ENA = 9;  // Left PWM Speed pin

const int IN3 = 7;
const int IN4 = 8;
const int ENB = 10; // Right PWM Speed pin

void setup() {
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENB, OUTPUT);
  
  Serial.begin(9600);
  Serial.println("Robotics Chassis Controller Ready");
}

void driveForward(int speed) {
  // Speed parameter (0 to 255)
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
  
  // Set Left Forward
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  
  // Set Right Forward
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void steerLeft(int pivotSpeed) {
  analogWrite(ENA, pivotSpeed);
  analogWrite(ENB, pivotSpeed);
  
  // Pivot left backwards
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  
  // Pivot right forwards
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void haltChassis() {
  digitalWrite(ENA, 0);
  digitalWrite(ENB, 0);
}`,
          language: 'cpp',
          explanation: 'This code maps out standard H-Bridge control sequences. Instructors should illustrate how high-duty-cycles correspond to stronger voltages, making wheels turn quicker. Emphasize optical encoders to track motor rotations.'
        },
        {
          title: 'Robotics Differential Drive Kinematics',
          desc: 'Formulate equations converting wheel rotational vectors into spatial global linear velocities (x, y, θ).',
          code: `## Differential Kinematics Reference Card

For a chassis with two independent coaxial wheels of radius (r) separated by distance (L):

1. Wheel Linear Speeds (v_left, v_right) from Rotational Speed in radians/sec (omega):
   v_left = r * omega_left
   v_right = r * omega_right

2. Overall Chassis Linear Velocity (V) on centerline:
   V = (v_right + v_left) / 2

3. Angular Rotative Velocity of Chassis (omega_chassis) in rads/sec:
   omega_chassis = (v_right - v_left) / L

4. Real-time Pose Update Equations (Odometry tracking):
   d_theta = omega_chassis * dt
   d_x = V * cos(theta) * dt
   d_y = V * sin(theta) * dt`,
          language: 'markdown',
          explanation: 'These calculations are critical for building intelligent autonomous bots. Demonstrate how errors build up over time due to wheel slip, and how LIDAR or IMU sensors help re-localize coordinates.'
        },
        {
          title: 'Ultrasonic HC-SR04 Non-Blocking Proportional Braking',
          desc: 'Evaluate microsecond ultrasonic sound wave travel times to trigger automatic proportional speed reduction and brakes.',
          commands: [
            '# Connect HC-SR04: Trig -> Pin 11, Echo -> Pin 12, Safety Threshold -> 15cm'
          ],
          code: `// Non-blocking ultrasonic speed throttle loop
const int TRIG_PIN = 11;
const int ECHO_PIN = 12;
const int BRAKE_LIGHT_PIN = 13;
const int SAFETY_MARGIN_CM = 15; // Trigger brakes under 15cm

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BRAKE_LIGHT_PIN, OUTPUT);
  Serial.begin(115200);
}

long queryDistanceCm() {
  // Clear trigger line
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Emit 10 microsecond high trigger pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read high travel duration in microseconds (with 30ms timeout)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); 
  
  if (duration == 0) return 999; // Default clearance if timeout
  
  // Distance = (Duration * speed of sound 0.0343cm/us) / 2
  long distanceCm = (duration * 0.0343) / 2;
  return distanceCm;
}

void loop() {
  long obsRange = queryDistanceCm();
  Serial.print("Obstacle_Range_Cm:");
  Serial.println(obsRange);

  if (obsRange <= SAFETY_MARGIN_CM) {
    // Halt motor pins, set emergency brake status high
    digitalWrite(BRAKE_LIGHT_PIN, HIGH);
    Serial.println("STATUS: EMERGENCY BRAKES ACTIVE!");
  } else {
    digitalWrite(BRAKE_LIGHT_PIN, LOW);
  }
  delay(100); // 10Hz polling
}`,
          language: 'cpp',
          explanation: 'Calculates distances based on acoustic travel time. The timeout parameter in pulseIn secures continuous control flow, preventing infinite halts when no echo rebounds.'
        }
      ]
    },
    essential: {
      title: 'School IT & Coding Essentials',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      tagline: 'Fostering computing foundations for junior schools, logic building, basic HTML markup, and environment setup.',
      blocks: [
        {
          title: 'HTML & CSS Basic Workspace Project',
          desc: 'Teach children the structured anatomy of web pages using proper nested DOM nodes and basic classes.',
          code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My First Smart Portfolio</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0fdfa;
            color: #0f172a;
            padding: 30px;
        }
        .header-card {
            background-color: #0d9488;
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .intro-text {
            font-size: 16px;
            line-height: 1.6;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header-card">
        <h1>Welcome to Dakshyam Coding Class!</h1>
        <p>I am learning to build physical-digital systems manually.</p>
    </div>
    
    <p class="intro-text">
        Today we worked with LED sensor circuits and translated logic statements. 
        Soon we will create autonomous light sensors that trigger email alerts!
    </p>
</body>
</html>`,
          language: 'html',
          explanation: 'Provides a clean starter HTML folder page. Guide students on tag containment structures, style scopes, and view responsive testing.'
        },
        {
          title: 'Logic Mapping: From Python Blocks to Scratch',
          desc: 'Translate visual blocks (Scratch variables/conditions) into real structural statements using Python.',
          code: `# Scratch logical blocks equivalent in Python

# Scratch [Set score to 0]
score = 0

# Scratch [Repeat until score = 10]
while score < 10:
    print("Keep playing!")
    score += 1 # Scratch [Change score by 1]

# Scratch [If soil_moisture < 50 then...]
soil_moisture = 42

if soil_moisture < 50:
    # Action: Turn on valve
    print("Action active: WATER VALVES ENABLED")
else:
    # Action: Remain shut
    print("Soil healthy: WATER VALVES CLOSED")`,
          language: 'python',
          explanation: 'Excellent teaching aid for beginners. Connecting drag-and-drop Scratch loops with real textual variables greatly helps kids grasp coding syntax without fear.'
        },
        {
          title: 'Interactive note list with LocalStorage build project',
          desc: 'Guide kids to build their first self-saving homework task planner using simple HTML/CSS and client state APIs.',
          code: `<!-- Copy and open directly inside any browser to run -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dakshyam Smart Task Planner</title>
    <style>
        body { font-family: sans-serif; padding: 25px; background-color: #fafafb; }
        .box { max-width: 400px; margin: auto; background: white; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .task-list { margin-top: 15px; }
        .task-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        button { background: #0ea5e9; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="box">
        <h3>My Smart Planner</h3>
        <div style="display:flex; gap:8px;">
            <input type="text" id="taskInput" placeholder="Enter task..." style="flex:1; padding:6px; border-radius:4px; border:1px solid #ccc;">
            <button onclick="addTask()">Add</button>
        </div>
        <div id="taskList" class="task-list"></div>
    </div>

    <script>
        // Retrieve and load values
        let tasks = JSON.parse(localStorage.getItem('my_tasks') || '[]');

        function saveAndRender() {
            localStorage.setItem('my_tasks', JSON.stringify(tasks));
            const container = document.getElementById('taskList');
            container.innerHTML = '';
            tasks.forEach((task, index) => {
                container.innerHTML += \`
                    <div class="task-item">
                        <span>\${task}</span>
                        <a href="#" onclick="deleteTask(\${index})" style="color:red; text-decoration:none; font-size:12px;">Delete</a>
                    </div>
                \`;
            });
        }

        function addTask() {
            const input = document.getElementById('taskInput');
            if (input.value.trim() !== '') {
                tasks.push(input.value.trim());
                input.value = '';
                saveAndRender();
            }
        }

        function deleteTask(index) {
            tasks.splice(index, 1);
            saveAndRender();
        }

        saveAndRender();
    </script>
</body>
</html>`,
          language: 'html',
          explanation: 'Demonstrates parsing state arrays to JSON and writing them into the browser local storage block. Beginners learn script tag execution, array slicing, and basic event triggers.'
        }
      ]
    }
  };

  const currentCategory = guideData[guideCategory];
  const allBlocks = currentCategory.blocks;

  const filteredBlocks = allBlocks.filter(block => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      block.title.toLowerCase().includes(query) ||
      block.desc.toLowerCase().includes(query) ||
      block.explanation.toLowerCase().includes(query) ||
      (block.code && block.code.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Category selector panel */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border p-4 rounded-2xl transition-all duration-300 ${
        isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-[#050505]/50 border-cyan-500/10'
      }`}>
        <div className="flex items-center gap-2.5">
          <BookOpen className={`w-5 h-5 ${isLight ? 'text-amber-700' : 'text-cyan-400'}`} />
          <div className="text-left font-mono">
            <h3 className={`text-xs font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>Supervisor Curriculum Guides</h3>
            <p className={`text-[9px] leading-none mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Search and preview production-ready code guides.</p>
          </div>
        </div>

        {/* Global guide search */}
        <div className="w-full sm:w-60">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides or code..."
            className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none font-mono transition-all ${
              isLight 
                ? 'bg-white border border-slate-250 text-slate-800 placeholder:text-slate-400 focus:border-amber-500' 
                : 'bg-black/60 border border-cyan-500/10 text-white placeholder:text-slate-600 focus:border-cyan-400'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Left Side: selectors */}
        <div className="md:col-span-1.5 flex flex-col gap-2 font-mono text-3xs uppercase font-extrabold text-left">
          <button
            type="button"
            onClick={() => setGuideCategory('iot')}
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              guideCategory === 'iot'
                ? (isLight ? 'bg-amber-600/10 border-amber-500/30 text-amber-900 font-black' : 'bg-cyan-500/15 border-cyan-500/30 text-white')
                : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'bg-black/20 border-cyan-500/5 text-slate-400 hover:text-white hover:border-cyan-500/10')
            }`}
          >
            <Cpu className={`w-4 h-4 shrink-0 ${guideCategory === 'iot' ? (isLight ? 'text-amber-800' : 'text-cyan-400') : 'text-slate-400'}`} />
            <div className="leading-tight">
              <span>IoT & Web Dev</span>
              <span className={`text-[8px] font-normal block leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Microcontrollers, WebSockets</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setGuideCategory('mern')}
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              guideCategory === 'mern'
                ? (isLight ? 'bg-amber-600/10 border-amber-500/30 text-amber-900 font-black' : 'bg-cyan-500/15 border-cyan-500/30 text-white')
                : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'bg-black/20 border-cyan-500/5 text-slate-400 hover:text-white hover:border-cyan-500/10')
            }`}
          >
            <Database className={`w-4 h-4 shrink-0 ${guideCategory === 'mern' ? (isLight ? 'text-amber-800' : 'text-cyan-400') : 'text-slate-400'}`} />
            <div className="leading-tight">
              <span>MERN Stack</span>
              <span className={`text-[8px] font-normal block leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>MongoDB, Express, JWT</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setGuideCategory('django')}
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              guideCategory === 'django'
                ? (isLight ? 'bg-amber-600/10 border-amber-500/30 text-amber-900 font-black' : 'bg-cyan-500/15 border-cyan-500/30 text-white')
                : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'bg-black/20 border-cyan-500/5 text-slate-400 hover:text-white hover:border-cyan-500/10')
            }`}
          >
            <Globe className={`w-4 h-4 shrink-0 ${guideCategory === 'django' ? (isLight ? 'text-amber-800' : 'text-cyan-400') : 'text-slate-400'}`} />
            <div className="leading-tight">
              <span>Python & Django</span>
              <span className={`text-[8px] font-normal block leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Django Rest, postgres</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setGuideCategory('robotics')}
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              guideCategory === 'robotics'
                ? (isLight ? 'bg-amber-600/10 border-amber-500/30 text-amber-900 font-black' : 'bg-cyan-500/15 border-cyan-500/30 text-white')
                : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'bg-black/20 border-cyan-500/5 text-slate-400 hover:text-white hover:border-cyan-500/10')
            }`}
          >
            <Settings className={`w-4 h-4 shrink-0 ${guideCategory === 'robotics' ? (isLight ? 'text-amber-800' : 'text-cyan-400') : 'text-slate-400'}`} />
            <div className="leading-tight">
              <span>Robotics & Actuators</span>
              <span className={`text-[8px] font-normal block leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Kinematics, Motor Drivers</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setGuideCategory('essential')}
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              guideCategory === 'essential'
                ? (isLight ? 'bg-amber-600/10 border-amber-500/30 text-amber-900 font-black' : 'bg-cyan-500/15 border-cyan-500/30 text-white')
                : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'bg-black/20 border-cyan-500/5 text-slate-400 hover:text-white hover:border-cyan-500/10')
            }`}
          >
            <Terminal className={`w-4 h-4 shrink-0 ${guideCategory === 'essential' ? (isLight ? 'text-amber-800' : 'text-cyan-400') : 'text-slate-400'}`} />
            <div className="leading-tight">
              <span>School Coding</span>
              <span className={`text-[8px] font-normal block leading-none mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>HTML/CSS, Scratch translator</span>
            </div>
          </button>
        </div>

        {/* Right Side: Guide content blocks list */}
        <div className={`md:col-span-3.5 space-y-5 text-left md:border-l md:pl-6 ${
          isLight ? 'md:border-slate-200' : 'md:border-cyan-500/10'
        }`}>
          <div className="space-y-1 select-text">
            <h4 className={`text-sm font-black font-mono tracking-wider uppercase flex items-center gap-1.5 matches ${
              isLight ? 'text-amber-900' : 'text-[#22d3ee]'
            }`}>
              {React.cloneElement(currentCategory.icon, { className: `w-4 h-4 ${isLight ? 'text-amber-850' : 'text-cyan-400'}` })} {currentCategory.title}
            </h4>
            <p className={`text-xs leading-relaxed font-sans mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{currentCategory.tagline}</p>
          </div>

          <div className="space-y-5">
            {filteredBlocks.length > 0 ? (
              filteredBlocks.map((block, idx) => (
                <GuideBlock
                  key={idx}
                  title={block.title}
                  desc={block.desc}
                  commands={block.commands}
                  code={block.code}
                  language={block.language}
                  explanation={block.explanation}
                  theme={theme}
                />
              ))
            ) : (
              <div className={`text-center py-12 border border-dashed rounded-xl ${
                isLight ? 'border-slate-300 bg-slate-50/50' : 'border-cyan-500/10'
              }`}>
                <p className="text-xs text-slate-500 italic font-mono">No matching guides found for current search parameters.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
