// Webserver
import { BridgeServer } from 'react-native-http-bridge-refurbished';
import TcpSocket from 'react-native-tcp-socket';
import { storagekeys } from '../contants';
import { removeAsyncStorageItem, setAsyncStorageItem } from '../utils';
import { executeCommand, heartBeat, getImage } from './controller';
import { addSessionData, sendDefaultValues } from './service';

const server = new BridgeServer('http_service', true);

const { SERVER_STATUS_KEY, MEDIAMANAGER, LIGHTMANAGER } = storagekeys;

const connectedClients = [];

const socketServer = TcpSocket.createServer(async socket => {
  console.log('Client connected');

  // Add the new socket to the list of connected clients
  connectedClients.push(socket);

  socket.on('data', async data => {
    const message = data.toString('utf8');
    console.log('Received:', message);

    if (message && JSON.parse(message).type === 'register') {
      const storageKey =
        JSON.parse(message).clientType === 'mediaManager'
          ? MEDIAMANAGER
          : JSON.parse(message).clientType === 'lightManager'
            ? LIGHTMANAGER
            : null

      if (storageKey) {
        const index = connectedClients.indexOf(socket);
        connectedClients[index].storageKey = storageKey;
        await setAsyncStorageItem(storageKey, message);
      }
      if (connectedClients.findIndex(ele => ele.storageKey === storageKey) !== -1) {
        sendDefaultValues(message);
      }
    }

    if (message && JSON.parse(message).type === 'sessionData') {
      addSessionData(JSON.parse(message));
    }
  });

  socket.on('error', error => {
    console.log('Socket error:', error);
  });

  socket.on('close', async () => {
    console.log('Client disconnected');

    // Remove the disconnected socket from the list
    const index = connectedClients.indexOf(socket);
    if (index !== -1) {
      connectedClients.splice(index, 1);
      if (connectedClients[index]?.storageKey) {
        await removeAsyncStorageItem(connectedClients[index].storageKey);
      }
    }
  });
});

const sendMessage = message => {
  if (connectedClients.length > 0) {
    connectedClients.forEach(client => {
      client.write(message);
    });
  } else {
    console.log('Socket not available');
  }
};

const startServer = async () => {
  server.get('/', async (req, res) => {
    res.json({ message: 'OK' });
  });

  server.get('/api/heartbeat', heartBeat);

  server.post('/api/execute', executeCommand);

  server.post('/api/image', getImage);

  server.listen(8080);
  console.log('HTTP server listening on port 8080');

  try {
    socketServer.listen({ port: 3000 }, () => {
      console.log('WebSocket server is listening on port 3000');
    });
  } catch(err) {
    console.log('Error', err);
  }


  await setAsyncStorageItem(SERVER_STATUS_KEY, 'running');
};

const stopServer = async () => {
  console.log('Stopping servers');
  server.stop();
  await setAsyncStorageItem(SERVER_STATUS_KEY, 'stopped');
};

export { sendMessage, startServer, stopServer };

