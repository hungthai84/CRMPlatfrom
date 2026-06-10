/**
 * Google Picker Library Integration
 * Handles initialization of GAPI and showing the picker.
 */

import firebaseConfig from '../../firebase-applet-config.json';
import { cachedAccessToken } from './firebase';

const API_KEY = firebaseConfig.apiKey;
const APP_ID = firebaseConfig.projectId;

let pickerApiLoaded = false;

/**
 * Load the Google Picker API
 */
export const loadPickerApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (pickerApiLoaded) return resolve();

    // Check if gapi is loaded (via index.html script tag)
    const gapi = (window as any).gapi;
    if (!gapi) {
      return reject(new Error('Google API client not found. Ensure script is in index.html'));
    }

    gapi.load('picker', {
      callback: () => {
        pickerApiLoaded = true;
        resolve();
      }
    });
  });
};

interface PickerResult {
  action: string;
  docs?: any[];
}

/**
 * Show the Google Picker
 */
export const showPicker = async (onSelect: (docs: any[]) => void): Promise<void> => {
  try {
    await loadPickerApi();
    
    if (!cachedAccessToken) {
      throw new Error('No access token available. Please sign in with Google first.');
    }

    const gapi = (window as any).gapi;
    const google = (window as any).google;

    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(cachedAccessToken)
      .setDeveloperKey(API_KEY)
      .setAppId(APP_ID) // Note: Using project ID as appId might work or might need real App Id
      .setCallback((data: PickerResult) => {
        if (data.action === google.picker.Action.PICKED) {
          onSelect(data.docs || []);
        }
      })
      .build();

    picker.setVisible(true);
  } catch (error) {
    console.error('Error showing picker:', error);
    throw error;
  }
};
