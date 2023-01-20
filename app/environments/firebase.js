import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const config = {
  apiKey: 'AIzaSyARWm6SZ4yT9X_IUTKvY7YQb7zPKBNocLU',
  authDomain: 'pulse-dd380.firebaseapp.com',
  databaseURL: 'https://pulse-dd380.firebaseio.com',
  projectId: 'pulse-dd380',
  storageBucket: 'pulse-dd380.appspot.com',
  messagingSenderId: '398153396241'
};

let instance = null;

class FirebaseService {
  constructor() {
    if (!instance) {
      this.app = firebase.initializeApp(config);
      instance = this;
    }
    return instance;
  }
}

const firebaseService = new FirebaseService().app;
export default firebaseService;
