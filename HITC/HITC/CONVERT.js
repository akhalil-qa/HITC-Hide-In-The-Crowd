var CONVERT = {

  /* convert string to binary */
  STRING_TO_BINARY: function (input) {
    var pad = '00000000';
    return input.replace(/./g, function (c) {
        var bin = c.charCodeAt(0).toString(2);
        return pad.substring(bin.length) + bin;
    });
  },

  /* convert binary to string */
  BINARY_TO_STRING: function (input) {
    return input.replace(/[01]{8}/g, function (v) {
      return String.fromCharCode(parseInt(v, 2));
    });
  },

  /* convert image to base64 representation */
  BLOB_TO_BASE64: function (url, callback) {
    var image = new Image();
    image.crossOrigin = "Anonymous";

    image.onload = function(){
      var canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      var context = canvas.getContext("2d");
      context.drawImage(this, 0, 0);

      callback(canvas.toDataURL());
    };
    image.src = url;
  },

  /* convert decimal to binary */
  DECIMAL_TO_BINARY: function (decimal, length) {
    var out = "";
    while(length--)
      out += (decimal >> length ) & 1;
    return out;
  },

  /* convery binary to decimal */
  BINARY_TO_DECIMAL: function (binary) {
    return parseInt(binary, 2);
  }

};
