// frontend/index.js
import { registerRootComponent } from 'expo';
import App from './src/App';

// registerRootComponent calls AppRegistry.registerComponent for you.
// It also ensures that you render the top-level component in the Expo Go app.
registerRootComponent(App);

process.env.PROJECT_ID
console.log('App has been registered successfully.');