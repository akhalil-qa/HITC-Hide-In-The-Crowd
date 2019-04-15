var HELPER = {
  /* remove element from any array */
  REMOVE_FROM_ARRAY: function (array, element) {
    return array.filter(e => e !== element);
  },

  /* get type data */
  GET_SECRET_TYPE: function (data) {
    /* read header */
    var header = data.substring(0, data.indexOf(","));

    /* find (data:* / *;base64) string in header */
    var regex = /data:\w+\/\w+;base64/g;
    var found = header.match(regex);

    /* if header is not present */
    if (!found)
      return CONSTANT.SECRET_TYPE.TEXT;

    /* read data and sub-data types from header => data:[dataType]/[subDataType];base64 */
    var dataType = header.substring(header.indexOf(":")+1, header.indexOf("/"));
    var subDataType = header.substring(header.indexOf("/")+1, header.indexOf(";"));

    switch (dataType) {
      /* type is image */
      case "image":
        return CONSTANT.SECRET_TYPE.IMAGE;
        break;
      /* type is file */
      default:
        return CONSTANT.SECRET_TYPE.FILE;
        break;
    }
  },

  /* convert text into image with text */
  TEXT_AS_IMAGE: function (text) {

    var canvas = document.createElement("canvas");
    canvas.width = 800; // AHMED
    canvas.height = 800; // AHMED
    var context = canvas.getContext("2d");

    wrapText(context, text, 30, 30, canvas.width-30, 26, "Arial");

    return canvas.toDataURL();

    function wrapText(context, text, x, y, maxWidth, fontSize, fontFace) {
      var words = text.split(" ");
      var line = "";
      var lineHeight = fontSize + 2;

      context.font = fontSize + "px " + fontFace;

      for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + " ";
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth) {
          context.fillText(line, x, y);
          line = words[n] + " ";
            y += lineHeight;
        }
        else {
          line = testLine;
        }
      }
      context.fillText(line, x, y);
    }
  },

  /* show download file extension in an image */
  DOWNLOAD_FILE_AS_IMAGE: function (text) {
    var canvas = document.createElement("canvas");
    canvas.width = 800; // AHMED
    canvas.height = 800; // AHMED
    var context = canvas.getContext("2d");

    context.font="30px Arial";

    /* read file type */
    var fileType = text.substring("data:".length, text.indexOf(";base64"));

    var downloadFileText = "Click to download secret file with type: " + fileType;

    var textWidth = context.measureText(downloadFileText).width;

    context.fillText(downloadFileText, (canvas.width/2) - (textWidth/2), canvas.height/2);

    return canvas.toDataURL();
  },

  /* set bit value in a binary representation */
  SET_BIT: function (binary, bitIndex, value) {
    if (bitIndex > binary.length-1)
      return binary;

    return binary.substr(0,bitIndex) + value + binary.substr(bitIndex+1);
  },

  /* read bit value in a binary representation */
  GET_BIT: function (binary, bitIndex) {
    return binary[bitIndex];
  }
};
