// Async Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setAsyncStorageItem = async (itemKey, itemValue) => {
  await AsyncStorage.setItem(itemKey, itemValue);
};

export const getAsyncStorageItem = async itemKey => {
  const item = await AsyncStorage.getItem(itemKey);
  return item;
};

export const removeAsyncStorageItem = async itemKey => {
  const item = await AsyncStorage.removeItem(itemKey);
  return item;
};

export const getAllAsyncStorageKey = async () => {
  const keys = await AsyncStorage.getAllKeys();
  return keys;
};

export const removeMultipleAsyncStorageItem = async (keys) => {
  const item = await AsyncStorage.multiRemove(keys);
  return item;
};
