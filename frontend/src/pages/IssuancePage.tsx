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
  Divider
} from '@mui/material';
import { Add as AddIcon, CheckCircle as SuccessIcon, Error as ErrorIcon } from '@mui/icons-material';

import { credentialService } from '../services/api';
import { CredentialIssuanceRequest, FormData, ValidationErrors } from '../types';

const IssuancePage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    role: 'user',
    permissions: '',
    expiryDate: '',
    department: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.userId?.trim()) {
      newErrors.userId = 'User ID is required';
    }

    if (!formData.role?.trim()) {
      newErrors.role = 'Role is required';
    }

    if (!formData.department?.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setResponse(null);

    try {
      // Prepare credential data
      const credentialData: CredentialIssuanceRequest = {
        data: {
          userId: formData.userId,
          role: formData.role,
          permissions: formData.permissions ? formData.permissions.split(',').map(p => p.trim()) : [],
          expiryDate: formData.expiryDate || null,
          department: formData.department,
          issuedAt: new Date().toISOString()
        }
      };

      const result = await credentialService.issueCredential(credentialData);

      if (result.success) {
        setSuccess(result.message);
        setResponse(result);

        // Clear form on success
        setFormData({
          userId: '',
          role: 'user',
          permissions: '',
          expiryDate: '',
          department: ''
        });
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
    setFormData({
      userId: `user_${Date.now()}`,
      role: 'admin',
      permissions: 'read,write,delete',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      department: 'Engineering'
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Credential Issuance
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Create new credentials for users. Each credential is processed by a worker pod and stored securely.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="User ID"
                    value={formData.userId}
                    onChange={handleInputChange('userId')}
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
                    value={formData.department}
                    onChange={handleInputChange('department')}
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
                    value={formData.role}
                    onChange={handleInputChange('role')}
                    error={!!errors.role}
                    helperText={errors.role}
                    required
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
                    label="Expiry Date (Optional)"
                    type="date"
                    value={formData.expiryDate}
                    onChange={handleInputChange('expiryDate')}
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Permissions (comma-separated)"
                    value={formData.permissions}
                    onChange={handleInputChange('permissions')}
                    placeholder="read, write, delete, admin"
                    variant="outlined"
                    helperText="Optional: Specify permissions separated by commas"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? null : <AddIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? 'Issuing...' : 'Issue Credential'}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  onClick={addSampleData}
                  size="large"
                >
                  Add Sample Data
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {error && (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              {response?.credential && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
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

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Credential Data:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {Object.entries(response.credential.data).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={`${key}: ${Array.isArray(value) ? value.join(', ') : value}`}
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IssuancePage;
