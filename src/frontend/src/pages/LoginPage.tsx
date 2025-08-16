import React from 'react';
import { Box, Container, useTheme } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoginForm />
      </Box>
    </Container>
  );
};

export default LoginPage;