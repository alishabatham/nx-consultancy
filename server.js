import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import nodemailer from 'nodemailer';

// Fix for Windows Node.js DNS SRV query lookup issues with MongoDB Atlas
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('DNS server override notice:', dnsErr.message);
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files if needed
app.use(express.static(path.join(__dirname,'dist')));

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://alishabatham2_db_user:urq6lBf4WlNfk1Um@cluster0.upabs4c.mongodb.net/consultancy_db?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(' Successfully connected to MongoDB Atlas Cluster0');
    console.log(' Target Collection: consultancy');
  })
  .catch((err) => {
    console.error(' MongoDB connection error:', err.message);
  });

// Schema definition targeting exact collection 'consultancy'
const consultationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Work Email is required'],
    trim: true,
    lowercase: true
  },
  businessType: {
    type: String,
    required: [true, 'Business Type is required']
  },
  serviceNeeded: {
    type: String,
    required: [true, 'Service Needed is required']
  },
  challengeDescription: {
    type: String,
    required: [true, 'Challenge Description is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  collection: 'consultancy' // Explicitly set collection name as 'consultancy'
});

const Consultation = mongoose.model('Consultation', consultationSchema);

// Nodemailer Transporter Helper
const getTransporter = () => {
  const senderEmail = process.env.SENDER_EMAIL || 'alishabatham2@gmail.com';
  const rawPass = process.env.SENDER_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '');
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: cleanPass
    }
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const rawPass = process.env.SENDER_PASS || '';
  res.json({
    status: 'ok',
    database: states[dbState] || 'unknown',
    targetCollection: 'consultancy',
    senderEmail: process.env.SENDER_EMAIL || 'alishabatham2@gmail.com',
    receiverEmail: process.env.RECEIVER_EMAIL || 'hr@nexisparkx.com',
    nodemailerConfigured: Boolean(rawPass && rawPass !== 'your_gmail_app_password_here')
  });
});

// POST /api/consultations — Save new form submission to 'consultancy' collection & Send Email via Nodemailer (with Web3Forms fallback)
app.post('/api/consultations', async (req, res) => {
  try {
    const { fullName, email, businessType, serviceNeeded, challengeDescription } = req.body;

    if (!fullName || !email || !businessType || !serviceNeeded || !challengeDescription) {
      return res.status(400).json({
        success: false,
        message: 'All fields (fullName, email, businessType, serviceNeeded, challengeDescription) are required.'
      });
    }

    // 1. Save document to MongoDB collection 'consultancy'
    const newConsultation = new Consultation({
      fullName,
      email,
      businessType,
      serviceNeeded,
      challengeDescription
    });

    const savedDoc = await newConsultation.save();
    console.log(` New response saved to 'consultancy' collection ID: ${savedDoc._id}`);

    // 2. Send email via Nodemailer to hr@nexisparkx.com (with Web3Forms fallback)
    let emailSent = false;
    let emailStatusMessage = '';

    const senderEmail = process.env.SENDER_EMAIL || 'alishabatham2@gmail.com';
    const receiverEmail = process.env.RECEIVER_EMAIL || 'hr@nexisparkx.com';
    const rawPass = process.env.SENDER_PASS || '';

    // Primary: Nodemailer Attempt
    try {
      const transporter = getTransporter();
      const mailOptions = {
        from: `"NX Consultancy Website" <${senderEmail}>`,
        to: receiverEmail,
        replyTo: email,
        subject: ` New Strategy Consultation Request: ${fullName}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
            <h2 style="color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 10px; margin-top: 0;">New Consultation Request Received</h2>
            <p style="font-size: 15px; color: #cbd5e1;">A new strategy consultation form response was submitted and saved to the <strong>consultancy</strong> database collection.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; color: #f8fafc;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #334155; font-weight: bold; color: #94a3b8; width: 140px;">Full Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #334155; font-weight: 600;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #334155; font-weight: bold; color: #94a3b8;">Work Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #334155;"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #334155; font-weight: bold; color: #94a3b8;">Business Type:</td>
                <td style="padding: 10px; border-bottom: 1px solid #334155;">${businessType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #334155; font-weight: bold; color: #94a3b8;">Service Needed:</td>
                <td style="padding: 10px; border-bottom: 1px solid #334155;">${serviceNeeded}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #334155; font-weight: bold; color: #94a3b8; vertical-align: top;">Challenge / Goal:</td>
                <td style="padding: 10px; border-bottom: 1px solid #334155; line-height: 1.5;">${challengeDescription.replace(/\n/g, '<br>')}</td>
              </tr>
            </table>

            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center;">
              Sent automatically via NX Consultancy Server &bull; Destination: ${receiverEmail}
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      emailStatusMessage = `Email successfully dispatched to ${receiverEmail} via Nodemailer.`;
      console.log(` Nodemailer email sent from ${senderEmail} to ${receiverEmail}`);

    } catch (mailErr) {
      console.warn(` Nodemailer notice (${mailErr.message}). Initiating Web3Forms email fallback...`);

      // Fallback: Web3Forms Email API to guarantee delivery to hr@nexisparkx.com
      try {
        const web3Res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            access_key: "099a4c58-47fb-44ef-bcae-94186c3d1fb5",
            name: fullName,
            email: email,
            subject: `New Strategy Consultation Request from ${fullName}`,
            message: `Full Name: ${fullName}\nWork Email: ${email}\nBusiness Stage: ${businessType}\nService Needed: ${serviceNeeded}\n\nChallenge / Goal:\n${challengeDescription}`,
            to_email: receiverEmail
          })
        });
        const web3Data = await web3Res.json();
        if (web3Data.success) {
          emailSent = true;
          emailStatusMessage = `Email successfully delivered to ${receiverEmail}.`;
          console.log(` Email successfully delivered to ${receiverEmail}`);
        } else {
          console.warn(' Web3Forms notice:', web3Data.message);
        }
      } catch (web3Err) {
        console.error(' Web3Forms fallback error:', web3Err.message);
        emailStatusMessage = `Form saved to MongoDB. Email fallback error: ${web3Err.message}`;
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Consultation request successfully saved to consultancy collection!',
      emailSent,
      emailStatus: emailStatusMessage,
      data: savedDoc
    });

  } catch (error) {
    console.error(' Error saving response to MongoDB:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to save response to database.',
      error: error.message
    });
  }
});

// GET /api/consultations — Retrieve all submitted responses
app.get('/api/consultations', async (req, res) => {
  try {
    const responses = await Consultation.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: responses.length,
      data: responses
    });
  } catch (error) {
    console.error(' Error fetching responses:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch responses.',
      error: error.message
    });
  }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,'dist', "index.html"));
});

// Start express server
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/consultations`);
});

export default app;
