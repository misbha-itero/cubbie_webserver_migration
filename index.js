// Index
import { AppRegistry } from 'react-native';

import App from './src/app';
import { name as appName } from './app.json';
import store from './src/state/store';
import { Provider } from 'react-redux';
import { startServer, stopServer } from './src/server';
import BackgroundService from 'react-native-background-actions';
import Example from './src/Example';

const Root = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
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

const startBackgroundServer = async () => {
  const isBackgroundServerRunning = await Example.isServiceRunning();
  // const isBackgroundServerRunning = BackgroundService.isRunning();
  console.log('isBackgroundServerRunning', isBackgroundServerRunning);
  try {
    if (!isBackgroundServerRunning) {
      // await BackgroundService.start(veryIntensiveTask, options);
      // await BackgroundService.updateNotification({
      //   taskDesc: ''
      // });
      await Example.startService()
      console.log('isBackgroundServerRunning - 1', isBackgroundServerRunning);

      const intervalId = setInterval(async () => {
        console.log('isBackgroundServerRunning - 2', isBackgroundServerRunning);
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

const ExampleTask = async () => {
  console.log('Receiving Example Event!---------------------------------------------------');
  const isBackgroundServerRunning = await Example.isServiceRunning();
  const isServerRunning = await getServerStatus();
  console.log('ExampleTask', isBackgroundServerRunning, isServerRunning);
  if (!isBackgroundServerRunning) {
    await startBackgroundServer();
  } else if (!isServerRunning) {
    await startServer()
  }
  console.log('Processed Example Event!---------------------------------------------------');
};

AppRegistry.registerHeadlessTask('Example', () => ExampleTask);
AppRegistry.registerComponent(appName, () => Root);
