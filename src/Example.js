import {NativeModules} from 'react-native';

const {Example} = NativeModules;
console.log("NativeModules", NativeModules);
console.log("Example", Example);
export default Example;