import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Config from 'react-native-config';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import database from '@react-native-firebase/database';

import { contentUri, storagekeys } from '../contants';
import { downloadMedias } from '../services';
import {
  ApiUtil,
  getAllAsyncStorageKey,
  getAsyncStorageItem,
  removeAsyncStorageItem,
  removeMultipleAsyncStorageItem,
  setAsyncStorageItem
} from '../utils';
import { sendMessage } from '.';
import store from '../state/store';
import {
  resetState,
  setAudioId,
  setAudioPlayling,
  setAudioVolume,
  setLightBrightness,
  setLightId,
  setLightState,
  setVideoId,
  setVideoPlaying
} from '../state/controls';

const baseUrl = Config.API_BASE_URL
// const baseUrl = Config.LOCAL_BASE_URL;
const {
  PIN,
  OTP,
  ORG_ID,
  STUDENTID,
  CUBBIE_ID,
  LIGHTMANAGER,
  MEDIAMANAGER,
  ISFIRSTSESSION,
  CURRENTPLAYLIST,
  CURRENTPLAYLISTARGS,
  SESSION_DATA,
  HISTORYID,
  PLAYLISTSTARTTIME,
  ISSESSIONSUBMITTING,
  ISFILEALREADYEXISTS,
  ISFIRSTRENDER
} = storagekeys;
let timeOutId;

const checkWebServer = () => {
  return '[{“hello”}]';
};

const getResponseMessage = ({ command, responseCode, responseStatus }) => {
  return {
    command: {
      ...command
    },
    responseCode,
    responseStatus: responseStatus
  };
};

const videoService = async command => {
  if (command.action === 'start_playlist') {
    const videos = await getMedias(command.args.medias, 'video');
    const playlistDuration = await getAsyncStorageItem(CURRENTPLAYLIST);
    sendMessage(
      JSON.stringify({
        type: 'video',
        command: JSON.stringify(command),
        videos,
        playlistDuration: JSON.parse(playlistDuration)?.duration
      })
    );
  } else {
    sendMessage(
      JSON.stringify({ type: 'video', command: JSON.stringify(command) })
    );
  }
  return getResponseMessage({
    command: command,
    responseCode: 200,
    responseStatus: 'video:success'
  });
};

const getMedias = async (medias, type) => {
  try {
    const configData = await getConfigFile();
    const audiosOrVideos = JSON.parse(configData)?.allPacks[type];
    const mediaPath = JSON.parse(configData)?.preferences[type][`${type}_path`]

    const files = medias?.map((media) => {
      const matchingAudio = audiosOrVideos.find((audio) => audio.id === media.id);

      return matchingAudio
        ? { ...matchingAudio, id: matchingAudio.id, duration: Math.abs(media.duration) }
        : null;
    }).filter(Boolean); // Remove null entries

    return files;
  } catch (err) {
    console.log('Error Occurs when getting the medias', err)
    throw err;
  }
};

const audioService = async command => {
  if (command.action === 'start_playlist') {
    const audios = await getMedias(command.args.medias, 'audio');
    const playlistDuration = await getAsyncStorageItem(CURRENTPLAYLIST);
    sendMessage(
      JSON.stringify({
        type: 'audio',
        command: JSON.stringify(command),
        audios,
        playlistDuration: command.takeControl ? undefined : JSON.parse(playlistDuration)?.duration,
        volume: command?.args?.volume
      })
    );
  } else {
    sendMessage(JSON.stringify({ type: 'audio', command: JSON.stringify(command) }));
  }

  return getResponseMessage({
    command: command,
    responseCode: 200,
    responseStatus: 'audio:success'
  });
};

const lightService = async command => {
  sendMessage(JSON.stringify({ type: 'light', command: JSON.stringify(command) }));
  return getResponseMessage({
    command: command,
    responseCode: 200,
    responseStatus: 'Ok'
  });
};

const getOrganizationDetails = async orgId => {
  try {
    const response = await axios.get(
      `${baseUrl}/mediaBox/orgDetails?orgId=${orgId}`
    );
    return response?.data;
  } catch (err) {
    console.log('Error Occurs when getting the organization details', err.message);
    throw err;
  };
};

const getCubbieDetails = async cubbieId => {
  try {
    const response = await axios.get(
      `${baseUrl}/mediaBox/cubbieDetails?cubbieId=${cubbieId}`
    );
    return response.data;
  } catch (err) {
    console.log('Error Occurs when getting the cubbie details', err);
    throw err;
  };
};

