/**
 * Encryption Utilities for Medora Chat (Medora*)
 * Uses SublteCrypto API for client-side encryption.
 */

// Simple helper to convert string to ArrayBuffer
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive a Cryptographic Key from a Password
async function deriveKey(password: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // We use a static salt for simplicity (In real App, use dynamic salt pre-pended, but this fits the constraint)
  const salt = textEncoder.encode("medora-salt-constant"); 

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a message string with a password using AES-GCM.
 * Returns a base64 encoded string containing IV + ciphertext.
 */
export async function encryptMessage(message: string, passkey: string): Promise<string> {
  try {
    const key = await deriveKey(passkey);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      textEncoder.encode(message)
    );

    // Combine IV and encrypted buffer
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return bufferToBase64(combined.buffer);
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypts a base64 string (IV + ciphertext) with a password using AES-GCM.
 */
export async function decryptMessage(encryptedBase64: string, passkey: string): Promise<string> {
  try {
    const key = await deriveKey(passkey);
    const combined = new Uint8Array(base64ToBuffer(encryptedBase64));

    // Extract IV (first 12 bytes) and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext.buffer
    );

    return textDecoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Decryption failed");
  }
}
