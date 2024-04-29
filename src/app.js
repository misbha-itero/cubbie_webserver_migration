// App
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import BackgroundService from 'react-native-background-actions'
import { Header } from './components/header';
import { startServer, stopServer } from './server';
import { contentUri, storagekeys } from './contants';
import { downloadMedias } from './services';
import permissons from './services/permissons';
import { ApiUtil, getAsyncStorageItem, setAsyncStorageItem } from './utils';
import RNFS from 'react-native-fs';
import * as ScopedStorage from 'react-native-scoped-storage';
import { Modal } from './components';
import store from './state/store';
import { useSelector } from 'react-redux'; // assuming you're using Redux
import Example from './Example';
import firebase from '@react-native-firebase/app';

const { checkPermission, checkNotificationPermission } = permissons;

const firebaseConfig = {
  apiKey: 'AIzaSyBpsnzA97voLYfVzVtHhhpl-4OGK_Rzwbc',
  // authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'cubbie-light',
  appId: '1:531451339187:android:801de2a12ebd5281d7ebc6',
  messagingSenderId: '531451339187',
  // authDomain: '.firebaseapp.com',
  databaseURL:
    'https://cubbie-light-default-rtdb.firebaseio.com/',
  storageBucket: 'cubbie-light.appspot.com',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  }

const {
  SERVER_STATUS_KEY,
  ORG_ID,
  CUBBIE_ID,
  PIN,
  DOWNLOADCUBBIEPATH,
  AUDIOPATH,
  VIDEOPATH,
  ISFIRSTRENDER,
  ISFILEALREADYEXISTS
} = storagekeys;

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

const veryIntensiveTask = async taskDataArguments => {
  // Example of an infinite loop task
  const { delay } = taskDataArguments;
  await new Promise(async resolve => {
    for (let i = 0; BackgroundService.isRunning(); i++) {
      const status = await getServerStatus();
      if (!status) {
        startServer();
      }
      await sleep(delay);
    }
  });
};

const getServerStatus = async () => {
  let isServerRunning = false;
  await fetch('http://localhost:8080/api/heartbeat').then((response) => {
    console.log('response', response);
    if (response.ok) {
      console.log('Server is running');
      isServerRunning = true
    }
  }).catch(async (err) => {
    console.log('err', err);
  });

  return isServerRunning
}

const options = {
  taskName: 'Server',
  taskTitle: 'Cubbie is running in the background',
  taskDesc: '',
  taskIcon: {
    name: 'ic_launcher',
    type: 'drawable',
    package: 'com.cubbie_webserver_migration'
  },
  color: '#ff00ff',
  linkingURI: 'yourSchemeHere://chat/jane', // See Deep Linking for more info
  parameters: {
    delay: 300000
  }
};

