import axios from "axios";
import { APPLICATION_API_URL } from '../lib/api';

const api = axios.create({
  baseURL: APPLICATION_API_URL,
});

export default api;
