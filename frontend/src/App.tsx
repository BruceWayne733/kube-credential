import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Alert
} from '@mui/material';
import { Assignment, VerifiedUser } from '@mui/icons-material';

import IssuancePage from './pages/IssuancePage';
import VerificationPage from './pages/VerificationPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
          <AppBar position="static" elevation={2}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                🔐 Kube Credential System
              </Typography>
              <Button
                color="inherit"
                component={Link}
                to="/"
                startIcon={<Assignment />}
                sx={{ mr: 2 }}
              >
                Issuance
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/verification"
                startIcon={<VerifiedUser />}
              >
                Verification
              </Button>
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This is a microservice-based credential issuance and verification system.
                Use the Issuance page to create new credentials and the Verification page to validate them.
              </Typography>
            </Alert>

            <Routes>
              <Route path="/" element={<IssuancePage />} />
              <Route path="/issuance" element={<IssuancePage />} />
              <Route path="/verification" element={<VerificationPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
