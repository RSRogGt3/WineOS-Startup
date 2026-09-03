/**
 * Google Picker API Service
 * Implements client-side Google Picker widget using OAuth 2.0 Access Token.
 * Note: Uses OAuth access token directly without developer key as required.
 */
import { getAccessToken, googleSignIn } from './auth';

export interface PickedFile {
  id: string;
  name: string;
  description?: string;
  mimeType: string;
  sizeBytes?: number;
  url: string;
  iconUrl?: string;
  lastEditedUtc?: number;
  embedUrl?: string;
  serviceId?: string;
}

export interface OpenPickerOptions {
  token?: string;
  title?: string;
  allowMultiSelect?: boolean;
  onPick: (files: PickedFile[]) => void;
  onCancel?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Loads the Google API client script and initializes the 'picker' module.
 */
export const loadPickerLibrary = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window object is not available'));
    }

    const win = window as any;

    // Check if picker is already initialized
    if (win.google && win.google.picker && win.google.picker.PickerBuilder) {
      return resolve();
    }

    const onGapiReady = () => {
      if (!win.gapi) {
        return reject(new Error('gapi is not defined'));
      }

      win.gapi.load('picker', {
        callback: () => {
          if (win.google && win.google.picker && win.google.picker.PickerBuilder) {
            resolve();
          } else {
            reject(new Error('Google Picker API failed to initialize properly'));
          }
        },
        onerror: () => reject(new Error('Failed to load Google Picker module via gapi.load')),
      });
    };

    if (win.gapi) {
      onGapiReady();
    } else {
      let checkAttempts = 0;
      const timer = setInterval(() => {
        checkAttempts++;
        if (win.gapi) {
          clearInterval(timer);
          onGapiReady();
        } else if (checkAttempts > 35) {
          clearInterval(timer);
          // If script tag wasn't present, try dynamic injection
          const existingScript = document.querySelector('script[src*="apis.google.com/js/api.js"]');
          if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.defer = true;
            script.onload = () => onGapiReady();
            script.onerror = () => reject(new Error('Failed to load Google API client script'));
            document.head.appendChild(script);
          } else {
            reject(new Error('Timeout waiting for Google API client (gapi)'));
          }
        }
      }, 150);
    }
  });
};

/**
 * Opens the Google Picker dialog.
 * If no token is provided, attempts to retrieve from auth service or prompt sign-in.
 */
export const openGooglePicker = async (options: OpenPickerOptions): Promise<void> => {
  try {
    // 1. Ensure Google Picker API library is loaded
    await loadPickerLibrary();

    const win = window as any;
    const google = win.google;

    if (!google || !google.picker) {
      throw new Error('Google Picker API is unavailable');
    }

    // 2. Resolve Access Token
    let token = options.token;
    if (!token) {
      token = (await getAccessToken()) || undefined;
    }

    if (!token) {
      const signInResult = await googleSignIn();
      if (!signInResult || !signInResult.accessToken) {
        if (options.onCancel) options.onCancel();
        return;
      }
      token = signInResult.accessToken;
    }

    // 3. Determine Origin as specified in workspace integration skill
    const pickerOrigin =
      win.location.ancestorOrigins && win.location.ancestorOrigins.length > 0
        ? win.location.ancestorOrigins[win.location.ancestorOrigins.length - 1]
        : win.location.origin;

    // 4. Callback Handler
    const pickerCallback = (data: any) => {
      if (data.action === google.picker.Action.PICKED) {
        const docs: PickedFile[] = (data.docs || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          description: doc.description || '',
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes ? Number(doc.sizeBytes) : undefined,
          url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
          iconUrl: doc.iconUrl,
          lastEditedUtc: doc.lastEditedUtc ? Number(doc.lastEditedUtc) : undefined,
          embedUrl: doc.embedUrl,
          serviceId: doc.serviceId,
        }));
        options.onPick(docs);
      } else if (data.action === google.picker.Action.CANCEL) {
        if (options.onCancel) {
          options.onCancel();
        }
      }
    };

    // 5. Build Picker
    const builder = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS)
      .setOAuthToken(token)
      .setCallback(pickerCallback)
      .setOrigin(pickerOrigin);

    if (options.title) {
      builder.setTitle(options.title);
    }

    if (options.allowMultiSelect) {
      builder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
    }

    const picker = builder.build();
    picker.setVisible(true);
  } catch (err: any) {
    console.error('Error opening Google Picker:', err);
    if (options.onError) {
      options.onError(err instanceof Error ? err : new Error(String(err)));
    } else {
      throw err;
    }
  }
};