const getConfigFile = async () => {
  try {
    const isCubbieFolderAlreadyExists = await getAsyncStorageItem(ISFILEALREADYEXISTS)
    const parsedIsCubbieFolderAlreadyExists = isCubbieFolderAlreadyExists ? JSON.parse(isCubbieFolderAlreadyExists) : null;
    const filePath = parsedIsCubbieFolderAlreadyExists ? `${contentUri.DOWNLOAD_CUBBIE_PATH}%2Fconfig.json.bak` : `${RNFS.DownloadDirectoryPath}/Cubbie/config.json`;
    const isFileExist = await RNFS.exists(filePath);

    if (isFileExist || (parsedIsCubbieFolderAlreadyExists && filePath)) {
      const file = await RNFS.readFile(filePath);
      return file;
    } else {
      return null;
    }
  } catch (err) {
    console.log('Error Occurs when getting the config file', err);
  };
};

const isAssistant = async ({ pin, configData }) => {
  try {
    const assistantList = configData?.snaList;
    const allStudentList = configData?.allStudentList;
    const studentList = configData?.studentList;
    const endUserList = configData?.endUserList;

    if (assistantList && assistantList.length > 0) {
      let assistant;
      assistantList.forEach(assistantdata => {
        if (assistantdata.pin === pin) {
          assistant = assistantdata;
        }
      });
      if (assistant) {
        return assistant;
      }
    }
    if (allStudentList && allStudentList.length > 0) {
      let student;
      allStudentList.forEach(studentData => {
        if (studentData.pin === pin) {
          student = studentData;
        }
      });
      if (student) {
        return student;
      }
    }
    if (studentList && studentList.length > 0) {
      let student;
      studentList.forEach(studentData => {
        if (studentData.pin === pin) {
          student = studentData;
        }
      });
      if (student) {
        return student;
      }
    }
    if (endUserList && endUserList.length > 0) {
      let endUser;
      endUserList.forEach(endUserData => {
        if (endUserData.pin === pin) {
          endUser = endUserData;
        }
      });
      if (endUser) {
        return endUser;
      }
    }

    return null;
  } catch (err) {
    console.log('Error Occurs when checking the assistant', err);
  };
};

const checkUserPin = async pin => {
  const configData = await getConfigFile();

  if (configData) {
    if (JSON.parse(configData)?.pins?.includes(pin)) {
      return true;
    }
    return isAssistant({ pin, configData: JSON.parse(configData) });
  } else {
    throw new Error('Config file not available');
  }
};

const loginCheck = async pin => {
  const db = database();
  const userRef = db.ref(`${DeviceInfo.getDeviceId()}/webserver/loginCheck`);
  try {
    const isUserPin = await checkUserPin(Number(pin));
    if (isUserPin) {
      await setAsyncStorageItem(PIN, pin);
    } else {
      throw new Error('Login Error');
    }
    userRef.set({ status: 'success'});
    return isUserPin;
  } catch (err) {
    console.log('Error Occurs when checking the login details', err);
    userRef.set(err);
    throw err;
  };
};

const sendOtpSignInPublic = async command => {
  try {
    const serverApiEndPoint = 'mediaBox/signIn/public';
    const configData = await getConfigFile();

    const body = {
      pin: command?.args?.pin,
      cubbieId: JSON.parse(configData)?.preferences?.system?.cubbieId
    };

    const response = await ApiUtil.postWithoutToken(serverApiEndPoint, body);
    console.log("response", response);
    const db = database();
    const userRef = db.ref(`${DeviceInfo.getDeviceId()}/sendOtpSignInPublic`);
    userRef.set(response?.data);
    await setAsyncStorageItem(OTP, String(response?.data?.otp));

    return response;
  } catch (err) {
    console.log('Error Occurs when sending the otp', err);
    throw err;
  };
};

const checkIsFirstSession = async () => {
  try {
    const configData = await getConfigFile();
    const cubbieId = JSON.parse(configData)?.preferences?.system?.cubbieId;

    if (configData && cubbieId) {
      serverApiEndPoint = 'mediaBox/session/isFirstSession';
      const response = await ApiUtil.postWithoutToken(serverApiEndPoint, {
        cubbieId
      });
      await setAsyncStorageItem(
        ISFIRSTSESSION,
        String(response?.data?.isFirstSession)
      );
      const isFirstSession = await getAsyncStorageItem(ISFIRSTSESSION);
      console.log('checkIsFirstSession-1', response?.data?.isFirstSession)
      console.log('checkIsFirstSession-2', isFirstSession)
    }
  } catch (err) {
    console.log('Error Occurs when checking the is first session', err);
    throw err;
  }
};

