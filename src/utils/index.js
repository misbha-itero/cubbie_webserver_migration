// Index for utils

/* API */
import { apiGet } from './api';
import ApiUtil from './apiUtil';

/* Async storage */
import {
  setAsyncStorageItem,
  getAsyncStorageItem,
  removeAsyncStorageItem,
  getAllAsyncStorageKey,
  removeMultipleAsyncStorageItem,
} from './async-storage';

/* config media */
import { configDownloadFile } from './config-file';

/* env */
import {
  API_BASE_URL,
  API_PHASE_1_DEV_URL,
  API_PHASE_1_PROD_URL,
  API_PHASE_2_DEV_URL,
  API_PHASE_2_PROD_URL
} from './env';

export {
  API_BASE_URL,
  API_PHASE_1_DEV_URL,
  API_PHASE_1_PROD_URL,
  API_PHASE_2_DEV_URL,
  API_PHASE_2_PROD_URL,
  configDownloadFile,
  apiGet,
  setAsyncStorageItem,
  getAsyncStorageItem,
  removeAsyncStorageItem,
  ApiUtil,
  removeMultipleAsyncStorageItem,
  getAllAsyncStorageKey,
};
