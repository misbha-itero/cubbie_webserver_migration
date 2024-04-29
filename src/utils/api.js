// Api
import axios from 'axios';
import { API_BASE_URL } from './index';

export function apiGet(path) {
  try {
    const response = axios.get(`${API_BASE_URL}/${path}`);
    if (response.statusCode === 200) {
      return { statusCode: response.statusCode, error: '' };
    }

    return {
      statusCode: response.statusCode,
      error: response.error
    };
  } catch (err) {
    return {
      statusCode: 500,
      error: err.message
    };
  }
}
