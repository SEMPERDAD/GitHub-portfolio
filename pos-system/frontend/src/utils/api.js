import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_employee');
      window.location.reload();
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;
