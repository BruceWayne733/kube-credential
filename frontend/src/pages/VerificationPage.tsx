import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab
} from '@mui/material';
import { Search as SearchIcon, CheckCircle as ValidIcon, Cancel as InvalidIcon } from '@mui/icons-material';

import { credentialService } from '../services/api';
import { CredentialVerificationRequest, FormData, ValidationErrors } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const VerificationPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Form data for ID-based verification
  const [idFormData, setIdFormData] = useState<FormData>({
    credentialId: ''
  });

  // Form data for data-based verification
  const [dataFormData, setDataFormData] = useState<FormData>({
    userId: '',
    role: 'user',
    permissions: '',
    expiryDate: '',
    department: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setResponse(null);
    setErrors({});
  };

  const handleIdInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setIdFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDataInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDataFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateIdForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!idFormData.credentialId?.trim()) {
      newErrors.credentialId = 'Credential ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDataForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!dataFormData.userId?.trim()) {
      newErrors.userId = 'User ID is required';
    }

    if (!dataFormData.department?.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIdVerification = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateIdForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const request: CredentialVerificationRequest = {
        id: idFormData.credentialId
      };

      const result = await credentialService.verifyCredential(request);

      if (result.success) {
        setResponse(result);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDataVerification = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateDataForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const credentialData = {
        userId: dataFormData.userId,
        role: dataFormData.role,
        permissions: dataFormData.permissions ? dataFormData.permissions.split(',').map(p => p.trim()) : [],
        expiryDate: dataFormData.expiryDate || null,
        department: dataFormData.department
      };

      const request: CredentialVerificationRequest = {
        data: credentialData
      };

      const result = await credentialService.verifyCredential(request);

      if (result.success) {
        setResponse(result);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addSampleData = () => {
    if (tabValue === 0) {
      setIdFormData({
        credentialId: 'cred_123456789_sample'
      });
    } else {
      setDataFormData({
        userId: 'sample_user',
        role: 'admin',
        permissions: 'read,write',
        expiryDate: '2024-12-31',
        department: 'Engineering'
      });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Credential Verification
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Verify credentials by providing either the credential ID or the credential data.
      </Typography>

      <Paper elevation={2} sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="verification method tabs">
            <Tab label="Verify by ID" />
            <Tab label="Verify by Data" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box component="form" onSubmit={handleIdVerification}>
                <TextField
                  fullWidth
                  label="Credential ID"
                  value={idFormData.credentialId}
                  onChange={handleIdInputChange('credentialId')}
                  error={!!errors.credentialId}
                  helperText={errors.credentialId || 'Enter the credential ID to verify'}
                  required
                  variant="outlined"
                  sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<SearchIcon />}
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? 'Verifying...' : 'Verify Credential'}
                  </Button>

                  <Button
                    type="button"
                    variant="outlined"
                    onClick={addSampleData}
                  >
                    Add Sample ID
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box component="form" onSubmit={handleDataVerification}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="User ID"
                      value={dataFormData.userId}
                      onChange={handleDataInputChange('userId')}
                      error={!!errors.userId}
                      helperText={errors.userId}
                      required
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={dataFormData.department}
                      onChange={handleDataInputChange('department')}
                      error={!!errors.department}
                      helperText={errors.department}
                      required
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Role"
                      value={dataFormData.role}
                      onChange={handleDataInputChange('role')}
                      variant="outlined"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="guest">Guest</option>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Permissions"
                      value={dataFormData.permissions}
                      onChange={handleDataInputChange('permissions')}
                      placeholder="read, write, delete"
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      type="date"
                      value={dataFormData.expiryDate}
                      onChange={handleDataInputChange('expiryDate')}
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<SearchIcon />}
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? 'Verifying...' : 'Verify Credential'}
                  </Button>

                  <Button
                    type="button"
                    variant="outlined"
                    onClick={addSampleData}
                  >
                    Add Sample Data
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          {error && (
            <Alert severity="error" icon={<InvalidIcon />} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {response && (
            <Alert
              severity={response.isValid ? "success" : "warning"}
              icon={response.isValid ? <ValidIcon /> : <InvalidIcon />}
              sx={{ mb: 2 }}
            >
              {response.message}
            </Alert>
          )}

          {response?.credential && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Credential Details:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">
                    <strong>ID:</strong> {response.credential.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {response.credential.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Issued By:</strong> {response.credential.issuedBy}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Issued At:</strong> {new Date(response.credential.issuedAt).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default VerificationPage;
