import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, Clock, Bookmark, ChevronDown, Check, GraduationCap } from 'lucide-react';
import { Course, CourseApplication } from '../types';

interface SyllabusExplorerProps {
  courses: Course[];
  applications: CourseApplication[];
}

interface SyllabusDetail {
  courseId: string;
  targetAudience: string;
  prerequisites: string;
  detailedOverview: string; // Dynamic rich course summary
  weeks: Array<{
    week: string;
    title: string;
    description: string; // In-depth chapter summary
    topics: string[];
    skills: string[];
    practicalLab: string; // Physical hands-on hardware/software lab experiment
  }>;
}

const SYLLABUS_DATABASE: Record<string, SyllabusDetail> = {
  'course-1': {
    courseId: 'course-1',
    targetAudience: 'Polytechnic, Engineering, & Science Undergraduates',
    prerequisites: 'Basic knowledge of electrical currents and high school physics',
    detailedOverview: 'This program offers a premium crossover track connecting low-level hardware registers directly to full-stack reactive client interfaces. Students gain experience constructing robust, on-site telemetry networks, filtering raw sensor fluctuations locally, and outputting data streams over secure wireless channels for real-time remote analysis. Perfect for engineers aiming to master the complete vertical IoT production chain from physical circuit to web dashboard.',
    weeks: [
      {
        week: 'Weeks 1-4',
        title: 'Hardware Foundations & Microcontroller Registers',
        description: 'Focuses on the exact physics of dual-core processors and custom circuit routing. Beginners and intermediate participants learn how to debug register nodes, establish standard serial baud rates, and maintain continuous signal stability without causing board resets.',
        topics: [
          'Anatomy of microcontrollers: ESP32 versus Arduino Uno architecture',
          'Interfacing analog/digital pinouts, pulling high/low signals, debouncing techniques',
          'Reading complex sensor registers (DHT22 Humidity, capacitive moisture, light nodes)',
          'Setting up local serial logging and debugging registers in Arduino IDE'
        ],
        skills: ['Embedded C++', 'GPIO Register Mapping', 'Circuit Breadboarding', 'UART Protocols'],
        practicalLab: 'LAB 1A: Setup a physical breadboard combining a capacitive soil moisture probe and an ESP32 microchip. Calibrate the analog-to-digital converter (ADC) settings, map the raw values (0-4095) to moisture percentages, and output stable, filtered metrics via the high-speed UART Serial monitor.'
      },
      {
        week: 'Weeks 5-8',
        title: 'Wireless Network Interfaces & Cloud Communication APIs',
        description: 'Bridges physical embedded products to internet network fabrics. Students learn to handle asynchronous Wi-Fi link drop-offs, serialize complex nested parameters into raw JSON packages, and dispatch data via REST POST/GET actions or lightweight publish-subscribe channels.',
        topics: [
          'Configuring ESP32 WiFi client registers and secure access handshakes',
          'Formulating structured JSON request telemetry packets with ArduinoJson',
          'REST endpoints: Publishing measurements via HTTP POST/GET to backends',
          'MQTT Broker architecture: Subscribing to command threads with PubSubClient'
        ],
        skills: ['MQTT Brokers', 'REST APIs', 'JSON Serialization', 'Network Handshaking'],
        practicalLab: 'LAB 2A: Write firmware to connect the ESP32 to a local Wi-Fi router. Construct a custom telemetry package sending moisture percentage, nominal voltage levels, and an uptime heartbeat in JSON format. Transmit this payload every 10 seconds to a live REST endpoint, with automatic link recovery if connection drops.'
      },
      {
        week: 'Weeks 9-12',
        title: 'Full Stack React Web Telemetry Dashboard',
        description: 'Translates raw socket streams into executive, visual diagnostic consoles. Students engineer responsive browsers that map signals in real-time, maintain high frame-rate drawings, and allow physical remote triggers to activate motor devices instantly over high-speed relays.',
        topics: [
          'Bootstrapping browser client applications with React and Tailwind CSS variables',
          'Establishing live WebSocket pipelines to receive streaming sensor updates',
          'Rendering historical telemetry records with responsive Recharts canvas drawings',
          'Building physical bypass actuators (Web buttons triggering pins over remote nodes)'
        ],
        skills: ['React Hooks', 'Tailwind Utility Styles', 'Data Vis (Recharts)', 'WebSockets'],
        practicalLab: 'LAB 3A: Develop a reactive dashboard that connects to the live data stream. Use Recharts to render smooth, real-time line charts of soil moisture levels. Add an interactive toggle button on the web UI that triggers an API call back to the ESP32, which immediately switches a physical water pump relay high or low.'
      }
    ]
  },
  'course-2': {
    courseId: 'course-2',
    targetAudience: 'Aspiring Web Application Engineers & Full Stack Developers',
    prerequisites: 'Basic logic scripting, HTML structures, and text-editor operations',
    detailedOverview: 'Master high-speed database engineering and scalable routing systems. This intense curriculum guides students through the MERN ecosystem (MongoDB, Express, React, Node) and Django REST structures (Python). Learn to secure user data with state-of-the-art token patterns, manage atomic relational databases with Postgres, and deploy containerized code models safely into live cloud environments.',
    weeks: [
      {
        week: 'Weeks 1-2',
        title: 'MongoDB Databases & Express API Routers (MERN)',
        description: 'Dives directly into constructing database schemas and REST API layers. Students learn and implement NoSQL document storage models, handle validation constraints in server-side schemas, and direct robust Express routers that safely handle complex queries.',
        topics: [
          'Relational vs Non-Relational structures: Configuring MongoDB clusters',
          'Mongoose schemas: Formulating models, validations, and cascading lookups',
          'Express application routing, parameter parsing, and custom error boundaries',
          'Postman configurations for testing stateful HTTP API requests'
        ],
        skills: ['MongoDB NoSQL', 'Mongoose ODM', 'Express JS routing', 'REST API Testing'],
        practicalLab: 'LAB 1B: Design a MongoDB schema for a vocational training register. Build Express controllers to handle CRUD operations on students, validate incoming payloads (e.g. email pattern, phone format), and test all endpoints using Postman to verify secure JSON outputs.'
      },
      {
        week: 'Weeks 3-4',
        title: 'NodeJS Security Controls & Cryptographic Session Authentication',
        description: 'Explores industrial software protection mechanisms. Developers implement cryptographic one-way hashing for secure passwords and write custom Express middle-wares that verify signed tokens, securing private student and trainer operations.',
        topics: [
          'Hashing security layers: Storing salt credentials recursively with Bcrypt',
          'Orchestrating symmetric JWT signatures for secure session management',
          'Designing robust JWT validator middlewares to lock and shield Express routers',
          'Session cookies, HTTP-only storage settings, and secure CORS headers setup'
        ],
        skills: ['Node JS', 'JWT Securities', 'Bcrypt Hashing', 'CORS Middleware'],
        practicalLab: 'LAB 2B: Code a user registration and login loop. Encrypt student passwords with Bcrypt (round 12 salt strength) before saving. Upon login check, generate a signed JSON Web Token (JWT) with user security roles, and implement a secure verification middleware to protect sensitive diagnostic links.'
      },
      {
        week: 'Weeks 5-6',
        title: 'Python Django Mappings & PostgreSQL Migrations',
        description: 'Transitions developers to highly Structured Relational Models. Students setup PostgreSQL tables, coordinate Django ORMs, execute database migrations, and configure administrative panels to manage school curriculum entries directly.',
        topics: [
          'Installing Python pip virtualenv and initializing Django core projects',
          'Django ORM models: Setting up strict relation tables with Postgres backends',
          'Executing Django DB migrations: makemigrations, status auditing, and rollback logs',
          'The Django Admin panel: Customizing user views for backoffice workflows'
        ],
        skills: ['Python 3', 'Django Framework', 'PostgreSQL', 'Database Migrations'],
        practicalLab: 'LAB 3B: Initialize a clean Django framework project linked to a local PostgreSQL instance. Write relational database schemas for Course Syllabus Units and Trainer records. Execute safe database migrations and customize the Django Admin dashboard to manage and sort these models.'
      },
      {
        week: 'Weeks 7-8',
        title: 'Django Rest Framework (DRF) & Client Web Integrations',
        description: 'Instructs developers on publishing clean, standard API formats. Students serialize relational Python models, implement role-based permission settings, and build a unified React frontend dashboard that reads from both Express and Django REST interfaces.',
        topics: [
          'Creating DRF ModelSerializers to convert python queries to JSON data maps',
          'Generic ViewSets and API views with token permissions restriction rules',
          'Building multi-backend clients: Connecting a single React portal to MERN & Django services',
          'Production build configurations and deploying Node/Python containers to Cloud engines'
        ],
        skills: ['Django REST Framework', 'JSON Serializers', 'Multi-API client integration', 'Docker Builds'],
        practicalLab: 'LAB 4B: Develop a set of Django REST ViewSets to serialize Postgres models into standardized JSON. Integrate token auth restrictions, then build a React view that aggregates and queries lessons from both your Express Node.js endpoints and Django endpoints simultaneously.'
      }
    ]
  },
  'course-3': {
    courseId: 'course-3',
    targetAudience: 'Robotics Enthusiasts & Mechanical Automation Students',
    prerequisites: 'Basic knowledge of high school maths (trigonometry & vectors)',
    detailedOverview: 'Step into the dynamic domain of mechanical kinetics, actuator controllers, and real-time pathfinding logic. This Bootcamp trains students to direct motorized drivetrains, calculate spatial kinematics, handle dual-H-Bridge current pathways, and program autonomous robotics bots that calculate real-time bypass routines based on ultrasound arrays.',
    weeks: [
      {
        week: 'Week 1',
        title: 'Motors, Energy Shields & Dual-H-Bridge Actuators',
        description: 'Focuses on power physics and rotational actuators. Students study the limits of high-energy lithium batteries, configure voltage regulators, and build custom PWM scripts to precisely adjust wheel spin rates without burning chip controllers.',
        topics: [
          'Anatomy of motors: Geared DC, servo sweeps, and optical encoders',
          'Voltages and current safety limits: Hooking up lithium batteries and regulatory shields',
          'The L298N dual H-Bridge: Controlling direction with high/low register variables',
          'PWM (Pulse width modulation) registries for fine motor speed control'
        ],
        skills: ['H-Bridge Drivers', 'PWM Calibrations', 'Motor Servos', 'Power Management'],
        practicalLab: 'LAB 1C: Connect an L298N H-Bridge driver board to a microcontroller. Wire two DC motors and configure high/low driving pins. Write a PWM loop that smoothly ramps the speed forward, triggers a soft stopping deceleration, and reverses direction, maintaining safe current draw.'
      },
      {
        week: 'Week 2',
        title: 'Differential Steering Mechanics & Spatial Kinematics',
        description: 'Combines coordinate trigonometry with real hardware kinetics. Students derive equations for differential steer curves, parse optical encoder square-wave feedback pulses, and estimate exact robot pose layout vectors (X, Y, Heading) in live code registers.',
        topics: [
          'Calculating linear speed of wheel assemblies: Radius vs angular frequency',
          'Differential steer calculations: Turning radius, angular chassis velocities',
          'Calculating odometry vectors using optical incremental encoder feedback pulses',
          'Tracking robot pose coordinates (X, Y, θ) in real-time script loops font-mono'
        ],
        skills: ['Odometry Pose Tracking', 'Differential Kinematics', 'Encoder Math', 'Feedback Loops'],
        practicalLab: 'LAB 2C: Calibrate an optical encoder wheel. Program interrupt service routines (ISRs) on the micro-controller pins to count encoder feedback pulses. Develop an odometry calculations script that updates the estimated coordinate positions (X, Y, θ) of your robot chassis in real-time.'
      },
      {
        week: 'Week 3',
        title: 'Wireless Bluetooth Serial & Distance Sensor Clusters',
        description: 'Enables mobile remote controls and high-speed obstacle detection. Students harness software-serial libraries, write data packet parsers, and integrate ultrasound distance transmitters to compute exact clearance gaps in milliseconds.',
        topics: [
          'Initializing SoftwareSerial on microcontrollers for wireless telemetry',
          'Parsing Bluetooth string payloads to translate keyboard triggers to steering actions',
          'Working with ultrasonic proximity sensors: Timing echo pulses for exact mm measurements',
          'Configuring infrared line tracker arrays: Resolving high speed path crawls'
        ],
        skills: ['Proximity Calibrations', 'Bluetooth Serial stream', 'ADC Sensors', 'Line Path Algorithms'],
        practicalLab: 'LAB 3C: Mount an HC-U04 ultrasonic sensor onto a servo motor at the front of your chassis. Code a non-blocking loop that sweeps the servo 180 degrees, measures sensor clearance, and transmits a real-time Bluetooth string map to a mobile device displaying potential collision coordinates.'
      },
      {
        week: 'Week 4',
        title: 'Autonomous Obstacle Interceptor Project Construction',
        description: 'The final, comprehensive algorithmic automation workshop. Students assemble all mechanical drivetrains, sensory arrays, and steering loops to form a smart vehicle capable of resolving complex obstacles independently.',
        topics: [
          'Assembling physical chassis platforms, mounting motor sets, batteries, and controllers',
          'Establishing nested conditional statements mapping obstacle bypass routines',
          'Calibrating differential speeds with real-time feedback thresholds',
          'Presenting and exporting telemetry tracks for final trainer validation'
        ],
        skills: ['Autonomous Routing', 'System Integrations', 'Physical Assembly', 'Odometry calibration'],
        practicalLab: 'LAB 4C: Complete the assembly of your motorized vehicle. Code a full autonomous state machine: the bot drives forward, checks proximity logs, slows down when within 25cm of obstacles, stops at 10cm, sweeps its ultrasonic sensor left/right, and routes toward the clearest direction path.'
      }
    ]
  },
  'course-4': {
    courseId: 'course-4',
    targetAudience: 'Junior School Kids (Grades 6th to 10th) & Coding Beginners',
    prerequisites: 'Basic capability to use a physical laptop operating keyboard/mouse',
    detailedOverview: 'Introduce young young minds to real computational logic, computer file hierarchies, and beautiful styling patterns! This beginner-friendly track bridges fun visual block configurations directly to actual Python variables and core HTML layout pages. Shipped with on-site custom training computers, so kids build confidence writing real-world software.',
    weeks: [
      {
        week: 'Day 1',
        title: 'Core Computers & System Admin Navigation',
        description: 'Demystifies computer components and teaches operating system folders. Students discover how processors work, master file explorer paths, and memorize handy keyboard combinations that speed up software operations.',
        topics: [
          'Exploring physical and digital computer boxes: CPU, RAM, Display, and Hard Drives',
          'Operating System basics: Managing files, directories, folders, and browser safe actions',
          'Useful keyboard shortcuts to speed up basic copy, paste, and navigation tasks',
          'Working with essential productivity apps (Spreadsheets, text blocks, slide guides)'
        ],
        skills: ['Operating Systems', 'File Trees Navigator', 'Computer Components', 'Basic Software'],
        practicalLab: 'LAB 1D: Inspect and identify key computer components (RAM, storage card, processor). Practice system admin folders creation: build a hierarchy of folders representing a school roster, find file extensions, and execute quick shortcut combos (Ctrl+C, Ctrl+V, Alt+Tab) to navigate applications.'
      },
      {
        week: 'Day 2',
        title: 'Translating drag-&-drop Scratch Loops to Code Variables',
        description: 'Transforms block-building skills into structured code. Kids translate colorful Scratch loop blocks and logic paths into standard, readable Python statements, building strong analytical habits.',
        topics: [
          'Introduction to programming blocks: Actions, statements, and loop repetitions',
          'Setting local block variables, doing basic additions, and changing tracking indices',
          'Handling event-driven actions: "When Clicked" triggers and broadcasting signals',
          'Re-writing block models into real text variable assignments using simple Python'
        ],
        skills: ['Scratch Blocks', 'Logical Loops', 'Conditional branching', 'Variables Translation'],
        practicalLab: 'LAB 2D: Create an animated interactive game in Scratch containing score variables and conditional speed increases. Then, write equivalent Python variables and simple "if-else" command strings in a code editor to reproduce the score tracking logic.'
      },
      {
        week: 'Days 3-5',
        title: 'Anatomy of basic Website code: HTML tags & nested styling',
        description: 'Guides kids through programming their first customizable website. We look at HTML layout nests, apply colors and borders, use button tags, and boot pages locally in a standard web browser.',
        topics: [
          'Anatomy of tag declarations: Opening, contents, and closing tag rules',
          'Creating layout sections with divs, headers, body sections, and paragraph scripts',
          'Styling borders, text colors, margins, and curved buttons using HTML styles',
          'Opening local HTML pages inside web browsers and adding custom image sources'
        ],
        skills: ['HTML Tag maps', 'Basic Styles', 'Website structures', 'Browser inspection'],
        practicalLab: 'LAB 3D: Build a personal profile website "About Me" using raw HTML tags (<header>, <p>, <div>, <img>). Apply creative background colors, round-corner borders, and custom padding. Save your project file locally as "index.html" and run it inside Google Chrome to demonstrate.'
      }
    ]
  }
};