const getPlaylistForId = async id => {
  const configData = await getConfigFile();
  const playlists = JSON.parse(configData)?.playlists;

  const playlist = playlists.find(list => list.id === id)

  return playlist || null;
};

const addSessionData = async data => {
  const storedSession = await getAsyncStorageItem(SESSION_DATA);
  const newSessionData = storedSession ? JSON.parse(storedSession) : [];

  const sessionData = {
    video_id: 0,
    audio_id: 0,
    light_id: 0,
    light_brightness: 0,
    audio_volume: 0,
    light_hex_color: '',
    time: ''
  };

  try {
    if (data.category === 'video') {
      sessionData.video_id = data.video_id;

      store.dispatch(setVideoId(data.video_id));
      store.dispatch(setVideoPlaying(data.video_playing));
    }

    if (data.category === 'audio') {
      sessionData.audio_id = data.audio_id;
      sessionData.audio_volume = data.audio_volume;
      store.dispatch(setAudioId(data.audio_id));
      store.dispatch(setAudioVolume(data.audio_volume));
      store.dispatch(setAudioPlayling(data.audio_playing));
    }

    if (data.category === 'light') {
      sessionData.light_id = data.light_id;
      sessionData.light_brightness = data.light_brightness;
      sessionData.on_state = data.on_state;
      if (data.light_id) {
        store.dispatch(setLightId(data.light_id))
      }
      if (data.light_brightness) {
        store.dispatch(setLightBrightness(data.light_brightness));
      }
      store.dispatch(setLightState(data.on_state));
    }

    sessionData.time = Date.now();
    newSessionData.push(sessionData);
    await setAsyncStorageItem(SESSION_DATA, JSON.stringify(newSessionData));
  } catch (err) {
    console.log('Error Occurs when adding session data', err);
  }
};

const submitSessionData = async data => {
  try {
    const isSessionSubmitting = await getAsyncStorageItem(ISSESSIONSUBMITTING);
    if (!isSessionSubmitting) {
      const sessionDataRequest = {
        beforefeedbackRating: data?.beforefeedbackRating || 0,
        afterfeedbackRating: data?.afterfeedbackRating || 0,
        sessionStartTime: data?.sessionStartTime || 0.0,
        sessionEndTime: data?.sessionEndTime || 0.0,
        orgId: data?.orgId || 0,
        cubbieId: data?.cubbieId || 0,
        snaId: data?.snaId || 0,
        programId: data?.programId || 0,
        status: data?.status || null,
        studentId: data?.studentId || 0,
        history: data?.history || []
      }

      await setAsyncStorageItem(ISSESSIONSUBMITTING, 'true');

      const config = await getConfigFile();

      const sessionFeedbackURL =
        JSON.parse(config)?.preferences?.system?.sessionFeedbackURL;

      if (sessionFeedbackURL) {
        const response = await axios.post(
          sessionFeedbackURL,
          sessionDataRequest
        );

        await setAsyncStorageItem(
          HISTORYID,
          JSON.stringify(response?.data?.historyId)
        );
      }
    }
  } catch (err) {
    await setAsyncStorageItem(ISSESSIONSUBMITTING, 'false');
    console.log('Error Occurs when submitting the session data', err);
    throw err;
  }
};

const stopMediaService = () => {

  const command = { action: 'stop_playlist' };
  sendMessage(
    JSON.stringify({ command: JSON.stringify(command) })
  );
}

const stopLightService = () => {
  const command = { action: 'stop_playlist' };
  sendMessage(
    JSON.stringify({ command: JSON.stringify(command) })
  );
}

const stopPlayList = async () => {
  try {
    const isLightServiceActive = await getAsyncStorageItem(LIGHTMANAGER);
    const isMediaServiceActive = await getAsyncStorageItem(MEDIAMANAGER);

    if (isMediaServiceActive && isLightServiceActive) {
      const command = { action: 'stop_playlist' };
      sendMessage(
        JSON.stringify({ command: JSON.stringify(command) })
      );
    }

    if (isMediaServiceActive && !isLightServiceActive) {
      stopMediaService()
    }

    if (!isMediaServiceActive && isLightServiceActive) {
      stopLightService()
    }
    timeOutId = null;
  } catch (err) {
    console.log('Error Occurs when stopping the playlist', err);
  }
};

