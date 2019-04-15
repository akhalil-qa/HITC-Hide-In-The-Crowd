var CRYPTO = {

  PRNG: {
    /* seed the PRNG */
    SEED: function (seed) {
      Math.seedrandom(seed);
    },
    /* return random number */
    RANDOM: function () {
      return Math.random();
    },
    /* return random integer in range (inclusive min and max) */
    RANDOM_INT_IN_RANGE: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  },

  HASH: {
    /* output 160-bit (40 hex) hashed output value as hex */
    SHA1: function (input) {
      return CryptoJS.SHA1(input).toString();
    },

    /* output 160-bit (40 hex) hashed output value as hex */
    SHA512: function (input) {
      return CryptoJS.SHA512(input).toString();
    }
  },

  AES: {
    /* AES encryption */
    ENCRYPT: function (key, plaintext) {
      return CryptoJS.AES.encrypt(plaintext, key).toString();
    },

    /* AES decryption. ciphertext as base64. */
    DECRYPT: function (key, ciphertext) {
      return CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
    }
  },

  RSA: {
    /* generate RSA keys */
    GENERATE_KEYS: function (key) {
      return (cryptico.generateRSAKey(key, CONSTANT.CRYPTO.RSA.KEY_LENGTH)).serialize();
    },

    /* get RSA public key from the private key */
    GET_PUBLIC_KEY: function (rsaKey) {
      return cryptico.publicKeyString(cryptico.parse(rsaKey));
    },

    /* RSA encryption. produces ciphertext as base64. */
    ENCRYPT: function (publicKey, plaintext) {
      return cryptico.encrypt(plaintext, publicKey).cipher;
    },

    /* RSA decryption. ciphertext as base64 */
    DECRYPT (rsaKey, ciphertext) {
      return cryptico.decrypt(ciphertext, cryptico.parse(rsaKey)).plaintext;
    }
  },

  HVE: {
    /* setup HVE */
    SETUP (seed) {
      var hve = HVElibrary.hve_setup(CONSTANT.HVE.MAX_FRIENDS, seed);
      return {masterKey: hve[0], publicKey: hve[1]};
    },

    /* generate HVE decryption key */
    GENERATE_DECRYPTION_KEY (hveMasterKey, hvePublicKey, relationshipId) {
      /* construct access vector for user */
      var z = new Array(CONSTANT.HVE.MAX_FRIENDS).fill(0);
      z[relationshipId] = 1;

      return HVElibrary.hve_generate_decryption_key(hveMasterKey, hvePublicKey, z, CONSTANT.HVE.MAX_FRIENDS, CONSTANT.HVE.MAX_WILDCARDS);
    },

    /* HVE encryption */
    ENCRYPT (hvePublicKey, encryptionVector) {
      /* adjust encryption vector [AHMED: to check this with Dr. Spiros] */
      var vector = [];
      for (var i = 0; i < encryptionVector.length; i++)
        vector[i] = encryptionVector[i] + 1;

      var result = HVElibrary.hve_encrypt(hvePublicKey, vector, CONSTANT.HVE.MAX_FRIENDS, CONSTANT.HVE.MAX_WILDCARDS);
      return {plaintext: result[0], ciphertext: result[1]};
    },

    /* HVE decryption */
    DECRYPT (decryptionKey, ciphertext, encryptionVector) {
      /* adjust encryption vector [AHMED: to check this with Dr. Spiros] */
      var vector = [];
      for (var i = 0; i < encryptionVector.length; i++)
        vector[i] = encryptionVector[i] + 1;

      return HVElibrary.hve_decrypt(decryptionKey, ciphertext, vector, CONSTANT.HVE.MAX_WILDCARDS);
    }
  },

  /* concatenate array of strings */
  CONCAT: function (inputs) {
    return JSON.stringify(inputs);
  },

  /* de-concatenate string and return it as array of strings */
  DE_CONCAT: function (input) {
    try {
      return JSON.parse(input);
    }
    catch (err) {
      return null;
    }
  }
};
