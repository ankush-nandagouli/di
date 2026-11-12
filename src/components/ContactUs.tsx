import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react';
import { notifySuccess, notifyError } from '../utils/toast';
import { DakshyamDatabase } from '../utils/db';
import { NotificationService } from '../utils/notificationService';

interface ContactUsProps {
  theme: 'dark' | 'light';
}

export default function ContactUs({ theme }: ContactUsProps) {
  const isLight = theme === 'light';
  const aboutData = DakshyamDatabase.getCompanyAbout();
  const contactEmail = aboutData.contactEmail || 'support@dakshyaminnovations.in';
  const contactPhone = aboutData.contactPhone || '+91 7632 234567';
  const officeLocation = aboutData.officeLocation || 'Ward No. 4, Siddhivinayak Complex, First Floor, Balaghat Road, Waraseoni - 481331';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'School/College Robotics Workshop',
    message: ''
  });
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter your full name.');
      notifyError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      notifyError('Please enter a valid email address.');
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 5) {
      setFormError('Please write a message with at least 5 characters.');
      notifyError('Please write a message with at least 5 characters.');
      return;
    }

    setIsSending(true);

    try {
      // 1. Persist inquiry into database
      const createdInquiry = DakshyamDatabase.createContactInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject,
        message: formData.message.trim()
      });

      // 2. Dispatch high-priority real-time notification to Administrator
      await NotificationService.dispatchNotification({
        title: `New Contact Inquiry: ${formData.subject}`,
        message: `From ${formData.name.trim()} (${formData.email.trim()}): "${formData.message.trim().substring(0, 90)}${formData.message.trim().length > 90 ? '...' : ''}"`,
        targetRole: 'admin',
        category: 'contact',
        priority: 'high',
        linkTab: 'portal',
        actionData: {
          inquiryId: createdInquiry.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject
        }
      });

      setIsSending(false);
      setSubmitted(true);
      notifySuccess('Inquiry received! Our team will get back to you shortly.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'School/College Robotics Workshop',
        message: ''
      });
    } catch (err: any) {
      setIsSending(false);
      console.error('Contact form submission error:', err);
      notifyError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-10">
      {/* HEADER SECTION */}
      <div className={`text-center space-y-2 max-w-xl mx-auto border-b pb-4 ${isLight ? 'border-blue-900/10' : 'border-blue-800/30'}`}>
        <span className={`text-3xs font-mono tracking-widest uppercase font-black ${isLight ? 'text-blue-950' : 'text-sky-400'}`}>Get in touch</span>
        <h1 className={`text-2xl font-black tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>Contact Dakshyam Innovations</h1>
        <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Have questions about robotics workshops, STEM curriculum integration, electronics hardware kits, or course admissions? Reach out to our team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CONTACT CARDS COLUMN */}
        <div className="md:col-span-1 space-y-4">
          <h2 className={`text-2xs font-mono font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Contact Details</h2>
          
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-blue-50/40 border-blue-900/10 hover:border-blue-900/25' : 'bg-[#0a192f]/60 border-blue-800/30 hover:border-blue-500/40'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-900/10 text-blue-950' : 'bg-blue-950/60 text-sky-400'}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-3xs font-mono uppercase font-black tracking-wider ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>Registered Office</h3>
                <p className={`text-xs leading-relaxed font-sans ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {officeLocation}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-blue-50/40 border-blue-900/10 hover:border-blue-900/25' : 'bg-[#0a192f]/60 border-blue-800/30 hover:border-blue-500/40'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-900/10 text-blue-950' : 'bg-blue-950/60 text-sky-400'}`}>
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-3xs font-mono uppercase font-black tracking-wider ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>Email Support</h3>
                <a href={`mailto:${contactEmail}`} className={`text-xs font-semibold hover:underline block font-sans ${isLight ? 'text-slate-900' : 'text-sky-300'}`}>
                  {contactEmail}
                </a>
                <span className="text-4xs font-mono text-slate-500 block uppercase">Response within 24 hours</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-blue-50/40 border-blue-900/10 hover:border-blue-900/25' : 'bg-[#0a192f]/60 border-blue-800/30 hover:border-blue-500/40'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-900/10 text-blue-950' : 'bg-blue-950/60 text-sky-400'}`}>
                <Phone className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-3xs font-mono uppercase font-black tracking-wider ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>Phone Hotline</h3>
                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className={`text-xs font-semibold hover:underline block font-sans ${isLight ? 'text-slate-900' : 'text-sky-300'}`}>
                  {contactPhone}
                </a>
                <span className="text-4xs font-mono text-slate-500 block uppercase flex items-center gap-1">
                  10:00 AM - 6:00 PM IST
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE MESSAGE FORM */}
        <div className="md:col-span-2">
          <div className={`p-6 rounded-3xl border ${
            isLight ? 'bg-white border-blue-900/10 shadow-xs' : 'bg-[#0a192f]/70 border-blue-800/30 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className={`w-4 h-4 ${isLight ? 'text-blue-950' : 'text-sky-400'}`} />
              <h2 className={`text-xs font-mono font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Send Us a Message</h2>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className={`text-lg font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>Message Received!</h3>
                  <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Thank you for reaching out. Your inquiry has been sent to our administration team, and we will get back to you shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className={`mt-4 px-5 py-2.5 rounded-xl font-mono text-2xs font-bold transition-all cursor-pointer ${
                      isLight ? 'bg-blue-950 text-white hover:bg-blue-900' : 'bg-white text-[#0a192f] hover:bg-slate-100'
                    }`}
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className={isLight 
                          ? "w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-950 focus:bg-white transition-all" 
                          : "w-full bg-[#071326] border border-blue-900/40 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400 transition-all"
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. rahul@example.com"
                        className={isLight 
                          ? "w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-950 focus:bg-white transition-all" 
                          : "w-full bg-[#071326] border border-blue-900/40 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400 transition-all"
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 Phone number"
                        className={isLight 
                          ? "w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-950 focus:bg-white transition-all" 
                          : "w-full bg-[#071326] border border-blue-900/40 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400 transition-all"
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                        Subject
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={isLight 
                          ? "w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-950 focus:bg-white" 
                          : "w-full bg-[#071326] border border-blue-900/40 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                        }
                      >
                        <option value="School/College Robotics Workshop">School/College Robotics Workshop</option>
                        <option value="IoT & STEM Lab Setup">IoT & STEM Lab Setup</option>
                        <option value="Course Admission Query">Course Admission Query</option>
                        <option value="Hardware Kits Purchase">Custom Hardware Kits Request</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                      Your Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please enter your query or details about your requirements..."
                      className={isLight 
                        ? "w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-950 focus:bg-white transition-all" 
                        : "w-full bg-[#071326] border border-blue-900/40 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400 transition-all resize-none"
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-sm flex items-center justify-center gap-2 ${
                      isSending 
                        ? 'opacity-70 cursor-not-allowed'
                        : (isLight 
                            ? 'bg-blue-950 hover:bg-blue-900 text-white' 
                            : 'bg-white hover:bg-slate-100 text-[#0a192f] font-black')
                    }`}
                  >
                    {isSending ? (
                      <>Sending Message...</>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