const startPlaylist = async args => {
  try {
    if (args) {
      const currentPlayListArgs = args;
      const id = args?.id;
      const duration = args?.duration;
      let studentId = null;

      if (args.studentId) {
        studentId = args.studentId;
        await setAsyncStorageItem(STUDENTID, JSON.stringify(studentId));
      }

      const currentPlayList = await getPlaylistForId(id);
      currentPlayList.duration = duration;
      currentPlayListArgs.programId = id;
      currentPlayListArgs.beforefeedbackRating = args.beforeSessionFeedback;
      const playlistStartTime = Date.now();
      await setAsyncStorageItem(
        CURRENTPLAYLISTARGS,
        JSON.stringify(currentPlayListArgs)
      );
      await setAsyncStorageItem(
        CURRENTPLAYLIST,
        JSON.stringify(currentPlayList)
      );
      await setAsyncStorageItem(
        PLAYLISTSTARTTIME,
        JSON.stringify(playlistStartTime)
      );

      if (currentPlayList.data && currentPlayList.data.length > 0) {
        await executeUserCommand(currentPlayList.data)
      }

      if (timeOutId) {
        clearTimeout(timeOutId);
      }
      timeOutId = setTimeout(() => stopPlayList(), duration * 1000);
    }
    return 'All Good';
  } catch (err) {
    console.log('Error Occurs when starting the playlist', err);
    throw err;
  }
};

const submitFeedBack = async command => {
  try {
    const feedback = {
      historyId: null,
      afterfeedbackRating: 0.0
    };
    const historyId = await getAsyncStorageItem(HISTORYID);
    feedback.historyId = JSON.parse(historyId);
    if (command?.args?.afterfeedbackRating) {
      feedback.afterfeedbackRating = command?.args?.afterfeedbackRating;
    }
    const config = await getConfigFile();
    const sessionFeedbackURL =
      JSON.parse(config)?.preferences?.system?.sessionFeedbackURL;
    if (sessionFeedbackURL) {
      const response = await axios.post(
        `${sessionFeedbackURL}/update`,
        feedback
      );
      return response;
    }
  } catch (err) {
    console.log('Error Occurs when submitting the feedback', err);
    throw err;
  }
};

const getPlayListForStartTime = async () => {
  const currentPlaylist = await getAsyncStorageItem(CURRENTPLAYLIST)
  const playlistStartTime = await getAsyncStorageItem(PLAYLISTSTARTTIME)

  if (currentPlaylist) {
    const parsedCurrentPlayList = JSON.parse(currentPlaylist)
    const toFinish =
      (parsedCurrentPlayList?.duration
        ? parsedCurrentPlayList?.duration * 1000
        : 0) -
      (Date.now() - JSON.parse(playlistStartTime))

    return toFinish
  }

  return 0
}

