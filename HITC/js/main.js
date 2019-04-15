$(document).ready(function(){
  /* set current screen */
  STORAGE.STORE(CONSTANT.UI.CURRENT_SCREEN, "main.html");
});

$("#establish").click(function(){
  /* check if user id is entered */
  if ($("#userId").val() == ""){
    ALERT.WARNING("No User Id Entered", "Please enter user Id!");
    return;
  }

  /* check if secret phrase is entered */
  if ($("#secretPhrase").val() == ""){
    ALERT.WARNING("No Secret Phrase Entered", "Please enter secret phrase!");
    return;
  }

  /* check if hashtag is entered */
  if ($("#hashtag").val() == ""){
    ALERT.WARNING("No Hashtag Entered", "Please enter hashtag!");
    return;
  }

  /* check image before reading */
  if ($("#coverImage")[0].files.length != 1) {
    ALERT.WARNING("Single Image To Be Uploaded", "Please select one image only to be uploaded.");
    return;
  }

  /* collect data required for relationship establishment */
  var senderId = STORAGE.RETRIEVE(CONSTANT.ITEMS.USER_ENTITY).screen_name;
  var receiverId = $("#userId").val();
  var secretPhrase = $("#secretPhrase").val();
  var hashtag = $("#hashtag").val();
  var h_password = STORAGE.RETRIEVE(CONSTANT.ITEMS.HASH_PASSWORD);
  var hveMasterKey = STORAGE.RETRIEVE(CONSTANT.ITEMS.HVE_MASTER_KEY);
  var hvePublicKey = STORAGE.RETRIEVE(CONSTANT.ITEMS.HVE_PUBLIC_KEY);
  var sharedKey = STORAGE.RETRIEVE(CONSTANT.ITEMS.SHARED_KEY);

  /* get current largest relationship id */
  var senderTokens = STORAGE.RETRIEVE(CONSTANT.ITEMS.SENDER_TOKENS);
  var relationshipId = 0;
  if (senderTokens) {
    for (var i = 0; i < senderTokens.length; i++)
      if (senderTokens[i].relationshipId > relationshipId)
        relationshipId = senderTokens[i].relationshipId;
  }

  relationshipId++; /* next available relationship id */

  /* read the image data */
  var image = document.createElement("img");
  var reader = new FileReader();
  reader.onload = function(){
    image.src = reader.result;

    image.onload = function(){
      /* establish relationship */
      OPERATION.ESTABLISH_RELATIONSHIP(senderId, receiverId, secretPhrase, hashtag, h_password, image, hveMasterKey, hvePublicKey, sharedKey, relationshipId, function(response){
        if (response){
          ALERT.SUCCESS("Relationship Established", "Relationship established successfully.");

          /* clear form */
          $("#userId").val("");
          $("#coverImage").val(null);
        }
        else
          ALERT.ERROR("Relationship Establishment Failed", "Failed to establish relationship or cannot find user's public key!");
      });
    }
  }
  reader.readAsDataURL($("#coverImage")[0].files[0]);
});

$("#refresh").click(function(){
  OPERATION.REFRESH_RELATIONSHIPS(STORAGE.RETRIEVE(CONSTANT.ITEMS.USER_ENTITY).screen_name, STORAGE.RETRIEVE(CONSTANT.ITEMS.HASH_PASSWORD), STORAGE.RETRIEVE(CONSTANT.ITEMS.RSA_PUBLIC_KEY), STORAGE.RETRIEVE(CONSTANT.ITEMS.RSA_PRIVATE_KEY), function(log){
    ALERT.INFO("Refresh Relationships", log);
  });
});

$("#logout").click(function(){
  /* clear all stored data */
  STORAGE.CLEAR_ALL();

  /* go to start page */
  window.location.href = "start.html";
});
