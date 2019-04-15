var FEC = {

  REED_SOLOMON: {

    /* encode a string input and return the encoded value as binary */
    ENCODE: function (input) {
      /* check size of message if can be divided into blocks. if not, add padding of "0"s at the end */
      var remainder = input.length % CONSTANT.FEC.REED_SOLOMON.K;
      if (remainder > 0) {
        for (var i = 0; i < (CONSTANT.FEC.REED_SOLOMON.K-remainder); i++)
          input += "0";
      }

      var rs = new ReedSolomon(CONSTANT.FEC.REED_SOLOMON.T);

      var binary = "";

      /* divide input into blocks and encode each block seperately */
      for (var i = 0; i < input.length; i += CONSTANT.FEC.REED_SOLOMON.K) {
        var block = input.slice(i, i+CONSTANT.FEC.REED_SOLOMON.K);
        var encoded = rs.encode(block);

        //console.log("[ENCODE] encoded data: ");
        //console.log(encoded.toString());
        //console.log("====");

        for (var j = 0; j < encoded.length; j++) {
          binary += CONVERT.DECIMAL_TO_BINARY(encoded[j], 8);
        }
      }

      //console.log("[ENCODE] output: " + binary);
      return binary
    },

    /* decode a binary input and return the decoded value as string */
    DECODE: function (input) {
      //console.log("[DECODE] input: " + input + " [" + input.length + "]");

      var rs = new ReedSolomon(CONSTANT.FEC.REED_SOLOMON.T);

      var output = "";

      /* divide the input into blocks */
      for (var i = 0; i < input.length; i += 8*(CONSTANT.FEC.REED_SOLOMON.T+CONSTANT.FEC.REED_SOLOMON.K)) {
        var block = input.slice(i, i+(8*(CONSTANT.FEC.REED_SOLOMON.T+CONSTANT.FEC.REED_SOLOMON.K)));

        /* convert binary stream to an array of decimals */
        var encoded = [];
        for (var j = 0; j < block.length; j += 8) {
          var binary = block.slice(j, j+8);
          var decimal = CONVERT.BINARY_TO_DECIMAL(binary);
          encoded.push(decimal);
        }

        try {
          //console.log("[DECODE] data to decode: ");
          //console.log(encoded.toString());
          output += rs.decode(encoded);
        } catch(e) {
          //console.log("ERROR OCCURS WHILE DECODING!");
          return null;
        }
      }

      /* remove padding if exists */
      while (output[output.length-1] == 0)
        output = output.substring(0, output.length-1);

      //console.log("[DECODE] output: " + output);
      //console.log("[DECODE] output length: " + output.length);
      //console.log("====");

      return output;
    }
  }
};
