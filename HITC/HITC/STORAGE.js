var STORAGE = {

  /* store in storage area */
  STORE: function (key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /* retrieve from storage area */
  RETRIEVE: function (key) {
    return JSON.parse(localStorage.getItem(key));
  },

  /* clear stored data from storage area */
  CLEAR: function (key) {
    /* overwrite stored data with random dummy data */
    localStorage.setItem(key, CRYPTO.HASH.SHA512(Math.random().toString()));

    /* clear data */
    localStorage.removeItem(key);
  },

  /* clear all data from storage area */
  CLEAR_ALL: function () {
    /* clear all data */
    for (var i = 0; i < localStorage.length; i++)
      STORAGE.CLEAR(localStorage.key(i));

    /* double clearing of data */
    localStorage.clear();
  }
};
