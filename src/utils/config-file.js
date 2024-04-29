// Config media
import RNFS from 'react-native-fs';

export const configDownloadFile = async (url, savePath) => {
  try {
    const response = await RNFS.downloadFile({
      fromUrl: url,
      toFile: savePath
    });

    if (response.statusCode === 200) {
      return { statusCode: response.statusCode, error: '' };
    } else {
      return {
        statusCode: response.statusCode,
        error: 'Failed to download file'
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      error: 'Error downloading file'
    };
  }
};
