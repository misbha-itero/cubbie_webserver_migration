import axios from 'axios';
import Config from 'react-native-config';

const baseUrl = Config.API_BASE_URL;
// const baseUrl = Config.LOCAL_BASE_URL;

const ApiUtil = {
  getWithoutToken: url => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${baseUrl}/${url}`)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  },
  postWithoutToken: (url, data) => {
    return new Promise((resolve, reject) => {
      axios
        .post(`${baseUrl}/${url}`, data)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  },
  putWithoutToken: (url, data) => {
    return new Promise((resolve, reject) => {
      axios
        .put(`${baseUrl}/${url}`, data)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  },
  deletetWithoutToken: url => {
    return new Promise((resolve, reject) => {
      axios
        .delete(`${baseUrl}/${url}`)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  },
};

export default ApiUtil;
