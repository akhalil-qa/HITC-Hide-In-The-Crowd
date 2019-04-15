var IMAGE_STEGANOGRAPHY = {

  DCT: {
    /* embed data in image and return the stego image as dataURL */
    EMBED: function (data, secretPhrase, image, callback) {

      /* encode reed solomon for FEC and get the outpt as binary */
      var binaryData = FEC.REED_SOLOMON.ENCODE(data);

      /* embed data in DCT coefficients */
      jsSteg.reEncodeWithModifications(image, CONSTANT.IMAGE_STEGANOGRAPHY.DCT.QUALITY_FACTOR, function(coefficients){
        var writePtr = 0;

        for (var i = 0; i < coefficients[0].length; i++) {

          if (writePtr == binaryData.length) break;

          for (var j = 0; j < coefficients[0][i].length; j++) {

            if (writePtr == binaryData.length) break;

            /* skip DC coefficients */
            if (j == 0) continue;

            /* read absolute value */
            var absCoefficent = Math.abs(coefficients[0][i][j]);

            /* convert coefficient to binary */
            var binaryCoefficent = CONVERT.DECIMAL_TO_BINARY(absCoefficent, 10);

            /* embed into LSB */
            binaryCoefficent = HELPER.SET_BIT(binaryCoefficent, 9, binaryData[writePtr]);

            /* convery back to decimal */
            var decimalCoefficent = CONVERT.BINARY_TO_DECIMAL(binaryCoefficent);

            /* correct the sign */
            if (coefficients[0][i][j] < 0)
              decimalCoefficent *= -1;

            /* modify coefficient value */
            coefficients[0][i][j] = decimalCoefficent;

            writePtr++;
          }
        }
      }, function (dataURL){
        /* return stego image as dataURL */
        callback(dataURL);
      });
    },

    /* return embedded data in an image html element */
    EXTRACT: function (image, secretPhrase, length, callback) {
      var binaryData = "";
      /* get DCT coefficients */
      jsSteg.getCoefficients(image.src, function(coefficients){
        for (var i = 0; i < coefficients[1].length; i++) {

          if (binaryData.length == length) break;

          for (var j = 0; j < coefficients[1][i].length; j++) {
            /* skip DC coefficients */
            if (j == 0) continue;

            /* read absolute value */
            var absCoefficent = Math.abs(coefficients[1][i][j]);

            /* convert coefficient to binary */
            var binaryCoefficent = CONVERT.DECIMAL_TO_BINARY(absCoefficent, 10);

            /* read LSB */
            binaryData += HELPER.GET_BIT(binaryCoefficent, 9);

            if (binaryData.length == length) break;
          }
        }

        /* reed solomon decode binary and output text */
        var data = FEC.REED_SOLOMON.DECODE(binaryData);

        callback(data);

        return;
      });
    }
  },

  PIXEL: {
    /* embed binary data in image and return the stego image as dataURL */
    EMBED: function (data, sequenceSeed, image) {
      return IMAGE_STEGANOGRAPHY.PIXEL.EMBED_IN_BLOCK(data, sequenceSeed, image, 0, 1);
    },

    /* return embedded binary data in an image html element */
    EXTRACT: function (image, sequenceSeed) {
      return IMAGE_STEGANOGRAPHY.PIXEL.EXTRACT_FROM_BLOCK(image, sequenceSeed, 0, 1);
    },

    /* embed binary data in specific block in the image and return the full stego image as dataURL */
    EMBED_IN_BLOCK: function (data, sequenceSeed, image, blockIndex, totalNumberOfBlocks) {
      /* draw the input image into a canvas */
      var canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);

      /* read image pixel values (RGBA channels) */
      var imgData = context.getImageData(0, 0, canvas.width, canvas.height);

      /* calculate start and end index */
      var startIndex = 0;
      var endIndex = 0;
      /* skip 1st pixel as it will be used to ensure PNG uploading to Twitter! */
      if (blockIndex == 0) {
        startIndex = 4;
        endIndex = (startIndex + (imgData.data.length/totalNumberOfBlocks)) - 1 - 4;
      }
      else {
        startIndex = (imgData.data.length/totalNumberOfBlocks) * blockIndex;
        endIndex = (startIndex + (imgData.data.length/totalNumberOfBlocks)) - 1;
      }

      /* build an array for available indices for embedding */
      var indices = [];
      for (var i = startIndex; i <= endIndex; i++) {
        /* skip alpha channel */
        if (i % CONSTANT.IMAGE.PIXEL_LENGTH == CONSTANT.IMAGE.ALPHA_CHANNEL)
          continue;

        indices.push(i);
      }

      /* check if data MAY NOT fit inside the cover image */
      if (data.length > indices.length) {
        console.log("secret data length in binary: " + data.length);
        console.log("cover image capactiy (total RGB channels without 1st pixel): " + indices.length);
        console.log("data to be embedded is larger than the capacity of the cover image.");
        console.log("====");
        return null;
      }

      /* embed data */
      CRYPTO.PRNG.SEED(sequenceSeed); /* seed the PRNG */
      for (var i = 0; i < data.length; i++) {
        /* get random index */
        var randomIndex = CRYPTO.PRNG.RANDOM_INT_IN_RANGE(0, indices.length-1);

        /* get random channel */
        var randomChannel = indices[randomIndex];

        /* get random number between 0 and BITS_USED-1 */
        var randomBit = CRYPTO.PRNG.RANDOM_INT_IN_RANGE(0, CONSTANT.IMAGE_STEGANOGRAPHY.PIXEL.BITS_USED-1);

        /* read the randomly selected channel value */
        var binaryChannel = CONVERT.DECIMAL_TO_BINARY(imgData.data[randomChannel], 8);

        /* embed the value into the randomly selected bit */
        binaryChannel = HELPER.SET_BIT(binaryChannel, 7-randomBit, data[i]);

        /* convert from binary to decimal and write the updated value back */
        imgData.data[randomChannel] = CONVERT.BINARY_TO_DECIMAL(binaryChannel);

        /* remove randomly selected index in order to not be selected randomly again! */
        indices[randomIndex] = indices[indices.length-1];
        indices.pop();
      }

      /* set alpha channel of 1st pixel to 254 (to upload png on twitter!) */
      imgData.data[3] = 254;

      /* draw the stego image back into the canvas */
      context.putImageData(imgData, 0, 0);

      /* return image as dataURL in PNG format */
      return canvas.toDataURL("image/png");
    },

    /* return embedded binary data in a specific block of an image html element */
    EXTRACT_FROM_BLOCK: function (image, sequenceSeed, blockIndex, totalNumberOfBlocks) {
      /* draw the input image into a canvas */
      var canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);

      /* read image pixel values (RGBA channels) */
      var imgData = context.getImageData(0, 0, canvas.width, canvas.height);

      /* calculate start and end index */
      var startIndex = 0;
      var endIndex = 0;
      /* skip 1st pixel as it will be used to ensure PNG uploading to Twitter! */
      if (blockIndex == 0) {
        startIndex = 4;
        endIndex = (startIndex + (imgData.data.length/totalNumberOfBlocks)) - 1 - 4;
      }
      else {
        startIndex = (imgData.data.length/totalNumberOfBlocks) * blockIndex;
        endIndex = (startIndex + (imgData.data.length/totalNumberOfBlocks)) - 1;
      }

      /* build an array for available indices for embedding */
      var indices = [];
      for (var i = startIndex; i <= endIndex; i++) {
        /* skip alpha channel */
        if (i % CONSTANT.IMAGE.PIXEL_LENGTH == CONSTANT.IMAGE.ALPHA_CHANNEL)
          continue;

        indices.push(i);
      }

      /* extract data */
      var data = "";
      CRYPTO.PRNG.SEED(sequenceSeed); /* seed the PRNG */
      var totalNumberOfIndices = indices.length;
      for (var i = 0; i < totalNumberOfIndices; i++) {
        /* get random index */
        var randomIndex = CRYPTO.PRNG.RANDOM_INT_IN_RANGE(0, indices.length-1);

        /* get random channel */
        var randomChannel = indices[randomIndex];

        /* get random number between 0 and BITS_USED-1 */
        var randomBit = CRYPTO.PRNG.RANDOM_INT_IN_RANGE(0, CONSTANT.IMAGE_STEGANOGRAPHY.PIXEL.BITS_USED-1);

        /* read the randomly selected channel value */
        var binaryChannel = CONVERT.DECIMAL_TO_BINARY(imgData.data[randomChannel], 8);

        /* read the value of the randomly selected bit */
        data += HELPER.GET_BIT(binaryChannel, 7-randomBit);

        /* remove randomly selected index in order to not be selected randomly again! */
        indices[randomIndex] = indices[indices.length-1];
        indices.pop();
      }

      return data;
    }
  }
};
