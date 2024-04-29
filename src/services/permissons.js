import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  openSettings,
  request
} from 'react-native-permissions';
import store from '../state/store';
import { getAllAsyncStorageKey, removeMultipleAsyncStorageItem } from '../utils';

const removeAllAsyncStorage = async () => {
  const allKeys = await getAllAsyncStorageKey();
  console.log(allKeys);
  await removeMultipleAsyncStorageItem(allKeys)
}

const checkPermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 30) {
      // Android 11 and higher
      const isStorageManager = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE &&
          PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION
      );

      if (isStorageManager) {
        return true;
      } else {
        // Request for the permission
        try {
          await removeAllAsyncStorage();
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          // After the user responds to the request, you can check the permission status again.
          const isStorageManager = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          if (isStorageManager) {
            return true;
          } else {
            // The user denied the permission.
            Alert.alert(
              'Permission',
              'Photos and videos permission has been denied. Please grant permission in your device settings (App Info => permissions).',
              [
                {
                  text: 'Ok',
                  style: 'cancel',
                  onPress: () => openNotificationSettings()
                }
              ]);
            return false;
          }
        } catch (err) {
          console.log(err);
          return false;
        }
      }
    } else {
      // Below Android 11
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        // The user denied the permission.
        return false;
      }
    }
  } else {
    // For non-Android platforms
    return true;
  }
};

const checkNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 30) {
        const permissionStatus = await request(
          PERMISSIONS.ANDROID.POST_NOTIFICATIONS
        );

        if (permissionStatus === RESULTS.BLOCKED || permissionStatus === RESULTS.UNAVAILABLE) {
          // Permission blocked, open settings
          // Alert.alert(
          //   'Permission',
          //   'Notification permission has been denied. Please grant permission in your device settings (App Info => permissions).',
          //   [
          //     {
          //       text: 'Ok',
          //       style: 'cancel',
          //       onPress: () => openNotificationSettings()
          //     }
          //   ]);
        }
      }
    } else {
      const permissionStatus = await request(
        PERMISSIONS.ANDROID.POST_NOTIFICATIONS
      );

      if (permissionStatus === 'granted') {
        return true
      } else {
        return false
      }
    }
  } catch (error) {
    console.log('openNotificationSettings', error);
  }
};

const openNotificationSettings = () => {
  console.log('openNotificationSettings', Platform.OS);
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    openSettings();
  }
};

export default {
  checkPermission,
  checkNotificationPermission
};