export default function SyllabusExplorer({ courses, applications }: SyllabusExplorerProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);

  // Find approval status for current course selection
  const currentApp = applications.find(
    app => app.courseId === selectedCourseId && app.email.trim().toLowerCase()
  );
  
  const isEnrolled = currentApp?.status === 'approved';
  const isPending = currentApp?.status === 'pending';
  
  const currentSyllabus = SYLLABUS_DATABASE[selectedCourseId];
  const activeCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Selector and enrollment status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#050505]/50 border border-cyan-500/10 p-5 rounded-2xl text-left">
        
        {/* Course Select */}
        <div className="md:col-span-2.5 space-y-2">
          <label className="block text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Select Course Syllabus</label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setExpandedWeek(0); // Reset first unit open
            }}
            className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-400 font-sans tracking-wide text-slate-200 cursor-pointer"
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.duration})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
            Dakshyam physical-digital training courses strictly follow the National Education Policy (NEP) guidelines for manual/hands-on skill enablement.
          </p>
        </div>

        {/* Enrollment Status Indicator Badge */}
        <div className="md:col-span-1.5 flex flex-col justify-center bg-black/40 border border-cyan-500/5 p-4 rounded-xl">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Your Enrollment Status</span>
          
          {isEnrolled ? (
            <div className="space-y-1">
              <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg text-emerald-400 font-bold uppercase inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Enrolled & Approved
              </span>
              <p className="text-[9px] text-slate-400 leading-normal">
                You are registered in this syllabus. Completed metrics will lock upon supervisor review.
              </p>
            </div>
          ) : isPending ? (
            <div className="space-y-1">
              <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg text-amber-400 font-bold uppercase inline-flex items-center gap-1.5 animate-pulse">
                Verification Pending
              </span>
              <p className="text-[9px] text-slate-400 leading-normal">
                Your application is currently pending board review. You can inspect the syllabus chapters below.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] font-mono bg-slate-500/10 border border-slate-500/25 px-2.5 py-1 rounded-lg text-slate-400 font-bold uppercase inline-flex items-center gap-1">
                Not Enrolled
              </span>
              <p className="text-[9px] text-slate-400 leading-normal">
                Want to join this curriculum? Head to the main portal and submit an integration request.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Main Syllabus breakdown */}
      {currentSyllabus && activeCourse ? (
        <div className="space-y-6 select-text text-left">
          
          {/* Top Panel: Expansive Row Overview */}
          <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-5 border-b border-cyan-500/10">
              <div className="space-y-2 max-w-3xl">
                <h4 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-extrabold">NEP 2020 Aligned Syllabus Overview</h4>
                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wide leading-tight">{activeCourse.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{currentSyllabus.detailedOverview}</p>
                <div className="flex gap-1.5 pt-1.5 flex-wrap">
                  {activeCourse.tags.map((tag, idx) => (
                    <span key={idx} className="bg-cyan-950/40 border border-cyan-500/15 text-cyan-400 text-[9.5px] px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scope badge */}
              <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl px-4 py-3.5 flex flex-col items-center justify-center min-w-[130px] shrink-0 text-center font-mono self-stretch md:self-auto">
                <Calendar className="w-5 h-5 text-cyan-400 mb-1 animate-pulse" />
                <span className="text-[9px] text-slate-400 uppercase font-black">Syllabus Span</span>
                <span className="text-xs font-black text-[#22d3ee] uppercase mt-0.5">{activeCourse.duration}</span>
              </div>
            </div>

            {/* Sub-Bento details grids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed font-sans mt-3">
              <div className="space-y-2 p-4 bg-black/40 border border-cyan-500/5 rounded-xl">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Target Audience</span>
                <div className="flex items-start gap-2.5 text-slate-300">
                  <GraduationCap className="w-4.5 h-4.5 text-cyan-400 mt-0.5 shrink-0" />
                  <span>{currentSyllabus.targetAudience}</span>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-black/40 border border-cyan-500/5 rounded-xl">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Prerequisites</span>
                <div className="flex items-start gap-2.5 text-slate-300">
                  <Bookmark className="w-4.5 h-4.5 text-cyan-400 mt-0.5 shrink-0" />
                  <span>{currentSyllabus.prerequisites}</span>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl text-slate-400 font-mono text-3xs">
                <span className="text-cyan-400 font-extrabold uppercase block text-[10px] tracking-wider mb-1">Vocational Compliance Node</span>
                <p>This specialized course is engineered to provide physical-digital manual skills, in full alignment with the vocational enrichment guidelines of national curriculums.</p>
              </div>
            </div>
          </div>

          {/* Chapters and Units: Now taking up 100% full-width of the dashboard layout! */}
          <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-6 space-y-4 w-full">
            <h4 className="text-xs font-black text-[#22d3ee] font-mono tracking-wider uppercase border-b border-cyan-500/10 pb-3 flex items-center justify-between">
              <span>Course Chapters & Structural Units ({currentSyllabus.weeks.length})</span>
              <span className="text-3xs text-cyan-500 uppercase tracking-widest font-mono">Expansive Mode</span>
            </h4>

            <div className="space-y-4">
              {currentSyllabus.weeks.map((u, idx) => {
                const isOpen = expandedWeek === idx;
                
                return (
                  <div 
                    key={idx}
                    className={`border rounded-xl transition-all duration-250 overflow-hidden ${
                      isOpen 
                        ? 'bg-black/60 border-cyan-500/30 shadow-2xl shadow-cyan-950/20' 
                        : 'bg-black/25 border-cyan-500/5 hover:border-cyan-500/20 hover:bg-black/40'
                    }`}
                  >
                    {/* Header trigger */}
                    <button
                      type="button"
                      onClick={() => setExpandedWeek(isOpen ? null : idx)}
                      className="w-full px-5 py-4.5 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="space-y-1.5 pr-4">
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/15 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          {u.week}
                        </span>
                        <h5 className="text-xs md:text-sm font-black text-white tracking-wide uppercase mt-1 leading-snug">
                          {u.title}
                        </h5>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
 
                    {/* Content Accordion */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.22, ease: 'linear' }
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-3.5 border-t border-cyan-500/10 space-y-5 text-xs bg-cyan-950/5">
                            
                            {/* Unit Overview */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Chapter Overview:</span>
                              <p className="text-slate-300 leading-relaxed font-sans">{u.description}</p>
                            </div>

                            {/* Major topics & Practical skill blocks */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-cyan-500/5 pt-4">
                              <div className="space-y-2">
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Core Study Topics:</span>
                                <ul className="space-y-2">
                                  {u.topics.map((tp, tIdx) => (
                                    <li key={tIdx} className="flex items-start gap-2.5 text-slate-300 leading-relaxed font-sans">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                                      <span>{tp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-2">
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Vocational Skills Acquired:</span>
                                <div className="flex flex-wrap gap-2">
                                  {u.skills.map((sk, sIdx) => (
                                    <span key={sIdx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-1 rounded-lg font-mono font-bold uppercase tracking-wide">
                                      ✓ {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Hardware lab detail */}
                            <div className="p-4 bg-black/55 border border-cyan-500/15 rounded-xl space-y-1.5 text-left">
                              <div className="flex items-center gap-2 text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider">
                                <GraduationCap className="w-4 h-4 text-[#22d3ee]" />
                                <span>Hands-On Laboratory Practicum Goals</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-sans italic p-0.5">
                                {u.practicalLab}
                              </p>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-[#050505]/75 border border-dashed border-cyan-500/10 rounded-2xl py-12 text-center text-xs text-slate-500 italic font-mono">
          Could not fetch custom syllabus parameters for selected course code.
        </div>
      )}

    </div>
  );
}