function App() {
  const [isShowModal, setIsShowModal] = useState({ isVisible: false, content: '' });
  const { isFilesAreDownloading } = useSelector(state => state.controls)
  const [isExpired, setIsExpired] = useState(false);

  const startBackgroundServer = async () => {
    const isBackgroundServerRunning = await Example.isServiceRunning();
    // const isBackgroundServerRunning = BackgroundService.isRunning();
    console.log('isBackgroundServerRunning app', isBackgroundServerRunning);
    try {
      if (!isBackgroundServerRunning) {
        // await BackgroundService.start(veryIntensiveTask, options);
        // await BackgroundService.updateNotification({
        //   taskDesc: ''
        // });
        await Example.startService()
        console.log('isBackgroundServerRunning - 1 app', isBackgroundServerRunning);
        
        const intervalId = setInterval(async () => {
          console.log('isBackgroundServerRunning - 2 app', isBackgroundServerRunning);
          const isBackgroundServerRunning = await Example.isServiceRunning();
          const isServerRunning = await getServerStatus();
          console.log(isBackgroundServerRunning, isServerRunning);
          if (!isBackgroundServerRunning) {
            startBackgroundServer()
          } else if (isBackgroundServerRunning && !isServerRunning) {
            startServer()
          }
        }, 60000);

      } else {
        fetch('http://localhost:8080/api/heartbeat').then((response) => {
          console.log('response', response);
          if (response.ok) {
            console.log('Server is running');
          }
        }).catch(async (err) => {
          console.log('err', err);
          await startServer();
        });
      }

    } catch (error) {
      console.log("ERROR in connecting background service", error.message);
    }
  };

  const stopBackgroundServer = async () => {
    // await BackgroundService.stop();
    await Example.stopService();
    await stopServer();
  };

  const getContentPath = (contentUri) => {
    const decodedUri = decodeURIComponent(contentUri);
    const uriParts = decodedUri.split('/primary:');

    return uriParts.length > 0 ? uriParts.pop() : '';
  };  

  const getFolderPermission = async (key) => {
    try {
      if (key) {
        const selectedDirectory = await ScopedStorage.openDocumentTree(true);
        const selectedPath = getContentPath(selectedDirectory.uri);

        const expectedDir = key === 'DOWNLOAD_CUBBBIE_PATH' ? 'Download/Cubbie' : `Download/Cubbie/media/videos`;
        if (selectedPath !== expectedDir) {
          return Alert.alert(
            'Choose the correct path',
            `The selected path "${selectedPath}" is incorrect. \n\n Please Select \n"Internal Storage/${expectedDir}"`,
            [
              { text: 'Cancel' },
              {
                text: 'Choose the path',
                onPress: () => {
                  getPermission(key);
                },
              },
            ],
          );
        }

        if (selectedDirectory) {
          const cubbieFolderPath = 'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie/document/primary%3ADownload%2FCubbie';
          const persistedUris = await ScopedStorage.getPersistedUriPermissions();

          let isExpectedDirectory = false;
          if (cubbieFolderPath === selectedDirectory.uri) {
            isExpectedDirectory = true;
            await setAsyncStorageItem(DOWNLOADCUBBIEPATH, JSON.stringify(selectedDirectory));
          }

          if (contentUri.VIDEO_PATH === selectedDirectory.uri) {
            isExpectedDirectory = true;
            await setAsyncStorageItem(VIDEOPATH, JSON.stringify(selectedDirectory));
          }

          if (isExpectedDirectory) {
            setIsShowModal({ isVisible: false, content: '' });
            // ScopedStorage.deleteFile(`${selectedDiredcotry.uri}%2Fmedia`)
            // ScopedStorage.deleteFile(`${selectedDiredcotry.uri}%2Fconfig.json`)
            // ScopedStorage.deleteFile(`${selectedDiredcotry.uri}%2Fconfig.json.bak`)
            return selectedDirectory;
          }
          await ScopedStorage.releasePersistableUriPermission(persistedUris[persistedUris.length - 1]);
          setIsShowModal({ isVisible: true, content: key === DOWNLOADCUBBIEPATH ? 'Download/Cubbie' : 'Download/Cubbie/media/videos' })
        }
      }

    } catch (error) {
      console.log('error', error);
    }
  }

  const getNotificationPermission = async () => {
    await checkPermission();
    await checkNotificationPermission();
  }


  const getPermission = async () => {
    const isFirstRender = await getAsyncStorageItem(ISFIRSTRENDER);
    if (
      !isFirstRender ||
      (isFirstRender && JSON.parse(isFirstRender)?.isFileExist)
    ) {
      const isFileExist = await RNFS.exists(`${RNFS.DownloadDirectoryPath}/Cubbie`);

      if (!isFirstRender) {
        await setAsyncStorageItem(
          ISFIRSTRENDER,
          JSON.stringify({ isFirstRender: true, isFileExist: isFileExist })
        )

        await setAsyncStorageItem(
          ISFILEALREADYEXISTS,
          JSON.stringify(isFileExist)
        )
      }

      const hasDownloadCubbieFolderAccess = await getAsyncStorageItem(DOWNLOADCUBBIEPATH);
      const hasVideoFolderAccess = await getAsyncStorageItem(VIDEOPATH);

      if (isFileExist && !hasDownloadCubbieFolderAccess) {
        if (!isShowModal.isVisible && !isShowModal.content) {
          setIsShowModal({ isVisible: true, content: 'Download/Cubbie' })
        }

        if (!isShowModal.isVisible && isShowModal.content) {
          await getFolderPermission(DOWNLOADCUBBIEPATH)
        }
      }
    }
  }

  const checkExpiration = async () => {
    const expirationDateTime = new Date('2024-04-30T12:00:00+05:30'); // Set expiration date and time (Mar 26 12 PM IST)
    const response = await ApiUtil.getWithoutToken('mediaBox/currentDateTime');
    const { currentDateTime } = response.data
    const current = new Date(currentDateTime);

    if (current >= expirationDateTime) {
      console.log('Time expired');
      setIsExpired(true);
      stopBackgroundServer();
    } else {
      console.log('Time not expired');
      setIsExpired(false);
    }
  };



  useEffect(() => {
    checkExpiration(); // Initial check on component mount

    let timeout = setTimeout(function checkExpiry() {
      checkExpiration(); // Check expiration periodically
      timeout = setTimeout(checkExpiry, 60000); // Recursive call after 1 minute
    }, 60000);

    // Clean up
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isExpired) {
      getNotificationPermission();
      // startBackgroundServer();

      return () => {
        startServer();
      };
    }
  }, []);

  useEffect(() => {
    if (!isExpired) {
      getPermission()
    }
  }, [isShowModal])

  const handleDownloadMedia = async () => {
    const orgId = await getAsyncStorageItem(ORG_ID);
    const cubbieId = await getAsyncStorageItem(CUBBIE_ID);
    const pin = await getAsyncStorageItem(PIN);
    downloadMedias(orgId, cubbieId, pin)
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const handleCheckServer = async () => {
    const isBackgroundServerRunning = await Example.isServiceRunning();
    const isServerRunning = await getServerStatus();
    Alert.alert('Server Status', `Is server actually running? ${(isBackgroundServerRunning && isServerRunning)}.Does it need to run? ${!(isBackgroundServerRunning && isServerRunning)}.`, [
      {
        text: 'Ok',
        style: 'cancel',
      },
    ]);
  };

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const buttonWidth = screenWidth / 4.5;
  const buttonHeight = screenHeight * 0.1;

  if (isExpired) {
    return (
      <View style={[styles.modal, { opacity: isExpired ? 1 : 0 }]}>
        <Text style={styles.popupText}>The app license has been expired</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Header />
      <Modal isVisible={isShowModal.isVisible}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Please Select{' '}
              <Text style={styles.pathText}>{isShowModal.content}</Text> path
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonClose]}
              onPress={() => setIsShowModal({ ...isShowModal, isVisible: false })}>
              <Text style={styles.textStyle}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView horizontal contentContainerStyle={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#3c9047',
            borderRadius: 10,
            padding: 20,
            margin: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: buttonHeight > 120 ? buttonHeight : 120,
            minWidth: buttonWidth > 240 ? buttonWidth : 240,
          }}
          onPress={() => startBackgroundServer()}
        >
          <Image
            source={require('./assets/ic_start_server_red_foreground.webp')}
            style={{ width: 90, height: 90, marginRight: 5 }}
          />
          <Text
            style={{
              color: 'white',
              fontSize: 20,
              fontWeight: 500,
              textTransform: 'uppercase'
            }}
          >
            Start Server
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#0277bd',
            borderRadius: 10,
            padding: 20,
            margin: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: buttonHeight > 120 ? buttonHeight : 120,
            minWidth: buttonWidth > 240 ? buttonWidth : 240,
          }}
          onPress={() => stopBackgroundServer()}
        >
          <Image
            source={require('./assets/ic_stop_server_foreground.webp')}
            style={{ width: 90, height: 90, marginRight: 5 }}
          />
          <Text
            style={{
              color: 'white',
              fontSize: 20,
              fontWeight: 500,
              textTransform: 'uppercase'
            }}
          >
            Stop Server
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#eb6b56',
            borderRadius: 10,
            padding: 20,
            margin: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: buttonHeight > 120 ? buttonHeight : 120,
            minWidth: buttonWidth > 240 ? buttonWidth : 240,
          }}
          onPress={handleCheckServer}
        >
          <Image
            source={require('./assets/ic_check_server_foreground.webp')}
            style={{ width: 90, height: 90, marginRight: 5 }}
          />
          <Text
            style={{
              color: '#212121',
              fontSize: 20,
              fontWeight: 500,
              textTransform: 'uppercase'
            }}
          >
            Check Server
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#E3E3E3',
            borderRadius: 10,
            padding: 20,
            margin: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: buttonHeight > 120 ? buttonHeight : 120,
            minWidth: buttonWidth > 240 ? buttonWidth : 240,
          }}
          onPress={handleDownloadMedia}
        >
          <Image
            source={require('./assets/ic_check_assets_foreground.webp')}
            style={{ width: 90, height: 90, marginRight: 5 }}
          />
          <Text
            style={{
              color: '#000000',
              fontSize: 20,
              fontWeight: 500,
              textTransform: 'uppercase'
            }}
          >
            Check Assets
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {isFilesAreDownloading === true && (
        <Text style={{ textAlign: 'center', fontSize: 20, alignSelf: 'center', color: '#000', alignItems: 'center', marginBottom: 20 }}>Files are downloading...</Text>
      )}
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: '98%',
    height: 70,
    borderWidth: 1,
    borderColor: "none",
    margin: 5
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    color: 'black',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
    textAlign: 'center'
  },
  pathText: {
    color: '#2196F3',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  waitTxt: { fontSize: 16, marginStart: 5, fontWeight: 'bold', alignSelf: 'center', color: '#0000' },
  loadingBg: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 6,
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  popupText: {
    fontSize: 20,
    color: 'white',
  },
});


export default App;