const systemServices = async command => {
  try {
    if (command.action === 'connect_mediabox') {
      const keys = await AsyncStorage.getAllKeys();

      const data = [];
      keys.forEach(async ele => {
        const items = await getAsyncStorageItem(ele);

        data.push(items);
      });

      return getResponseMessage({
        command: command,
        responseCode: 200,
        responseStatus: 'Ok'
      });
    }

    if (command.action === 'setup_orgId' && command?.args?.orgId) {
      const orgDetails = await getOrganizationDetails(command?.args?.orgId);
      console.log('orgDetails', orgDetails);
      if (orgDetails) {
        await setAsyncStorageItem(ORG_ID, command?.args?.orgId);
        return getResponseMessage({
          command: command,
          responseCode: 200,
          responseStatus: orgDetails
        })
      } else {
        return getResponseMessage({
          command: command,
          responseCode: 200,
          responseStatus: '400'
        });
      }
    }
    if (command.action === 'setup_cubbieId' && command?.args?.cubbieId) {
      try {
        const cubbieDetails = await getCubbieDetails(command?.args?.cubbieId);
        await setAsyncStorageItem(CUBBIE_ID, command?.args?.cubbieId);

        const orgId = await getAsyncStorageItem(ORG_ID);
        const cubbieId = await getAsyncStorageItem(CUBBIE_ID);

        if (orgId && cubbieId) {
          const response = await downloadMedias(orgId, cubbieId, null, (cubbieDetails[0]?.orgId != orgId && cubbieDetails[0].isPublic));

          console.log('setup_cubbieId completed', JSON.stringify(cubbieDetails));
          return getResponseMessage({
            command,
            responseCode: 200,
            responseStatus: JSON.stringify(cubbieDetails),
          });
        }
      } catch (err) {
        console.log('Error Occurs when setup cubbieId', err);
        return getResponseMessage({
          command: command,
          responseCode: 200,
          responseStatus: '400'
        });
      }
    }
    if (command.action === 'config') {
      const configFile = await getConfigFile();

      if (configFile) {
        return getResponseMessage({
          command: command,
          responseCode: 200,
          responseStatus: [configFile]
        });
      }
    }

    if (command.action === 'thumb') {
      return getResponseMessage({
        command: command,
        responseCode: 200,
        responseStatus: ''
      });
    }

    if (command.action === 'login' && command?.args?.pin) {
      let isUserPin = false;
      try {
        isUserPin = await loginCheck(command?.args?.pin);
      } catch (e) {
        if (
          command?.args?.pin &&
          command?.args?.orgId &&
          command?.args?.cubbieId
        ) {
          const cubbieDetails = await getCubbieDetails(command?.args?.cubbieId)

          await downloadMedias(
            command?.args?.orgId,
            command?.args?.cubbieId,
            command?.args?.pin,
            cubbieDetails[0]?.orgId != command?.args?.orgId &&
              cubbieDetails[0].isPublic
          )
          isUserPin = await loginCheck(command.args?.pin)
          if (isUserPin === null) {
            return getResponseMessage({
              command: command,
              responseCode: 400,
              responseStatus: 'Login Error'
            })
          }
        }
      }

      if (isUserPin === null) {
        return getResponseMessage({
          command: command,
          responseCode: 400,
          responseStatus: 'Login Error'
        });
      }

      await removeAsyncStorageItem(ISSESSIONSUBMITTING);
      await removeAsyncStorageItem(SESSION_DATA);
      return getResponseMessage({
        command: command,
        responseCode: 200,
        responseStatus: JSON.stringify(isUserPin)
      });
    }

    if (command.action === 'is_first_session') {
      const keys = await getAllAsyncStorageKey();
      store.dispatch(resetState());
      const filteredKeys = keys.filter(
        key =>
          ![
            'BACKGROUND_TASK_STATUS',
            'SERVER_STATUS',
            'MEDIAMANAGER',
            'LIGHTMANAGER',
            'DOWNLOAD_CUBBBIE_PATH',
            'IS_FILE_ALREADY_EXISTS',
            'IS_FIRST_RENDER',
            'VIDEO_PATH'
          ].includes(key)
      );
      const isFirstSession = await getAsyncStorageItem(ISFIRSTSESSION);
      const orgId = await getAsyncStorageItem(ORG_ID);
      const cubbieId = await getAsyncStorageItem(CUBBIE_ID);
      if (orgId && cubbieId) {
        downloadMedias(orgId, cubbieId);
      }
      //await removeMultipleAsyncStorageItem(filteredKeys);
      return getResponseMessage({
        command: command,
        responseCode: 200,
        responseStatus: isFirstSession
      });
    }

    if (command.action === 'update_config') {
      try {
        const orgId = await getAsyncStorageItem(ORG_ID);
        const cubbieId = await getAsyncStorageItem(CUBBIE_ID);
        if (orgId && cubbieId) {
          const response = await downloadMedias(orgId, cubbieId);
          return getResponseMessage({
            command,
            responseCode: 200,
            responseStatus: true + '',
          });
        }
      } catch (err) {
        console.log('Error Occurs when update_config', err);
        return getResponseMessage({
          command: command,
          responseCode: 200,
          responseStatus: '400'
        });
      }
    }

    if (command.action === 'send_otp') {
      const db = database();
      const userRef = db.ref(`${DeviceInfo.getDeviceId()}/send_otp`);
      userRef.set({ action: command.action });
      await sendOtpSignInPublic(command);
      
      return getResponseMessage({
        command: command,
        responseCode: 200,
        responseStatus: 'system response'
      });
    }

    if (command.action === 'verify_otp') {
      const otp = await getAsyncStorageItem(OTP);
      console.log('verify_otp', command, otp);
      const db = database();
      const userRef = db.ref(`${DeviceInfo.getDeviceId()}/verifyOtp`);
      userRef.set({ localOtp: otp, commandOtp: command?.args?.otp, action: command.action });
      if (command?.args?.otp && otp && otp === command?.args?.otp) {
        const pin = await getAsyncStorageItem(PIN);
        const user = await loginCheck(pin);
        console.log('verify_otp - 1', user, pin);
        userRef.set({ status: 'success', user });

        return getResponseMessage({
          command: command,
          responseCode: 200,
          responseStatus: JSON.stringify(user)
        });
      }

      return getResponseMessage({
        command: command,
        responseCode: 200,
        responseStatus: 'false'
      });
    }

    if (command.action === 'start_playlist') {
      await checkIsFirstSession();
      const response = await startPlaylist(command.args);
      return getResponseMessage({
        command: command,
        responseCode: 200,
        responseStatus: response
      });
    };

    if (command.action === 'stop_playlist') {
      const currentPlayListArgs = await getAsyncStorageItem(CURRENTPLAYLISTARGS);
      if (currentPlayListArgs) {
        const parsedCurrentPlayListArgs = JSON.parse(currentPlayListArgs);
        const studentId = await getAsyncStorageItem(STUDENTID);
        parsedCurrentPlayListArgs.sessionEndTime = Date.now();
        parsedCurrentPlayListArgs.status = command?.args?.status;

        if (studentId) {
          parsedCurrentPlayListArgs.studentId = JSON.parse(studentId);
        }
        const history = await getAsyncStorageItem(SESSION_DATA);
        parsedCurrentPlayListArgs.history = history ? JSON.parse(history) : [];
        await submitSessionData(parsedCurrentPlayListArgs);
        await removeAsyncStorageItem(PLAYLISTSTARTTIME);
        store.dispatch(resetState());

        clearTimeout(timeOutId);
        await stopPlayList();

        return getResponseMessage({
          command: command,
          responseCode: 200,
          responseStatus: 'Ok'
        });
      }
    }

    if (command.action === 'submit_feedback') {
      await submitFeedBack(command);
      await removeMultipleAsyncStorageItem([CURRENTPLAYLISTARGS, SESSION_DATA]);
      return getResponseMessage({
        command: command,
        responseCode: 200,
        responseStatus: 'Ok'
      });
    };

    if (command.action === 'playlist_progress') {
      const playlistStartTime = await getAsyncStorageItem(PLAYLISTSTARTTIME);
      if (playlistStartTime) {
        return getPlayListForStartTime();
      }

      return 0;
    }
    if (command.action === 'playlist_total_duration') {
      const playlistStartTime = await getAsyncStorageItem(PLAYLISTSTARTTIME);
      if (playlistStartTime) {
        const currentPlayList = await getAsyncStorageItem(CURRENTPLAYLIST)
        if (JSON.parse(currentPlayList)?.duration) {
          return JSON.parse(currentPlayList)?.duration * 1000;
        }
        return 0;
      }

      return 0;
    }

    if (command.action === 'playlist_id') {
      const playlistStartTime = await getAsyncStorageItem(PLAYLISTSTARTTIME)

      if (playlistStartTime) {
        const currentPlayList = await getAsyncStorageItem(CURRENTPLAYLIST)
        if (currentPlayList) {
          return JSON.parse(currentPlayList)?.id
        }
        return 0
      }

      return 0
    }

    if (command.action === 'playlist_name') {
      const playlistStartTime = await getAsyncStorageItem(PLAYLISTSTARTTIME)

      if (playlistStartTime) {
        const currentPlayList = await getAsyncStorageItem(CURRENTPLAYLIST)
        if (currentPlayList) {
          return JSON.parse(currentPlayList)?.name
        }

        return 0
      }

      return 0
    }
  } catch (err) {
    console.log('Error Occurs when processing the system service', err);
    throw err;
  };
};

