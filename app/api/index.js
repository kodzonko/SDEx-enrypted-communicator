/* global fetch:false */
import firebaseService from 'app/environments/firebase';
import utils from 'app/utils/string';

const FIREBASE_REF_SERVICES = firebaseService.database().ref('Configuration/services');
const FIREBASE_REF_USERS = firebaseService.database().ref('Users');

const { formattedVideoKey } = utils;

const getUrl = ({ search, page, limit }) =>
  `https://api.vimeo.com/videos?per_page=${limit}&query=${formattedVideoKey(search)}&page${page}`;

export const sendPushNotification = payload =>
  FIREBASE_REF_SERVICES.child('push').on('value', snapshot => {
    fetch(snapshot.val(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...payload
      })
    });
  });

export const getUser = id =>
  new Promise((resolve, reject) =>
    FIREBASE_REF_USERS.child(id).on(
      'value',
      snapshot => {
        resolve(snapshot.val());
      },
      errorObject => {
        reject(errorObject.message);
      }
    )
  );

export const getVideos = ({ search, page, limit }) =>
  fetch(getUrl({ search, page, limit }), {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Bearer 4035a4270e2ad14cdb3935d5625204b6'
    }
  })
    .then(response => response.json())
    .catch(error => new Error(error));
