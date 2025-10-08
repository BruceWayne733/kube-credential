import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CredentialVerificationRequest, CredentialVerificationResponse, CredentialData } from './types';
import { VerificationStorage } from './storage';

const PORT = Number(process.env.PORT) || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

app.use(helmet());


// Allow any *.vercel.app (preview + prod)
// If you prefer to lock it down, remove this and list exact domains in FRONTEND_ORIGINS.
// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet());

// Comma-separated list of explicit origins
const ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('[CORS] Allowed origins:', ORIGINS);

// Allow any *.vercel.app domain
const vercelRegex = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/;

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) {
      console.log('[CORS] Allowed: No origin header');
      return cb(null, true);
    }

    // Check explicit origins
    if (ORIGINS.includes(origin)) {
      console.log('[CORS] Allowed: Explicit origin', origin);
      return cb(null, true);
    }

    // Check Vercel domains
    if (vercelRegex.test(origin)) {
      console.log('[CORS] Allowed: Vercel domain', origin);
      return cb(null, true);
    }

    // Block everything else
    console.error('[CORS] BLOCKED:', origin);
    return cb(new Error(`CORS blocked: ${origin}`), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const storage = new VerificationStorage();

app.get('/health', (_req, res) => {
  return res.json({
    status: 'ok',
    service: 'kube-credential-verification',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// VERIFY
app.post('/verify', async (req, res) => {
  try {
    const verificationRequest: CredentialVerificationRequest = req.body;

    if (!verificationRequest || (!verificationRequest.id && !verificationRequest.data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: either credential ID or data is required',
        isValid: false
      } as CredentialVerificationResponse);
    }

    let result: { isValid: boolean; credential?: { id: string; issuedAt: string; issuedBy: string; status: string } };

    if (verificationRequest.id) {
      result = await storage.verifyCredentialById(verificationRequest.id);
    } else if (verificationRequest.data) {
      const payload: Record<string, any> = verificationRequest.data as unknown as Record<string, any>;
      result = await storage.verifyCredentialByData(payload);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: missing data',
        isValid: false
      } as CredentialVerificationResponse);
    }

    if (result.isValid && result.credential) {
      const response: CredentialVerificationResponse = {
        success: true,
        message: `Credential is valid. Issued by ${result.credential.issuedBy} on ${new Date(result.credential.issuedAt).toLocaleString()}`,
        credential: {
          id: result.credential.id,
          issuedAt: result.credential.issuedAt,
          issuedBy: result.credential.issuedBy,
          status: result.credential.status
        },
        isValid: true
      };
      return res.json(response);
    }

    const response: CredentialVerificationResponse = {
      success: true,
      message: 'Credential is not valid or does not exist',
      isValid: false
    };
    return res.json(response);
  } catch (error) {
    console.error('Error verifying credential:', error);
    const response: CredentialVerificationResponse = {
      success: false,
      message: 'Internal server error occurred while verifying credential',
      isValid: false
    };
    return res.status(500).json(response);
  }
});

// SYNC
app.post('/sync', async (req, res) => {
  try {
    const { credentials } = req.body;

    if (!Array.isArray(credentials)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: credentials array is required'
      });
    }

    await storage.syncCredentials(credentials);
    return res.json({
      success: true,
      message: `Synced ${credentials.length} credentials`
    });
  } catch (error) {
    console.error('Error syncing credentials:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while syncing credentials'
    });
  }
});

app.get('/credentials', async (_req, res) => {
  try {
    const credentials = await storage.getAllCredentials();
    return res.json({
      success: true,
      credentials,
      count: credentials.length
    });
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

async function startServer() {
  try {
    await storage.initialize();
    console.log('Verification storage initialized');
    app.listen(PORT, () => {
      console.log(`🚀 Kube Credential Verification Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