const statusService = async command => {
  try {
    const status = {
      version: 0,
      video_id: 0,
      audio_id: 0,
      light_id: 0,
      playlist_id: 0,
      playlist_name: '',
      light_brightness: 0,
      audio_volume: 0,
      video_playing: 0,
      audio_playing: 0,
      playlist_progress: 0,
      playlist_total_duration: 0,
      on_state: 0,
      isFilesAreDownloading: false
    };

    const configData = await getConfigFile();

    const version = configData ? JSON.parse(configData)?.version : 0;
    const isLightServiceActive = await getAsyncStorageItem(LIGHTMANAGER);
    const isMediaServiceActive = await getAsyncStorageItem(MEDIAMANAGER);
    const {
      audio_id,
      video_id,
      video_playing,
      audio_playing,
      audio_volume,
      isFilesAreDownloading
    } = store.getState()?.controls
    if (isMediaServiceActive) {
      status.audio_id = audio_id
      status.video_id = video_id
      status.video_playing = video_playing
      status.audio_playing = audio_playing
      status.audio_volume = audio_volume
    }
    if (isLightServiceActive) {
      const { light_id, light_brightness, on_state } = store.getState()?.controls
      status.light_id = light_id
      status.light_brightness = light_brightness
      status.on_state = on_state
    }
    status.playlist_id = await systemServices({ action: 'playlist_id' })
    status.playlist_progress = await systemServices({
      action: 'playlist_progress'
    })
    status.playlist_name = await systemServices({ action: 'playlist_name' })
    status.isFilesAreDownloading = isFilesAreDownloading
    return getResponseMessage({
      command: command,
      responseCode: 200,
      responseStatus: JSON.stringify({ ...status, version })
    });
  } catch (err) {
    console.log('Error Occurs when getting the status', err)
    throw err
  }
}

