import { checkWebServer, executeUserCommand, getBase64Thumbnail } from './service';
import { setAsyncStorageItem } from '../utils';
import { storagekeys } from '../contants';

const { TAKE_CONTROL } = storagekeys;

const heartBeat = (req, res) => {
  try {
    const response = checkWebServer();
    res.json(response);
  } catch (err) {
    console.log(err);
    return res.send(500, '', JSON.stringify(err));
  };
};

const executeCommand = async (req, res) => {
  try {
    const data = JSON.parse(req.postData);

    if (data.length > 0) {
      data[0].takeControl = false;
    }

    if (
      data.length > 0 &&
      data[0]?.args?.id !== 1 &&
      (data[0]?.component == 'audio' ||
        data[0]?.component == 'video' ||
        data[0]?.component == 'light')
    ) {
      data[0].takeControl = true;
    }
    const response = await executeUserCommand(data);
    // sendMessage('JSON.stringify(response)');
    res.json(response);
  } catch (err) {
    console.log('err', err);
    return res.send(500, '', JSON.stringify(err));
  };
};

const getImage = async (req, res) => {
  try {
    const data = req.postData;
    console.log('getImage', data, req.url);
    const response = await getBase64Thumbnail(JSON.parse(data));
    res.json(response);
  } catch (err) {
    console.log('err', err);
    return res.send(500, '', 'File does not exists');
  };
};

export { executeCommand, heartBeat, getImage };
