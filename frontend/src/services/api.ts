import axios from 'axios';
import {
  CredentialIssuanceRequest,
  CredentialIssuanceResponse,
  CredentialVerificationRequest,
  CredentialVerificationResponse
} from '../types';

// ============================================================
// CONFIGURATION - Simple and explicit
// ============================================================
const ISSUANCE_API_URL = process.env.REACT_APP_ISSUANCE_API_URL || 'http://localhost:3001';
const VERIFICATION_API_URL = process.env.REACT_APP_VERIFICATION_API_URL || 'http://localhost:3002';

console.log('[KubeCredential] Environment:', process.env.NODE_ENV);
console.log('[KubeCredential] REACT_APP_ISSUANCE_API_URL:', process.env.REACT_APP_ISSUANCE_API_URL);
console.log('[KubeCredential] REACT_APP_VERIFICATION_API_URL:', process.env.REACT_APP_VERIFICATION_API_URL);
console.log('[KubeCredential] Effective ISSUANCE_API_URL:', ISSUANCE_API_URL);
console.log('[KubeCredential] Effective VERIFICATION_API_URL:', VERIFICATION_API_URL);

// ============================================================
// AXIOS CLIENTS
// ============================================================
const issuanceClient = axios.create({
  baseURL: ISSUANCE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const verificationClient = axios.create({
  baseURL: VERIFICATION_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// REQUEST INTERCEPTORS
// ============================================================
issuanceClient.interceptors.request.use(
  (config) => {
    console.log(`[Issuance] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Issuance] Request Error:', error);
    return Promise.reject(error);
  }
);

verificationClient.interceptors.request.use(
  (config) => {
    console.log(`[Verification] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Verification] Request Error:', error);
    return Promise.reject(error);
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================
const handleApiError = (error: any, serviceName: string) => {
  console.error(`[${serviceName}] API Error:`, error);

  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || `Server error: ${error.response.status}`;
    console.error(`[${serviceName}] Response error:`, {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    });
    throw new Error(message);
  } else if (error.request) {
    // Network error - request made but no response
    console.error(`[${serviceName}] Network error:`, error.request);
    throw new Error(`${serviceName} service is unavailable. Please check if the service is running on ${error.config?.baseURL}`);
  } else {
    // Other error
    throw new Error(error.message || `Unknown error occurred with ${serviceName} service`);
  }
};

// ============================================================
// API SERVICE
// ============================================================
export const credentialService = {
  // Issue a new credential
  issueCredential: async (request: CredentialIssuanceRequest): Promise<CredentialIssuanceResponse> => {
    try {
      console.log('[issueCredential] Request:', request);
      const response = await issuanceClient.post<CredentialIssuanceResponse>('/issue', request);
      console.log('[issueCredential] Success:', response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Issuance');
      throw error;
    }
  },

  // Verify a credential
  verifyCredential: async (request: CredentialVerificationRequest): Promise<CredentialVerificationResponse> => {
    try {
      console.log('[verifyCredential] Request:', request);
      const response = await verificationClient.post<CredentialVerificationResponse>('/verify', request);
      console.log('[verifyCredential] Success:', response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Verification');
      throw error;
    }
  },

  // Get credential by ID
  getCredential: async (id: string) => {
    try {
      const response = await issuanceClient.get(`/credential/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Issuance');
      throw error;
    }
  },

  // Get all credentials
  getAllCredentials: async () => {
    try {
      const response = await issuanceClient.get('/credentials');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Issuance');
      throw error;
    }
  },

  // Health checks
  checkIssuanceHealth: async () => {
    try {
      const response = await issuanceClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Issuance service health check failed: ${error}`);
    }
  },

  checkVerificationHealth: async () => {
    try {
      const response = await verificationClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Verification service health check failed: ${error}`);
    }
  }
};