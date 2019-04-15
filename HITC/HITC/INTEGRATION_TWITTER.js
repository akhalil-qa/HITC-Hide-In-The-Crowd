var INTEGRATION_TWITTER = {

  /* authenticate twitter user and return OAuth tokens */
  AUTHENTICATE: function (callback) {
    /* create codebird object */
    var cb = new Codebird;

    /* set twitter api keys */
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    /* set proxy */
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    /* request token from twitter */
    cb.__call("oauth_requestToken", {oauth_callback: "oob"}, function (reply, rate, err) {
      if (err) {
         console.log("[AUTHENTICATE] error response or timeout exceeded" + err.error);
         callback(null, null);
         return;
      }

      if (reply) {
        /* set the tokens */
        cb.setToken(reply.oauth_token, reply.oauth_token_secret);

        cb.__call("oauth_authorize", {}, function (auth_url) {
          /* open the authorize screen URL */
          window.codebird_auth = window.open(auth_url);

          /* return OAuth tokens */
          callback(reply.oauth_token, reply.oauth_token_secret);
        });
      }
    });
  },

  /* authorize twitter user and return OAuth tokens */
  AUTHORIZE: function (pin, oauthToken, oauthTokenSecret, callback) {
    /* create codebird object */
    var cb = new Codebird;

    /* set twitter api keys */
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    /* set OAuth token */
    cb.setToken(oauthToken, oauthTokenSecret);

    /* set proxy */
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    cb.__call("oauth_accessToken", {oauth_verifier: pin}, function (reply, rate, err) {
      if (err) {
        console.log("[AUTHORIZE] error response or timeout exceeded" + err.error);
        callback(null, null);
        return;
      }

      /* store the authenticated token, which may be different from the request token (!) */
      cb.setToken(reply.oauth_token, reply.oauth_token_secret);

      /* return OAuth tokens */
      callback(reply.oauth_token, reply.oauth_token_secret);
    });
  },

  /* return authorized user entity */
  GET_USER_ENTITY: function (oauthToken, oauthTokenSecret, callback) {
    /* create codebird object */
    var cb = new Codebird;

    /* set twitter api keys */
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    /* set OAuth token */
    cb.setToken(oauthToken, oauthTokenSecret);

    /* set proxy */
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    cb.__call("account_verifyCredentials", {}, function (reply, rate, err){

      if (err) {
        console.log("[GET_USER_ENTITY] error response or timeout exceeded" + err.error);
        callback(null);
        return;
      }
      callback(reply);
    });
  },

  /* search tweets */
  SEARCH: function (oauthToken, oauthTokenSecret, query, callback) {
    console.log("query: " + query);

    /* create codebird object */
    var cb = new Codebird;

    /* set twitter api keys */
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    /* set OAuth token */
    cb.setToken(oauthToken, oauthTokenSecret);

    /* set proxy */
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    var params = {
      "q": query,
      "count": 100 /* max tweets that can be returned per call */
    };

    cb.__call("search_tweets", params, function (reply, rate, err){
      callback(reply.statuses);
    });
  },

  /* set profile image */
  SET_PROFILE_IMAGE: function (oauthToken, oauthTokenSecret, imageInBase64, callback) {
    /* create codebird object */
    var cb = new Codebird;

    /* set twitter api keys */
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    /* set OAuth token */
    cb.setToken(oauthToken, oauthTokenSecret);

    /* set proxy */
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    //imageInBase64 = imageInBase64.substr(imageInBase64.indexOf(",")+1);

    var params = {
      "image": imageInBase64
    };

    cb.__call("account_updateProfileImage", params, function (reply, rate, err) {
      console.log(reply);

      if (err) {
        console.log("[SET_PROFILE_IMAGE 1] error response or timeout exceeded" + err.error);
        callback(false);
        return;
      }

      callback(true);
    });
  },

  /* post tweet with content and image in twitter */
  POST_TWEET: function (oauthToken, oauthTokenSecret, content, imageInBase64, callback) {
    /* create codebird object */
    var cb = new Codebird;

    /* set twitter api keys */
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    /* set OAuth token */
    cb.setToken(oauthToken, oauthTokenSecret);

    /* set proxy */
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    /* remove the header from the base64 representation (twitter api requirement) */
    imageInBase64 = imageInBase64.substr(imageInBase64.indexOf(",")+1);

    var params = {
      "media_data": imageInBase64
    };

    cb.__call("media_upload", params, function (reply, rate, err) {

      if (err) {
        console.log("[POST_TWEET 1] error response or timeout exceeded" + err.error);
        callback(false);
        return;
      }

      /* pass just uploaded media id as parameter to the update status api */
      var parmas = {
        "media_ids": reply.media_id_string,
        "status": content
      };

      cb.__call("statuses_update", parmas, function (reply, rate, err) {
        if (err) {
          console.log("[POST_TWEET 2] error response or timeout exceeded" + err.error);
          callback(false);
          return;
        }

        callback(true);
      });
    });
  }

  /*
  // NOT COMPLETE AND BUGGY [AHMED]
  UPDATE_PROFILE_BANNER: function (oauthToken, oauthTokenSecret, imageInBase64, callback) {
    // create codebird object
    var cb = new Codebird;

    // set twitter api keys
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    // set OAuth token
    cb.setToken(oauthToken, oauthTokenSecret);

    // set proxy
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    // remove the header from the base64 representation (twitter api requirement)
    //imageInBase64 = imageInBase64.substr(imageInBase64.indexOf(",")+1);

    var params = {
      "banner": imageInBase64
    };

    cb.__call("account_updateProfileBanner", params, function (reply, rate, err){
      console.log(">> " + err);
      console.log(">> " + JSON.stringify(reply));
    });
  },
  */

  /* get user details by supplying twitter user id */
  /* max. of 100 ids per call */
  /*
  GET_USERS_DETAILS: function (oauthToken, oauthTokenSecret, usersIds, callback) {
    // create codebird object
    var cb = new Codebird;

    // set twitter api keys
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    // set OAuth token
    cb.setToken(oauthToken, oauthTokenSecret);

    // set proxy
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    var params = {
      "user_id": usersIds.toString()
    };

    cb.__call("users_lookup", params, function (reply, rate, err){

      if (err) {
        console.log("[GET_USER_DETAILS] error response or timeout exceeded" + err.error);
        callback(null);
        return;
      }
      callback(reply);
    });
  },
  */

  /* get all friends ids (following) of user */
  /*
  GET_FRIENDS_IDS: function (oauthToken, oauthTokenSecret, callback, cursor = -1) {
    // create codebird object
    var cb = new Codebird;

    // set twitter api keys
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    // set OAuth token
    cb.setToken(oauthToken, oauthTokenSecret);

    // set proxy
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    var params = {
      "count": 5000, // max number of friends to read (twitter API restriction)
      "cursor": cursor,
      "stringify_ids": "true"
    };

    cb.__call("friends_ids", params, function (reply, rate, err) {
      if (err) {
        console.log("[GET_FRIENDS] error occured while trying to get firends list.");
        callback(false);
        return;
      }
      callback(reply.ids); // return the result (max of 5000 friends)

      // check if more friends are there
      if (reply.next_cursor > 0)
        INTEGRATION_TWITTER.GET_FRIENDS_IDS(oauthToken, oauthTokenSecret, callback, reply.next_cursor);
    });
  },
  */

  /* get user's mentions timeline */
  /*
  GET_MENTIONS_TIMELINE: function (oauthToken, oauthTokenSecret, callback) {
    // create codebird object
    var cb = new Codebird;

    // set twitter api keys
    cb.setConsumerKey(CONSTANT.TWITTER.CONSUMER_KEY, CONSTANT.TWITTER.CONSUMER_SECRET);

    // set OAuth token
    cb.setToken(oauthToken, oauthTokenSecret);

    // set proxy
    //cb.setProxy(CONSTANT.TWITTER.CODEBIRD_PROXY);

    var params = {
    };

    cb.__call("statuses_mentionsTimeline", params, function (reply, rate, err){

      if (err) {
        console.log("[GET_USER_ENTITY] error response or timeout exceeded" + err.error);
        callback(null);
        return;
      }
      callback(reply);
    });
  }
  */
}
