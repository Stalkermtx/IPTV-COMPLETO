import CryptoJS from 'crypto-js';

const SECRET_KEY = 'conextv-evolution-secret-key-2026';

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (ciphertext: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return '';
  }
};

export interface EvolutionConfig {
  url: string;
  apiKey: string;
}

export const createInstance = async (config: EvolutionConfig, instanceName: string) => {
  const response = await fetch(`${config.url}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });
  if (!response.ok) throw new Error('Failed to create instance');
  return response.json();
};

export const fetchInstanceStatus = async (config: EvolutionConfig, instanceName: string) => {
  const response = await fetch(`${config.url}/instance/connectionState/${instanceName}`, {
    headers: { 'apikey': config.apiKey },
  });
  if (!response.ok) throw new Error('Failed to fetch instance status');
  return response.json();
};

export const connectInstance = async (config: EvolutionConfig, instanceName: string) => {
  const response = await fetch(`${config.url}/instance/connect/${instanceName}`, {
    headers: { 'apikey': config.apiKey },
  });
  if (!response.ok) throw new Error('Failed to connect instance');
  return response.json();
};

export const fetchContacts = async (config: EvolutionConfig, instanceName: string) => {
  // Evolution API endpoint for fetching contacts might be /chat/findContacts or similar
  // We'll use a generic approach assuming standard Evolution API v2 endpoints
  const response = await fetch(`${config.url}/chat/findContacts/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({ where: {} }),
  });
  if (!response.ok) throw new Error('Failed to fetch contacts');
  return response.json();
};

export const fetchGroups = async (config: EvolutionConfig, instanceName: string) => {
  const response = await fetch(`${config.url}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
    headers: { 'apikey': config.apiKey },
  });
  if (!response.ok) throw new Error('Failed to fetch groups');
  return response.json();
};

export const sendTextMessage = async (
  config: EvolutionConfig,
  instanceName: string,
  number: string,
  text: string
) => {
  const response = await fetch(`${config.url}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({
      number,
      options: {
        delay: 1200,
        presence: 'composing',
      },
      textMessage: {
        text,
      },
    }),
  });
  if (!response.ok) throw new Error('Failed to send text message');
  return response.json();
};

export const sendMediaMessage = async (
  config: EvolutionConfig,
  instanceName: string,
  number: string,
  mediaUrl: string,
  caption: string,
  mediaType: 'image' | 'video' | 'audio'
) => {
  const endpoint = mediaType === 'audio' ? 'sendWhatsAppAudio' : 'sendMedia';
  const response = await fetch(`${config.url}/message/${endpoint}/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({
      number,
      options: {
        delay: 1200,
        presence: 'composing',
      },
      mediaMessage: {
        mediatype: mediaType,
        caption: caption,
        media: mediaUrl,
      },
    }),
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
};
