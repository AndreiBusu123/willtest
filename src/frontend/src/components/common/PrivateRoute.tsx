import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { RootState, AppDispatch } from '../../store';
import { fetchCurrentUser } from '../../store/slices/authSlice';

interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, isLoading, user } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (token && !user && !isLoading) {
      dispatch(fetchCurrentUser());
    }
  }, [token, user, isLoading, dispatch]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;