const executeUserCommand = async commands => {
  try {
    const isLightServiceActive = await getAsyncStorageItem(LIGHTMANAGER);
    const isMediaServiceActive = await getAsyncStorageItem(MEDIAMANAGER);

    const results = [];
    if (commands && commands.length > 0) {
      for (const command of commands) {
        let result;

        if (isMediaServiceActive && command.component === 'video') {
          result = await videoService(command);
        }
        if (isMediaServiceActive && command.component === 'audio') {
          result = await audioService(command);
        }
        if (isLightServiceActive && command.component === 'light') {
          console.log('isLightServiceActive', isLightServiceActive)
          
          result = await lightService(command);
        }
        if (command.component === 'system') {
          result = await systemServices(command);
        }
        if (command.component === 'status') {
          result = await statusService();
        }

        results.push(result);
      }
    }

    return results;
  } catch (err) {
    console.log('Error occurs when the executing user command ', err);
    throw err;
  };
};

const getThumbnailURIForVideoWithId = async id => {
  try {
    const config = await getConfigFile()
    const configData = JSON.parse(config)

    const videos = configData?.allPacks?.video

    if (videos && videos.length > 0) {
      let thumbnail = null
      videos.forEach(video => {
        if (video.id === id) {
          thumbnail = video.thumbnailName
        }
      })

      return thumbnail
    }

    return null
  } catch (err) {
    console.log('Error occurs when the finding the image', err)
    throw err
  }
}

const getBase64Thumbnail = async data => {
  try {
    const { id } = data
    const thumbnailName = await getThumbnailURIForVideoWithId(id)
    const isCubbieFolderAlreadyExists = await getAsyncStorageItem(ISFILEALREADYEXISTS)
    const parsedIsCubbieFolderAlreadyExists = isCubbieFolderAlreadyExists ? JSON.parse(isCubbieFolderAlreadyExists) : null
    const thumbnailPath = parsedIsCubbieFolderAlreadyExists ? `${contentUri.DOWNLOAD_CUBBIE_PATH}%2F${thumbnailName}` : `${RNFS.DownloadDirectoryPath}/Cubbie/${thumbnailName}`
    const thumbnailData = await RNFS.readFile(thumbnailPath, 'base64')
    const dataUri = `data:image/png;base64,${thumbnailData}`
    console.log('dataUri', dataUri)
    return { dataUri }
  } catch (err) {
    console.log('Error occurs when the getting base64 image', err)
    throw err
  }
}

const sendDefaultValues = async message => {
  try {
    const configData = await getConfigFile();
    const parsedConfigData = configData ? JSON.parse(configData) : null;
    const { audio, light } = parsedConfigData?.preferences;

    if (JSON.parse(message).clientType === 'mediaManager' && parsedConfigData) {
      sendMessage(
        JSON.stringify({
          type: 'audio',
          command: JSON.stringify({
            action: 'set_default_state',
            defaultValues: {
              ...audio
            }
          })
        })
      );
    }
  } catch (error) {
    console.log('error', error);
  }
};

export {
  checkWebServer,
  executeUserCommand,
  addSessionData,
  getBase64Thumbnail,
  sendDefaultValues
};
