var OPERATION = {

  /* opens twitter authorization page and store twitter OAuth tokens in storage area */
  AUTHENTICATE: function (callback) {
    /* authenticate using twitter */
    INTEGRATION_TWITTER.AUTHENTICATE(function(oauthToken, oauthTokenSecret) {
      /* if authentication failed */
      if (oauthToken == null) {
        STORAGE.CLEAR(CONSTANT.TWITTER.OAUTH_TOKEN);
        STORAGE.CLEAR(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET);
        callback(false);
        return;
      }
      /* store OAuth tokens */
      STORAGE.STORE(CONSTANT.TWITTER.OAUTH_TOKEN, oauthToken);
      STORAGE.STORE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET, oauthTokenSecret);
      callback(true);
    });
  },

  /* authorize twitter account by supplying authroization pincode */
  AUTHORIZE: function (pin, callback) {
    /* authorize using twitter */
    INTEGRATION_TWITTER.AUTHORIZE(pin, STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN), STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET), function(oauthToken, oauthTokenSecret){
      /* if authorization failed */
      if (oauthToken == null) {
        callback(false)
        return;
      }

      /* clear old data in local storage area */
      STORAGE.CLEAR_ALL();

      /* store OAuth tokens */
      STORAGE.STORE(CONSTANT.TWITTER.OAUTH_TOKEN, oauthToken);
      STORAGE.STORE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET, oauthTokenSecret);

      /* get user entity */
      INTEGRATION_TWITTER.GET_USER_ENTITY(STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN), STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET), function(userEntity){
        /* store user entity */
        STORAGE.STORE(CONSTANT.ITEMS.USER_ENTITY, userEntity);

        callback(true);
      });
    });
  },

  /* register user */
  REGISTER: function (userId, password, secretPhrase, hashtag, coverImage, callback) {
    /* hash the password */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var h_password = CRYPTO.HASH.SHA1(password);
    console.log("password hashing: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* generate RSA public/private keys */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var rsaKey = CRYPTO.RSA.GENERATE_KEYS(h_password);
    var publicKey = CRYPTO.RSA.GET_PUBLIC_KEY(rsaKey);

    console.log("rsa key generation: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* embed public key into the cover image */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT

    /* FEC encoding */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var data = FEC.REED_SOLOMON.ENCODE(publicKey);
    console.log("FEC encoding: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* get size of data in bits */
    var dataLength = CONVERT.DECIMAL_TO_BINARY(data.length, CONSTANT.DATA_LENGTH.RSEncodedPublicKeyLengthInBits);

    /* append the size of the data at the start */
    data = dataLength + data;

    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var stegoImageDataURL = IMAGE_STEGANOGRAPHY.PIXEL.EMBED(data, secretPhrase, coverImage);
    console.log("steganography: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* [DEBUGGING: download the image locally without the need to upload it to Twitter]
    function downloadURI(uri, name) {
      var link = document.createElement("a");
      link.download = name;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      delete link;
    }
    downloadURI(stegoImageDataURL, "local.jpg");
    */

    /* tweet the stego image with the selected hashtag */
    INTEGRATION_TWITTER.POST_TWEET(STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN), STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET), hashtag, stegoImageDataURL, function(response){
      callback(response);
    });
  },

  /* login user */
  LOGIN: function (password, secretPhrase, hashtag, callback) {
    /* hash the password */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var h_password = CRYPTO.HASH.SHA1(password);
    console.log("password hashing: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* generate RSA public/private keys */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var rsaKey = CRYPTO.RSA.GENERATE_KEYS(h_password);
    var publicKey = CRYPTO.RSA.GET_PUBLIC_KEY(rsaKey);
    console.log("rsa key generation: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* generate hve master/public keys */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var hve = CRYPTO.HVE.SETUP(h_password);
    console.log("hve.setup: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* generate hve decryption key (to decrpyt data encrypted by himself!) */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var hveDecryptionKey = CRYPTO.HVE.GENERATE_DECRYPTION_KEY(hve.masterKey, hve.publicKey, 0);
    console.log("self-decryption key: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* generate AES shared key */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var sharedKey = CRYPTO.HASH.SHA1(userId+password);
    console.log("AES secret key generation: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* get image where public key is embedded */
    var query = "#"+hashtag+" from:"+STORAGE.RETRIEVE(CONSTANT.ITEMS.USER_ENTITY).screen_name+" filter:twimg";

    INTEGRATION_TWITTER.SEARCH(STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN), STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET), query, function(tweets){
      /* check if tweet that match the search query found */
      if (tweets.length == 0) {
        console.log("No image found while searching for a tweet with hashtag [" + hashtag + "].");
        callback(null);
        return;
      }

      /* get the url of the image of the tweet */
      var imageUrl = tweets[0].entities.media[0].media_url_https;

      /* read the image */
      var image = document.createElement("img");
      image.onload = function(){
        /* extract data from the image */
        var time1 = performance.now(); // PERFORMANCE MEASUREMENT
        var extractedData = IMAGE_STEGANOGRAPHY.PIXEL.EXTRACT(image, secretPhrase);
        console.log("public key extraction: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT


        /* read data length */
        var dataLengthInBits = extractedData.substring(0, CONSTANT.DATA_LENGTH.RSEncodedPublicKeyLengthInBits);
        var dataLength = CONVERT.BINARY_TO_DECIMAL(dataLengthInBits);

        /* extract RS encoded public key */
        var extractedPublicKey = extractedData.substring(CONSTANT.DATA_LENGTH.RSEncodedPublicKeyLengthInBits, CONSTANT.DATA_LENGTH.RSEncodedPublicKeyLengthInBits+dataLength);

        /* FEC decoding */
        var time1 = performance.now(); // PERFORMANCE MEASUREMENT
        extractedPublicKey = FEC.REED_SOLOMON.DECODE(extractedPublicKey);
        console.log("FEC decoding: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT


        /* verify public key */
        if (extractedPublicKey != publicKey) {
          console.log("Failed to verify public key.");
          callback(null);
          return;
        }

        /* store data locally */
        var time1 = performance.now(); // PERFORMANCE MEASUREMENT
        STORAGE.STORE(CONSTANT.ITEMS.HASH_PASSWORD, h_password);
        STORAGE.STORE(CONSTANT.ITEMS.RSA_PUBLIC_KEY, publicKey);
        STORAGE.STORE(CONSTANT.ITEMS.RSA_PRIVATE_KEY, rsaKey);
        STORAGE.STORE(CONSTANT.ITEMS.SHARED_KEY, sharedKey);
        STORAGE.STORE(CONSTANT.ITEMS.HVE_PUBLIC_KEY, hve.publicKey);
        STORAGE.STORE(CONSTANT.ITEMS.HVE_MASTER_KEY, hve.masterKey);
        STORAGE.STORE(CONSTANT.ITEMS.HVE_DECRYPTION_KEY, hveDecryptionKey);
        console.log("stores data locally: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

        callback(true);
      };
      image.src = imageUrl;
    });
  },

  /* establish relationship with a user */
  ESTABLISH_RELATIONSHIP: function (senderId, receiverId, secretPhrase, hashtag, h_password, coverImage, hveMasterKey, hvePublicKey, sharedKey, relationshipId, callback) {
    /* generate decryption key */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var decryptionKey = CRYPTO.HVE.GENERATE_DECRYPTION_KEY(hveMasterKey, hvePublicKey, relationshipId);
    console.log("decryption key generation: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* construct sender token: AES_h(password)(receiverId||relationshipId) */
    var time1 = performance.now(); // PERFORMANCE MEASUREMENT
    var senderToken = CRYPTO.AES.ENCRYPT(h_password, CRYPTO.CONCAT([receiverId, relationshipId]));
    console.log("sender token construction: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

    /* get tweet with entered hashtag posted by the recevier user */
    var query = "#"+hashtag+" from:"+receiverId+" filter:twimg";
    INTEGRATION_TWITTER.SEARCH(STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN), STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET), query, function(tweets){
      /* check if receiver user have tweet with an image */
      if (tweets.length == 0) {
        callback(null);
        return;
      }

      /* get image url of most recent tweet */
      var imageUrl = tweets[0].entities.media[0].media_url_https;

      /* read the image */
      var image = document.createElement("img");
      image.onload = function(){
        /* extract data from the image */
        var time1 = performance.now(); // PERFORMANCE MEASUREMENT
        var extractedData = IMAGE_STEGANOGRAPHY.PIXEL.EXTRACT(image, secretPhrase);
        console.log("receiver's public key extraction: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT


        /* read data length */
        var dataLengthInBits = extractedData.substring(0, CONSTANT.DATA_LENGTH.RSEncodedPublicKeyLengthInBits);
        var dataLength = CONVERT.BINARY_TO_DECIMAL(dataLengthInBits);

        /* extract RS encoded public key */
        var extractedReceiverPublicKey = extractedData.substring(CONSTANT.DATA_LENGTH.RSEncodedPublicKeyLengthInBits, CONSTANT.DATA_LENGTH.RSEncodedPublicKeyLengthInBits+dataLength);

        /* FEC decoding */
        var time1 = performance.now(); // PERFORMANCE MEASUREMENT
        extractedReceiverPublicKey = FEC.REED_SOLOMON.DECODE(extractedReceiverPublicKey);
        console.log("FEC decoding: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

        /* construct receiver token = RSA_receiverPublicKey(senderId||receiverId||relationshipId||decryptionKey||sharedKey) */
        var time1 = performance.now(); // PERFORMANCE MEASUREMENT
        var receiverToken = CRYPTO.RSA.ENCRYPT(extractedReceiverPublicKey, CRYPTO.CONCAT([senderId, receiverId, relationshipId, decryptionKey, sharedKey]));
        console.log("receiver token construction: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

        /* FEC encoding */
        var time1 = performance.now(); // PERFORMANCE MEASUREMENT
        senderToken = FEC.REED_SOLOMON.ENCODE(senderToken);
        receiverToken = FEC.REED_SOLOMON.ENCODE(receiverToken);
        console.log("FEC encoding: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT


        /* get size of data in bits */
        var senderTokenDataLength = CONVERT.DECIMAL_TO_BINARY(senderToken.length, CONSTANT.DATA_LENGTH.RSEncodedSenderTokenInBits);
        var receiverTokenDataLength = CONVERT.DECIMAL_TO_BINARY(receiverToken.length, CONSTANT.DATA_LENGTH.RSEncodedReceiverTokenInBits);

        /* append the size of the data at the start */
        senderToken = senderTokenDataLength + senderToken;
        receiverToken = receiverTokenDataLength + receiverToken;

        /* embed tokens into the cover image and tweet it by mentioning the receiver user */
        var time1 = performance.now(); // PERFORMANCE MEASUREMENT
        var stegoImageDataURL = IMAGE_STEGANOGRAPHY.PIXEL.EMBED_IN_BLOCK(senderToken, h_password, coverImage, 0, 2);
        var tmpImage = new Image();
        tmpImage.onload = function() {
          var finalStegoImageDataURL = IMAGE_STEGANOGRAPHY.PIXEL.EMBED_IN_BLOCK(receiverToken, CRYPTO.HASH.SHA1(extractedReceiverPublicKey), tmpImage, 1, 2);
          console.log("image steganography: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

          /* tweet the stego image and mention the receiver user */
          INTEGRATION_TWITTER.POST_TWEET(STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN), STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET), "@"+receiverId, finalStegoImageDataURL, function(response){
            callback(response);
          });
        };
        tmpImage.src = stegoImageDataURL;
      };
      image.src = imageUrl;
    });
  },

  /* refresh relationships */
  REFRESH_RELATIONSHIPS: function (userId, h_password, rsaPublicKey, rsaPrivateKey, callback) {

    callback("Searching and Fetching Relationships ...");

    /* read receiver relationships information */
    /* get tweets where the user is mentioned by others */
    var query = "@"+userId + " filter:twimg";
    INTEGRATION_TWITTER.SEARCH(STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN), STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET), query, function(tweets){
      console.log(tweets); // AHMED

      /* if user is not mentioned by other users */
      if (tweets.length == 0) {
        console.log("Not able to get any tweet to check for receiver tokens.");
        return;
      }

      for (var i = 0; i < tweets.length; i++) {
        var imageUrl = tweets[i].entities.media[0].media_url_https;
        var image = document.createElement("img");
        image.onload = function(){

          /* extract embedded receiver token */
          var time1 = performance.now(); // PERFORMANCE MEASUREMENT
          var extractedData = IMAGE_STEGANOGRAPHY.PIXEL.EXTRACT_FROM_BLOCK(image, CRYPTO.HASH.SHA1(rsaPublicKey), 1, 2);
          console.log("steganography receiver token extraction: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

          /* read data length */
          var dataLengthInBits = extractedData.substring(0, CONSTANT.DATA_LENGTH.RSEncodedReceiverTokenInBits);
          var dataLength = CONVERT.BINARY_TO_DECIMAL(dataLengthInBits);

          /* extract RS encoded receiver token */
          var extractedReceiverToken = extractedData.substring(CONSTANT.DATA_LENGTH.RSEncodedReceiverTokenInBits, CONSTANT.DATA_LENGTH.RSEncodedReceiverTokenInBits+dataLength);

          /* FEC decoding */
          var time1 = performance.now(); // PERFORMANCE MEASUREMENT
          var decodedReceiverToken = FEC.REED_SOLOMON.DECODE(extractedReceiverToken);
          console.log("FEC decoding: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT


          /* decrypt and read receiver relationship token information */
          var time1 = performance.now(); // PERFORMANCE MEASUREMENT
          var decryptedReceiverToken = CRYPTO.DE_CONCAT(CRYPTO.RSA.DECRYPT(rsaPrivateKey, decodedReceiverToken));
          console.log("receiver token decryption: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

          var time1 = performance.now(); // PERFORMANCE MEASUREMENT
          var receiverToken = new Object();
          receiverToken.senderId = decryptedReceiverToken[0];
          receiverToken.receiverId = decryptedReceiverToken[1];
          receiverToken.relationshipId = decryptedReceiverToken[2];
          receiverToken.decryptionKey = decryptedReceiverToken[3];
          receiverToken.sharedKey = decryptedReceiverToken[4];

          /* get receiver tokens from storage area */
          var storedReceiverTokens = STORAGE.RETRIEVE(CONSTANT.ITEMS.RECEIVER_TOKENS);

          /* if not found in storage area, create one */
          if (!storedReceiverTokens)
            storedReceiverTokens = [];

          /* check if found reciever token is already stored */
          for (var i = 0; i < storedReceiverTokens.length; i++){
            if (storedReceiverTokens[i].senderId == receiverToken.senderId){
              console.log("receiver relationship already there: " + receiverToken.senderId);
              return;
            }
          }

          /* add receiver token to the fetched already stored receiver tokens */
          storedReceiverTokens.push(receiverToken);

          /* store them back into the storage area */
          var time2 = performance.now(); // PERFORMANCE MEASUREMENT
          STORAGE.STORE(CONSTANT.ITEMS.RECEIVER_TOKENS, storedReceiverTokens);
          console.log("store receiver token: " + (performance.now()-time2)); // PERFORMANCE MEASUREMENT

          callback("Receiver relationship with: @" + receiverToken.senderId);
        };
        image.src = imageUrl;
      }
    });

    /* read sender relationships information */
    /* get tweets where the user is mentioning other users */
    var query = "from:"+userId+" filter:twimg";

    INTEGRATION_TWITTER.SEARCH(STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN), STORAGE.RETRIEVE(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET), query, function(tweets){
      console.log(tweets); // AHMED

      /* if no tweet posted by the user with an image */
      if (tweets.length == 0) {
        console.log("Not able to get any tweet to check for receiver tokens.");
        return;
      }

      /* loop over collected tweets */
      for (var i = 0; i < tweets.length; i++) {
        /* if not only one user is mentioned */
        if (tweets[i].entities.user_mentions.length != 1)
          continue;

        var imageUrl = tweets[i].entities.media[0].media_url_https;
        var image = document.createElement("img");
        image.onload = function(){

          /* extract embedded sender token */
          var time1 = performance.now(); // PERFORMANCE MEASUREMENT
          var extractedData = IMAGE_STEGANOGRAPHY.PIXEL.EXTRACT_FROM_BLOCK(image, h_password, 0, 2);
          console.log("sender token extraction: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

          /* read data length */
          var dataLengthInBits = extractedData.substring(0, CONSTANT.DATA_LENGTH.RSEncodedSenderTokenInBits);
          var dataLength = CONVERT.BINARY_TO_DECIMAL(dataLengthInBits);

          /* extract RS encoded sender token */
          var extractedSenderToken = extractedData.substring(CONSTANT.DATA_LENGTH.RSEncodedSenderTokenInBits, CONSTANT.DATA_LENGTH.RSEncodedSenderTokenInBits+dataLength);

          /* FEC decoding */
          var time1 = performance.now(); // PERFORMANCE MEASUREMENT
          var decodedSenderToken = FEC.REED_SOLOMON.DECODE(extractedSenderToken);
          console.log("FEC decoding: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT


          /* decrypt and read sender token information */
          var time1 = performance.now(); // PERFORMANCE MEASUREMENT
          var decryptedSenderToken = CRYPTO.DE_CONCAT(CRYPTO.AES.DECRYPT(h_password, decodedSenderToken));
          console.log("decrypt sender token: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

          var time1 = performance.now(); // PERFORMANCE MEASUREMENT
          var senderToken = new Object();
          senderToken.receiverId = decryptedSenderToken[0];
          senderToken.relationshipId = decryptedSenderToken[1];

          /* get sender tokens from storage area */
          var storedSenderTokens = STORAGE.RETRIEVE(CONSTANT.ITEMS.SENDER_TOKENS);

          /* if not found in storage area, create one */
          if (!storedSenderTokens)
            storedSenderTokens = [];

          /* check if found sender token is already stored */
          for (var i = 0; i < storedSenderTokens.length; i++){
            if (storedSenderTokens[i].receiverId == senderToken.receiverId) {
              console.log("sender relationship already there: " + senderToken.receiverId);
              return;
            }
          }

          /* add sender token to the fetched already stored sender tokens */
          storedSenderTokens.push(senderToken);

          /* store them back into the storage area */
          var time3 = performance.now(); // PERFORMANCE MEASUREMENT
          STORAGE.STORE(CONSTANT.ITEMS.SENDER_TOKENS, storedSenderTokens);
          console.log("store sender token: " + (performance.now()-time3)); // PERFORMANCE MEASUREMENT

          callback("Sender relationship with: @" + senderToken.receiverId);
        };
        image.src = imageUrl;
      }
    });
  },

  /* embed secret in cover image and post it in twitter */
  POST_SECRET: function (hvePublicKey, sharedKey, allowdIds, secret, coverImage, callback) {
    chrome.runtime.sendMessage({request:CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE, keys:[CONSTANT.TWITTER.OAUTH_TOKEN, CONSTANT.TWITTER.OAUTH_TOKEN_SECRET]}, function(response){
      var oauthToken = response[0];
      var oauthTokenSecret = response[1];

     // Used for performance evaluation // AHMED
     var tau = 20; // AHMED: OPEN IT
     console.log("allowdIds: " + allowdIds); // AHMED
      allowdIds = [];
      for (var i = 0; i < tau; i++)
        allowdIds[i] = i;
      console.log("allowdIds: " + allowdIds); // AHMED

      /* generate random key and its encrypted form using HVE */
      var time1 = performance.now(); // PERFORMANCE MEASUREMENT
      var encryptedHve = CRYPTO.HVE.ENCRYPT(hvePublicKey, allowdIds);
      console.log("hve key encryption: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

      /* hash the random key and use it as AES key */
      var aesKey = CRYPTO.HASH.SHA1(encryptedHve.plaintext);

      /* encrypt secret with AES key */
      var time1 = performance.now(); // PERFORMANCE MEASUREMENT
      var encryptedSecret = CRYPTO.AES.ENCRYPT(aesKey, secret);
      console.log("secret encryption: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

      /* construct access vector  */
      var accessVector = new Array(CONSTANT.HVE.MAX_FRIENDS).fill(0);
      for (var i = 0; i < allowdIds.length; i++)
        accessVector[allowdIds[i]] = 1;

      /* encrypt access vector */
      var time1 = performance.now(); // PERFORMANCE MEASUREMENT
      var encryptedAccessVector = CRYPTO.AES.ENCRYPT(sharedKey, JSON.stringify(accessVector));
      console.log("access vector encryption: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

      /* data = AESsharedKey(accessVector)||HVE(key)||AESkey(secret) */
      var data = CRYPTO.CONCAT([encryptedAccessVector, encryptedHve.ciphertext, encryptedSecret]);

      /* FEC encoding */
      var time1 = performance.now(); // PERFORMANCE MEASUREMENT
      data = FEC.REED_SOLOMON.ENCODE(data);
      console.log("FEC encoding: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT


      /* get size of data in bits */
      var dataLength = CONVERT.DECIMAL_TO_BINARY(data.length, CONSTANT.DATA_LENGTH.DataLengthInBits);

      /* append the size of the data at the start */
      data = dataLength + data;

      /* embed secret message into cover image */
      var time1 = performance.now(); // PERFORMANCE MEASUREMENT
      var stegoImageDataURL = IMAGE_STEGANOGRAPHY.PIXEL.EMBED(data, sharedKey, coverImage);
      console.log("steganography: " + (performance.now()-time1)); // PERFORMANCE MEASUREMENT

      /* check if data embedded successfully */
      if (!stegoImageDataURL) {
        callback(null);
        return;
      }

      /* upload stego image to twitter */
      INTEGRATION_TWITTER.POST_TWEET(oauthToken, oauthTokenSecret, "", stegoImageDataURL, function(response){
        callback(response);
      });
    });
  },

  /* extract and return secret */
  EXTRACT_SECRET: function (tweet, sharedKey, decryptionKey, relationshipId, createAndShowSecretStatus, callback) {
    createAndShowSecretStatus(tweet, "Checking for secret ...", "blue");

    /* get image from tweet */
    var image = $(tweet).find("div.AdaptiveMedia-photoContainer").find("img")[0];

    /* get user id of the posted user */
    var posterUserId = tweet["attributes"]["data-screen-name"].value;

    /* create temporary image */
    var tmpImage = document.createElement("img");
    tmpImage.crossOrigin = "Anonymous";

    /* extract embedded data */
    tmpImage.onload = function(){
      /* read image base64 */
      var canvas = document.createElement("canvas");
      canvas.width = tmpImage.width;
      canvas.height = tmpImage.height;
      var context = canvas.getContext("2d");
      context.drawImage(tmpImage, 0, 0);
      var base64 = canvas.toDataURL();

      /* extract data from image */
      var time1 = performance.now(); // PERFORMANCE MEASUREMENT
      var extractedData = IMAGE_STEGANOGRAPHY.PIXEL.EXTRACT(tmpImage, sharedKey);
      time1 = performance.now() - time1; // PERFORMANCE MEASUREMENT

      /* read data length */
      var dataLengthInBits = extractedData.substring(0, CONSTANT.DATA_LENGTH.DataLengthInBits);
      var dataLength = CONVERT.BINARY_TO_DECIMAL(dataLengthInBits);

      /* extract secret data */
      extractedData = extractedData.substring(CONSTANT.DATA_LENGTH.DataLengthInBits, CONSTANT.DATA_LENGTH.DataLengthInBits+dataLength);

      /* FEC decoding */
      var time2 = performance.now(); // PERFORMANCE MEASUREMENT
      extractedData = FEC.REED_SOLOMON.DECODE(extractedData);
      time2 = performance.now() - time2; // PERFORMANCE MEASUREMENT

      /* if data cannot be decoded successfully */
      if (!extractedData) {
        createAndShowSecretStatus(tweet, "No secret data found!", "grey");
        callback(null, null, null);
        return;
      }

      /* read secret data */
      var secretData = CRYPTO.DE_CONCAT(extractedData);

      /* if no secret is found */
      if (!secretData) {
        createAndShowSecretStatus(tweet, "No secret data found!", "grey");
        callback(null, null, null);
        return;
      }

      /* get secret data components */
      var time3 = performance.now(); // PERFORMANCE MEASUREMENT
      var accessVector = JSON.parse(CRYPTO.AES.DECRYPT(sharedKey, secretData[0]));
      time3 = performance.now() - time3; // PERFORMANCE MEASUREMENT

      var encryptedRandomKey = secretData[1];
      var encryptedSecret = secretData[2];

      /* check if user have access to this secret */
      if (accessVector[relationshipId] != 1) {
        createAndShowSecretStatus(tweet, "No access allowed!", "red");
        callback(null, null, null);
        return;
      }

      /* construct allowd Ids */
      var allowedIds = [];
      for (var i = 0; i < accessVector.length; i++)
        if (accessVector[i] == 1)
          allowedIds.push(i);

      /* decrypt random key and hash it to get AES key */
      var time4 = performance.now(); // PERFORMANCE MEASUREMENT
      var aesKey = CRYPTO.HASH.SHA1(CRYPTO.HVE.DECRYPT(decryptionKey, encryptedRandomKey, allowedIds));
      time4 = performance.now() - time4; // PERFORMANCE MEASUREMENT

      /* decrypt secret */
      var time5 = performance.now(); // PERFORMANCE MEASUREMENT
      var secret = CRYPTO.AES.DECRYPT(aesKey, encryptedSecret);
      time5 = performance.now() - time5; // PERFORMANCE MEASUREMENT

      console.log(secret[20] + "| secret extraction: " + time1); // PERFORMANCE EVALUATION
      console.log(secret[20] + "| FEC decoding: " + time2); // PERFORMANCE EVALUATION
      console.log(secret[20] + "| AV decryption: " + time3); // PERFORMANCE EVALUATION
      console.log(secret[20] + "| hve k decryption: " + time4); // PERFORMANCE EVALUATION
      console.log(secret[20] + "| secret decryption: " + time5); // PERFORMANCE EVALUATION

      createAndShowSecretStatus(tweet, "Secret extracted!", "green");

      callback(secret, image, base64);
    };
    tmpImage.src = image.src;
  }
};
