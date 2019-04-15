var CONSTANT = {

  GENERAL: {
    PROJECT_NAME: "HITC"
  },

  DATA_LENGTH: {
    RSEncodedPublicKeyLengthInBits: 20, /* maximum length of RSA public key after RS encoding, represented in binary */
    RSEncodedSenderTokenInBits: 20, /* maximum length of sender token, represented in binary */
    RSEncodedReceiverTokenInBits: 20, /* maximum length of receiver token, represented in binary */
    DataLengthInBits: 26 /* maximum length of data (AESsharedKey(accessVector)||HVE(key)||AESkey(secret)), represented in binary, that can be embedded into an image */
  },

  CRYPTO: {
    RSA: {
      KEY_LENGTH: 2048 /* allowed values are: 512, 1024, 2048, 4096, 8192 */
    }
  },

  HVE: {
    MAX_FRIENDS: 500,
    MAX_WILDCARDS: 20
  },

  IMAGE: {
    RED_CHANNEL: 0,
    GREEN_CHANNEL: 1,
    BLUE_CHANNEL: 2,
    ALPHA_CHANNEL: 3,
    PIXEL_LENGTH: 4
  },

  IMAGE_STEGANOGRAPHY: {
    DCT: {
      QUALITY_FACTOR: 85, /* allowed value range is: 0-100 */
      BLOCK_SIZE: 64, /* size of dct block is 8 * 8 = 64 */
      MAX_USED_LSBS: 1 /* e.g. 1 = only LSB will be used for embedding data. 2 = LSB and 2nd LSB will be used. */
    },

    PIXEL: {
      BITS_USED: 4 /* max. bit that will be used to emed data into (e.g. BIT_USED = 4, means one of the 4 LSBs will be used to embed data into) */
    }
  },

  FEC: {
    REED_SOLOMON: {
      K: 10, /* message size */
      T: 10 /* parity size. RS will correct up to T/2 errors. */
    }
  },

  TWITTER: {
    CONSUMER_KEY: "YGO4oblZBlGiZ0TbxDT4QxVKs",
    CONSUMER_SECRET: "CU42PtsIg6yqwGuVWv4WFylyQGbYisUSfWbUkJjbEaHjoPSBMO",
    CODEBIRD_PROXY: "https://akhalil.blog/DPOSN/codebird-cors-proxy/codebird-cors-proxy.php",
    OAUTH_TOKEN: "OAuthToken",
    OAUTH_TOKEN_SECRET: "OAuthTokenSecret"
  },

  ITEMS: {
    USER_ENTITY: "UserEntity",
    HASH_PASSWORD: "HashPassword",
    RSA_PUBLIC_KEY: "RsaPublicKey",
    RSA_PRIVATE_KEY: "RsaPrivateKey",
    SHARED_KEY: "SharedKey",
    SECRET_TOKEN: "SecretToken",
    RECEIVER_TOKENS: "ReceiverTokens",
    SENDER_TOKENS: "SenderTokens",
    HVE_PUBLIC_KEY: "HvePublicKey",
    HVE_MASTER_KEY: "HveMasterKey",
    HVE_DECRYPTION_KEY: "HveDecryptionKey"
  },

  UI: {
    CURRENT_SCREEN: "CurrentScreen",
    ACCESS_REQUESTED: "AccessRequested"
  },

  BOOLEAN: {
    TRUE: "True",
    FALSE: "False"
  },

  SECRET_TYPE: {
    TEXT: "secretText",
    IMAGE: "secretImage",
    FILE: "secretFile"
  },

  /* content script request messages */
  MESSAGE: {
    RETRIEVE_LOCAL_STORAGE: "RetrieveLocalStorage",
    STORE_LOCAL_STORAGE: "StoreLocalStorage"
  }
};
