import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CredentialRequest, CredentialResponse } from './types';
import { CredentialStorage } from './storage';
import axios from 'axios';

const VERIFICATION_URL = process.env.VERIFICATION_BASE_URL || 'http://localhost:3002';  

const PORT = Number(process.env.PORT) || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const storage = new CredentialStorage();

app.get('/health', (_req: Request, res: Response): Response => {
  return res.json({
    status: 'ok',
    service: 'kube-credential-issuance',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ISSUE
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

    (async () => {
    try {
      await axios.post(`${VERIFICATION_URL}/sync`, { credentials: [credential] });
    } catch (e: any) {
     console.warn('Sync to verification failed (non-blocking):', e?.message || e);
    }
    })();

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

// GET BY ID
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

// GET ALL
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

// ...rest of your file (signals, startServer, etc.) stays the same

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
