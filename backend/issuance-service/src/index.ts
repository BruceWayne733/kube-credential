import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CredentialRequest, CredentialResponse } from './types';
import { CredentialStorage } from './storage';

// ============================================================
// CONFIGURATION
// ============================================================
const VERIFICATION_BASE_URL = (process.env.VERIFICATION_BASE_URL || '').trim() || 'http://verification-service:3002';
console.log('[STARTUP] VERIFICATION_BASE_URL effective:', VERIFICATION_BASE_URL);

const PORT = Number(process.env.PORT) || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

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

const storage = new CredentialStorage();

// ============================================================
// HELPER: Auto-sync credential to verification service
// ============================================================
async function syncToVerification(credential: any): Promise<void> {
  const url = `${VERIFICATION_BASE_URL}/sync`;
  try {
    console.log(`[AUTO-SYNC] Syncing credential ${credential.id} to ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentials: [credential] }),
    });
    
    const text = await response.text();
    console.log(`[AUTO-SYNC] -> ${url} status=${response.status} body=${text.substring(0, 200)}`);
    
    if (!response.ok) {
      console.error(`[AUTO-SYNC] Failed with status ${response.status}: ${text}`);
    }
  } catch (error: any) {
    console.error(`[AUTO-SYNC] Network error syncing to ${url}:`, error.message);
  }
}

// ============================================================
// ROUTES
// ============================================================

app.get('/health', (_req: Request, res: Response): Response => {
  return res.json({
    status: 'ok',
    service: 'kube-credential-issuance',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// POST /issue - Issue new credential and auto-sync
app.post('/issue', async (req: Request, res: Response): Promise<void> => {
  try {
    const credentialRequest: CredentialRequest = req.body;

    if (!credentialRequest || !credentialRequest.data) {
      res.status(400).json({
        success: false,
        message: 'Invalid request: credential data is required'
      } as CredentialResponse);
      return;
    }

    const existingCredentials = await storage.getAllCredentials();
    const credentialExists = existingCredentials.some(
      cred => JSON.stringify(cred.data) === JSON.stringify(credentialRequest.data)
    );

    if (credentialExists) {
      res.status(409).json({
        success: false,
        message: 'Credential with identical data has already been issued'
      } as CredentialResponse);
      return;
    }

    const workerId = storage.getNextWorkerId();
    const credential = await storage.issueCredential(credentialRequest.data, workerId);

    // *** AUTO-SYNC: Fire and forget - non-blocking ***
    syncToVerification(credential).catch(err => {
      console.error('[AUTO-SYNC] Unhandled promise rejection:', err);
    });

    const response: CredentialResponse = {
      success: true,
      message: `Credential issued by ${workerId}`,
      credential,
      workerId
    };

    res.status(201).json(response);
    return;
  } catch (error) {
    console.error('Error issuing credential:', error);
    const response: CredentialResponse = {
      success: false,
      message: 'Internal server error occurred while issuing credential'
    };
    res.status(500).json(response);
    return;
  }
});

// GET /credential/:id - Get credential by ID
app.get('/credential/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Missing credential ID'
      });
      return;
    }

    const credential = await storage.getCredential(id);
    if (!credential) {
      res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
      return;
    }

    res.json({
      success: true,
      credential
    });
    return;
  } catch (error) {
    console.error('Error retrieving credential:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

// GET /credentials - Get all credentials
app.get('/credentials', async (_req: Request, res: Response): Promise<void> => {
  try {
    const credentials = await storage.getAllCredentials();
    res.json({
      success: true,
      credentials,
      count: credentials.length
    });
    return;
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

// ============================================================
// SERVER STARTUP & SIGNAL HANDLING
// ============================================================

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
    console.log('Credential storage initialized');
    app.listen(PORT, () => {
      console.log(`🚀 Kube Credential Issuance Service running on port ${PORT}`);
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