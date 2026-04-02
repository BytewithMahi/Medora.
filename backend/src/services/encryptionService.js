/**
 * End-To-End Encryption (E2EE) helper.
 * 
 * IMPORTANT: In a true E2EE architecture, the backend never encrypts or decrypts.
 * It strictly acts as a router for opaque encrypted payloads while the clients manage keys.
 * 
 * This service ensures that the payload conforms to the expected E2EE wrapper format.
 */
const validateEncryptedPayload = (payload) => {
  if (!payload || !payload.encryptedText) {
    throw new Error('Missing E2EE encrypted content');
  }

  return {
    encryptedText: payload.encryptedText,
    iv: payload.iv || null,
    salt: payload.salt || null,
    timestamp: new Date().toISOString()
  };
};

module.exports = { validateEncryptedPayload };
