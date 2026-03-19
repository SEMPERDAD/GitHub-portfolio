import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_employee')); } catch { return null; }
  });

  const login = useCallback(async (email, pin) => {
    const { token, employee: emp } = await api.post('/auth/login', { email, pin });
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_employee', JSON.stringify(emp));
    setEmployee(emp);
    return emp;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_employee');
    setEmployee(null);
  }, []);

  const hasPermission = useCallback((perm) => {
    if (!employee) return false;
    if (employee.role === 'admin') return true;
    const perms = employee.permissions || [];
    return perms.includes('all') || perms.includes(perm);
  }, [employee]);

  return (
    <AuthContext.Provider value={{ employee, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
