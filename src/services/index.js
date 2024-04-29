import RNFS from 'react-native-fs';
import { ApiUtil, getAsyncStorageItem } from '../utils';
import permissons from './permissons';
import { contentUri, storagekeys } from '../contants';
import { setIsFilesAreDownloading } from '../state/controls';
import store from '../state/store';

const { checkPermission } = permissons;
const { ISFILEALREADYEXISTS } = storagekeys;

const createDirectory = async path => {
  const isDirExists = await RNFS.exists(path);
  if (!isDirExists) {
    await RNFS.readDir(RNFS.DownloadDirectoryPath)
      .then(async () => {
        // Create the directory if it doesn't exist
        await RNFS.mkdir(path);
      })
      .catch(err => {
        console.log(err.message, err.code);
      });
  }

  return 'Directory created successfully';
}

const downloadFile = async response => {
  try {
    const isCubbieFolderAlreadyExists = await getAsyncStorageItem(ISFILEALREADYEXISTS);
    const parsedIsCubbieFolderAlreadyExists = isCubbieFolderAlreadyExists ? JSON.parse(isCubbieFolderAlreadyExists) : null;
    const baseDir = parsedIsCubbieFolderAlreadyExists
      ? contentUri.DOWNLOAD_CUBBIE_PATH
      : `${RNFS.DownloadDirectoryPath}/Cubbie`
    if (!parsedIsCubbieFolderAlreadyExists) {
      await createDirectory(baseDir);
    }

    response.preferences.audio.audio_path = `${RNFS.DownloadDirectoryPath}/Cubbie`;
    response.preferences.video.video_path = `${RNFS.DownloadDirectoryPath}/Cubbie`;

    const filePath = parsedIsCubbieFolderAlreadyExists
    ? `${contentUri.DOWNLOAD_CUBBIE_PATH}%2Fconfig.json.bak`
    : `${baseDir}/config.json.bak`;
    const jsonData = JSON.stringify(response);

    // Write the JSON data to the file
    await RNFS.writeFile(filePath, jsonData, 'utf8', {
      encoding: 'utf8',
      flag: 'w+'
    });
    await RNFS.writeFile(
      parsedIsCubbieFolderAlreadyExists
        ? `${contentUri.DOWNLOAD_CUBBIE_PATH}%2Fconfig.json`
        : `${baseDir}/config.json`,
      jsonData,
      'utf8',
      {
        encoding: 'utf8',
        flag: 'w+'
      }
    );
  } catch (error) {
    console.log(`Error creating or writing the file: ${error}`);
    throw error;
  }
};

const downloadVideoOrAudio = async (fileApiUrl, localFilePath) => {
  try {
    const isFileAlreadyExists = await RNFS.exists(localFilePath)
  if (isFileAlreadyExists) {
    return
  }

  return new Promise(async (resolve, reject) => {
    const options = {
      fromUrl: fileApiUrl,
      toFile: localFilePath,
      background: true,
      discretionary: true,
    }

    try {
      const res = await RNFS.downloadFile(options)
      res.promise
        .then(r => {
          console.log('Video downloaded to:', localFilePath)
          resolve()
        })
        .catch(err => {
          console.log('Error: ', err.message)
          reject(err)
        })
    } catch (error) {
      console.log(error)
    }
  })
  } catch (error) {
    console.log('error', error);
  }
}

const downloadMediaFiles = async (baseApiFileUrl, mediaList, type) => {
  const basePath = `${RNFS.DownloadDirectoryPath}/Cubbie`;
  await createDirectory(basePath);
  const downloads = mediaList.map(async media => {
    const url = `${baseApiFileUrl}${media[`${type}Url`]}`;
    const path = `${basePath}/${media.fileName}`;
    await downloadVideoOrAudio(url, path);
    if (media.thumbnailUrl) {
      const thumbUrl = `${baseApiFileUrl}${media.thumbnailUrl}`;
      const thumbPath = `${basePath}/${media.thumbnailName}`;
      await downloadVideoOrAudio(thumbUrl, thumbPath);
    }
  });
  await Promise.all(downloads);
};

const downloadMediasToLocal = async () => {
  try {
    const isCubbieFolderAlreadyExists =
    await getAsyncStorageItem(ISFILEALREADYEXISTS);
    const parsedIsCubbieFolderAlreadyExists = isCubbieFolderAlreadyExists ? JSON.parse(isCubbieFolderAlreadyExists) : null;
    const baseDir = `${RNFS.DownloadDirectoryPath}/Cubbie`;
    const filePath = parsedIsCubbieFolderAlreadyExists ? `${contentUri.DOWNLOAD_CUBBIE_PATH}%2Fconfig.json.bak` : `${baseDir}/config.json.bak`;
    const data = await RNFS.readFile(filePath);
    const mediaData = JSON.parse(data);

    if (mediaData) {
      const baseApiFileUrl = mediaData?.preferences?.system?.basedFileURL;
      const { video: videos, audio: audios } = mediaData?.medias || {};
      const { video: allPacksVideos, audio: allPacksAudios } =
        mediaData?.allPacks || {};
      console.log('mediaData', mediaData);

      const mediaExists = medias => medias && medias.length > 0;

      if (
        mediaExists(videos) ||
        mediaExists(allPacksVideos) ||
        mediaExists(audios) ||
        mediaExists(allPacksAudios)
      ) {
        await createDirectory(`${baseDir}`);
      }

      if (mediaExists(videos)) {
        await downloadMediaFiles(baseApiFileUrl, videos, 'video');
      }
      if (mediaExists(allPacksVideos)) {
        await downloadMediaFiles(baseApiFileUrl, allPacksVideos, 'video');
      }
      if (mediaExists(audios)) {
        await downloadMediaFiles(baseApiFileUrl, audios, 'audio');
      }
      if (mediaExists(allPacksAudios)) {
        await downloadMediaFiles(baseApiFileUrl, allPacksAudios, 'audio');
      }
    }
  } catch (error) {
    console.log('Failed to download media files:', error);
  }
};

const downloadMedias = async (orgId, cubbieId, pin, isPublic) => {
  store.dispatch(setIsFilesAreDownloading(true));
  let url;
  if (pin != null) {
    url = `mediaBox?orgId=${orgId}&cubbieId=${cubbieId}&pin=${pin}`;
  } else {
    url = `mediaBox?orgId=${orgId}&cubbieId=${cubbieId}`;
  }

  if (isPublic) {
    url = `${url}&isPublicCubbie=${isPublic}`
  }
  try {
    const response = await ApiUtil.getWithoutToken(url);
    if (response.data) {
      await downloadFile(response.data);
      await downloadMediasToLocal();
      store.dispatch(setIsFilesAreDownloading(false));
      return response.data;
    }
    store.dispatch(setIsFilesAreDownloading(false));
    return null;
  } catch (err) {
    store.dispatch(setIsFilesAreDownloading(false));
    console.log(err);
    throw err;
  }
}

export { downloadMedias };

