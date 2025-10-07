import axios from 'axios';
import {
  CredentialIssuanceRequest,
  CredentialIssuanceResponse,
  CredentialVerificationRequest,
  CredentialVerificationResponse
} from '../types';

const resolveBaseUrl = (fallback: string) => {
  if (process.env.REACT_APP_ENV === 'test') return fallback;
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}${fallback}`;
  }
  return fallback;
};

const ISSUANCE_API_URL = process.env.REACT_APP_ISSUANCE_API_URL || resolveBaseUrl('/api/issuance');
const VERIFICATION_API_URL = process.env.REACT_APP_VERIFICATION_API_URL || resolveBaseUrl('/api/verification');

// Create axios instances for each service
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

// Request interceptor for logging
issuanceClient.interceptors.request.use(
  (config) => {
    console.log(`Issuance API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Issuance API Request Error:', error);
    return Promise.reject(error);
  }
);

verificationClient.interceptors.request.use(
  (config) => {
    console.log(`Verification API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Verification API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
const handleApiError = (error: any, serviceName: string) => {
  console.error(`${serviceName} API Error:`, error);

  if (error.response) {
    // Server responded with error status
    throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
  } else if (error.request) {
    // Network error
    throw new Error(`${serviceName} service is unavailable. Please check if the service is running.`);
  } else {
    // Other error
    throw new Error(error.message || `Unknown error occurred with ${serviceName} service`);
  }
};

export const credentialService = {
  // Issue a new credential
  issueCredential: async (request: CredentialIssuanceRequest): Promise<CredentialIssuanceResponse> => {
    try {
      const response = await issuanceClient.post<CredentialIssuanceResponse>('/issue', request);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Issuance');
      throw error;
    }
  },

  // Verify a credential
  verifyCredential: async (request: CredentialVerificationRequest): Promise<CredentialVerificationResponse> => {
    try {
      const response = await verificationClient.post<CredentialVerificationResponse>('/verify', request);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Verification');
      throw error;
    }
  },

  // Get credential by ID (for debugging)
  getCredential: async (id: string) => {
    try {
      const response = await issuanceClient.get(`/credential/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Issuance');
    }
  },

  // Get all credentials (for debugging)
  getAllCredentials: async () => {
    try {
      const response = await issuanceClient.get('/credentials');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Issuance');
    }
  },

  // Health check for services
  checkIssuanceHealth: async () => {
    try {
      const response = await issuanceClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Issuance service is not healthy');
    }
  },

  checkVerificationHealth: async () => {
    try {
      const response = await verificationClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Verification service is not healthy');
    }
  }
};
