/* global variable */
var secret;
var test = 0; // Used for performance evaluation [AHMED]

/* called once the page is ready */
$(document).ready(function(){
  /* show secret tweet button */
  createSecretTweetButton();

  /* get user password to verify user is already logged in */
  chrome.runtime.sendMessage({request:CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE, keys:[CONSTANT.ITEMS.HASH_PASSWORD]}, function(response){
    /* user is logged in */
    if (response[0] != null)
      checkForSecrets();
  });
});

/* called when page is scrolled */
document.addEventListener("scroll", function(){
  /* get user password to verify user is already logged in */
  chrome.runtime.sendMessage({request:CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE, keys:[CONSTANT.ITEMS.HASH_PASSWORD]}, function(response){
    /* user is logged in */
    if (response[0] != null)
      checkForSecrets();
  });
});

/* create and show secret tweet button in top bar of twitter page */
function createSecretTweetButton(){
  /* create Secret Tweet button */
  var button = document.createElement("button");
  button.setAttribute("class", "js-global-new-tweet EdgeButton EdgeButton--primary");
  var span = document.createElement("span");
  span.setAttribute("class", "text");
  span.innerHTML = "Secret Tweet";
  button.appendChild(span);
  var item = document.createElement("li");
  item.appendChild(button);
  var list = document.getElementsByClassName("nav right-actions")[0];
  list.insertBefore(item, list.childNodes[3]);
  button.addEventListener("click", secretTweetButtonClicked);
}

/* called when secret tweet button in top bar of twitter page is clicked */
function secretTweetButtonClicked(){
  /* get user password to verify user is already logged in */
  chrome.runtime.sendMessage({request:CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE, keys:[CONSTANT.ITEMS.HASH_PASSWORD]}, function(response){
    /* user is logged in */
    if (response[0] != null) {
      /* radio buttons */
      var content = "<label>Choose option:</label><form action=''>";
      content += "<input class='secretType' type='radio' name='secret' value='secretText'> Secret Text<br>";
      content += "<input class='secretType' type='radio' name='secret' value='secretImage'> Secret Image<br>";
      content += "<input class='secretType' type='radio' name='secret' value='secretFile'> Secret File</form>";

      /* secret text content */
      content += "<div id='secretTextContent' hidden><label>Secret Text:</label><br><textarea id='text' rows='4' cols='50' style='width:550px; resize:none;'></textarea></div>";

      /* secret image content */
      content += "<div id='secretImageContent' hidden><label>Secret Image:</label><input id='uploadImage' type='file' /></div>";

      /* secret file content */
      content += "<div id='secretFileContent' hidden><label>Secret File:</label><input id='uploadFile' type='file' /></div>";

      /* cover image content */
      content += "<div id='coverImageContent' hidden><label>Cover Image:</label><input id='coverImage' type='file' /></div>";

      /* tweet button */
      content += "<div align='right'><button id='accessControl' hidden class='EdgeButton EdgeButton--primary'><span>Access Control</span></button>";

      /* show model box */
      showModelBox("Compose new Secret Tweet", content);

      /* secret type selected */
      $(".secretType").change(secretTypeSelected);

      /* text updated */
      $("#text").bind("input", textUpdated);

      /* image uploaded */
      $("#uploadImage").change(uploadImage);

      /* file uploaded */
      $("#uploadFile").change(uploadFile);

      /* access control button clicked */
      $("#accessControl").click(accessControl);
    }
    else { /* if user is not logged in */
      var content = "<center><h2>You are not logged in! Please use " + CONSTANT.GENERAL.PROJECT_NAME + " chrome extension to login first.</h2></center>";

      /* show model box */
      showModelBox("Compose new Secret Tweet", content);
    }
  });
}

/* read selected secret type and show the correct UI elements */
function secretTypeSelected(){
  /* remove secret */
  secret = "";

  /* read selected secret type */
  var secretType = $(".secretType:checked").val();

  /* hide all content */
  $("#secretTextContent").hide();
  $("#secretImageContent").hide();
  $("#secretFileContent").hide();

  /* show related content only */
  switch (secretType) {
    /* if secret text is selected */
    case CONSTANT.SECRET_TYPE.TEXT:
      $("#secretTextContent").show();
      break;
    /* if secret image is selected */
    case CONSTANT.SECRET_TYPE.IMAGE:
      $("#secretImageContent").show();
      break;
      /* if secret file is selected */
      case CONSTANT.SECRET_TYPE.FILE:
        $("#secretFileContent").show();
        break;
    default:
  }

  /* show cover image input */
  $("#coverImageContent").show();

  /* show access control button */
  $("#accessControl").show();
}

/* text updated */
function textUpdated(){
  secret = $("#text").val();
}

/* upload image */
function uploadImage(e){
  /* read the image data */
  var image = document.createElement("img");
  var reader = new FileReader();
  reader.onload = function(){
    image.src = reader.result;

    image.onload = function(){
      secret = image.src;
    }
  }
  reader.readAsDataURL($("#uploadImage")[0].files[0]);
}

/* upload file */
function uploadFile(e){
  /* read the file */
  var file = e.target.files[0];
  var reader = new FileReader();

  reader.addEventListener("load", function(){
    secret = reader.result;
  }, false);

  reader.readAsDataURL(file);
}

/* access control */
function accessControl() {

  /* read secret type */
  var secretType = $(".secretType:checked").val();

  /* read secret */
  switch (secretType) {
    /* if secret text is selected */
    case CONSTANT.SECRET_TYPE.TEXT:
      /* if text is not entered */
      if (secret === "") {
        ALERT.WARNING("No Text Entered", "Please enter your text.");
        return;
      }
      break;
    /* if secret image is selected */
    case CONSTANT.SECRET_TYPE.IMAGE:
    /* if image is not selected */
      if (secret === ""){
        ALERT.WARNING("No Image Selected", "Please select one image only to be uploaded.");
        return;
      }
      break;
    /* if secret file is selected */
    case CONSTANT.SECRET_TYPE.FILE:
    /* if file is not selected */
      if (secret === ""){
        ALERT.WARNING("No File Selected", "Please select one file only to be uploaded.");
        return;
      }
      break;
    default:
      ALERT.ERROR("Unknown Secret Type", "Secret type cannot be recognized!");
      return;
  }

  /* check if cover image is selected */
  if ($("#coverImage")[0].files.length == 0){
    ALERT.WARNING("No Cover Image Selected", "Please select a cover image.");
    return;
  }

  /* friends table */
  var content = "<div style='position:relative;'><div style='height:300px; overflow:auto; margin-top:20px;'><table id='secretFriendsTable' border='1' width='100%'><thead><tr><th><span><input id='selectAll' type='checkbox'>Select All</span></th><th><span>Username</span></th></tr></thead><tbody></tbody></table></div></div>";

  /* tweet button */
  content += "<div align='right'><button id='tweet' class='EdgeButton EdgeButton--primary'><span>Tweet</span></button>";

  /* show model box */
  showModelBox("Access Control", content);

  /* check and uncheck all friends */
  $("#selectAll").change(function(){
    $(".secretFriendCheck").prop("checked" , this.checked);
  });

  /* tweet button clicked */
  $("#tweet").click(tweet);

  /* populate model box with list of users where the authenticated user have a sender relationship with */
  /* get sender tokens from storage area */
  chrome.runtime.sendMessage({request:CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE, keys:[CONSTANT.ITEMS.SENDER_TOKENS]}, function(response){
    var senderTokens = response[0];

    /* if authenticated user do not have sender relationship with any other user */
    if (!senderTokens) {
      ALERT.WARNING("No Sender Tokens", "You do not have any sender relationship!");
      return;
    }

    for (var i = 0; i < senderTokens.length; i++) {
      /* add user to table */
      var row = document.getElementById("secretFriendsTable").insertRow(-1);
      row.style.textAlign = "center";
      var checkCell = row.insertCell(0);
      var userIdCell = row.insertCell(1);
      checkCell.innerHTML = "<input class='secretFriendCheck' value='" + senderTokens[i].relationshipId + "' type='checkbox'>";
      userIdCell.innerHTML = senderTokens[i].receiverId;
    }

    /* check and uncheck secret friend */
    $(".secretFriendCheck").change(function(){
      if (!this.checked)
        $("#selectAll").prop("checked", this.checked);
    });
  });

}

/* tweet secret */
function tweet() {
  /* get sender relationship tokens */
  chrome.runtime.sendMessage({request:CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE, keys:[CONSTANT.ITEMS.SENDER_RELATIONSHIP_TOKENS, CONSTANT.ITEMS.USER_ENTITY, CONSTANT.ITEMS.PASSWORD, CONSTANT.ITEMS.HVE_MASTER_KEY, CONSTANT.ITEMS.HVE_PUBLIC_KEY]}, function(response){
    /* read selected relationship Ids */
    var selectedRelationshipIds = [];
    selectedRelationshipIds.push(0); /* allow poster user to decrypt as well! */
    for (var i = 0; i < $(".secretFriendCheck").length; i++) {
      if ($(".secretFriendCheck")[i].checked)
        selectedRelationshipIds.push(parseInt($(".secretFriendCheck")[i].value));
    }

    /* if no user is selected */
    if (selectedRelationshipIds.length <= 0) {
      ALERT.WARNING("No Friend Selected", "Please select at least one friend.");
      return;
    }

    postSecret(selectedRelationshipIds);
  });

  function postSecret(allowedRelationshipIds) {
    /* read the cover image data */
    var image = document.createElement("img");
    var reader = new FileReader();
    reader.onload = function(){
      image.src = reader.result;

      image.onload = function(){
        /* post secret */
        /* get OAuth token */
        chrome.runtime.sendMessage({request:CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE, keys:[CONSTANT.ITEMS.HVE_PUBLIC_KEY, CONSTANT.ITEMS.SHARED_KEY]}, function(response){
          OPERATION.POST_SECRET(response[0], response[1], allowedRelationshipIds, secret, image, function(response){
            if (response){
              /* reload current page (to show the uploaded image) */
              document.location.reload();
            }
            else
              ALERT.ERROR("Cannot Upload Image", "Error occurs while trying to upload the image or cover image is smaller than the data to be embedded!");
          });
        });
      }
    }
    reader.readAsDataURL($("#coverImage")[0].files[0]);
  }
}

/* show twitter-like model box */
function showModelBox(title, htmlContent) {
  var globalDiv = document.createElement("div");
  globalDiv.setAttribute("id", "global-tweet-dialog");
  globalDiv.setAttribute("class", "modal-container");
  globalDiv.setAttribute("style", "z-index: 4002; display: block;");

  var globalDialogDiv = document.createElement("div");
  globalDialogDiv.setAttribute("class", "modal draggable");
  globalDialogDiv.setAttribute("id", "global-tweet-dialog-dialog");
  globalDialogDiv.setAttribute("role", "alertdialog");
  globalDialogDiv.setAttribute("aria-labelledby", "global-tweet-dialog-header");
  globalDialogDiv.setAttribute("aria-describedby", "global-tweet-dialog-body");
  globalDialogDiv.setAttribute("style", "top: 20%; left: 311px;");

  var modelContentDiv = document.createElement("div");
  modelContentDiv.setAttribute("class", "modal-content");
  modelContentDiv.setAttribute("role", "document");

  var modelHeaderDiv = document.createElement("div");
  modelHeaderDiv.setAttribute("class", "modal-header");

  var titleElement = document.createElement("h3");
  titleElement.setAttribute("class", "modal-title");
  titleElement.setAttribute("id", "global-tweet-dialog-header");
  titleElement.innerHTML = title;

  var containerDiv = document.createElement("div");
  containerDiv.setAttribute("class", "modal-tweet-form-container");

  var closeButton = document.createElement("button");
  closeButton.setAttribute("type", "button");
  closeButton.setAttribute("class", "modal-btn modal-close js-close");
  closeButton.setAttribute("aria-controls", "global-tweet-dialog-dialog");
  closeButton.setAttribute("aria-describedby", "global-tweet-dialog-body");

  var span1 = document.createElement("span");
  span1.setAttribute("class", "Icon Icon--close Icon--medium");

  var span2 = document.createElement("span");
  span2.setAttribute("class", "visuallyhidden");
  span2.innerHTML = "Close";

  globalDiv.appendChild(globalDialogDiv);
  globalDialogDiv.appendChild(modelContentDiv);
  modelContentDiv.appendChild(modelHeaderDiv);
  modelContentDiv.appendChild(containerDiv);
  modelHeaderDiv.appendChild(titleElement);
  globalDialogDiv.appendChild(closeButton);
  closeButton.appendChild(span1);
  span1.appendChild(span2);

  /* add the content in the model box */
  containerDiv.innerHTML = htmlContent;

  /* add model to body of the page */
  document.body.appendChild(globalDiv);

  /* close model */
  $(closeButton).click(function(){
    globalDiv.remove();
  });
}

/* show secret status */
function createAndShowSecretStatus(tweet, title, color) {
  var actionList = $(tweet).find("div.ProfileTweet-actionList.js-actions")[0];

  /* if secret status already shown, remove it */
  if ($(actionList).find("#secretStatus").length > 0)
    $(actionList).find("#secretStatus")[0].remove();

  /* create secret status */
  var secretStatus = document.createElement("div");
  secretStatus.setAttribute("id", "secretStatus");
  secretStatus.setAttribute("class", "ProfileTweet-action ProfileTweet-action--analytic");

  var secretStatusButton = document.createElement("button");
  secretStatusButton.setAttribute("class", "ProfileTweet-actionButton js-actionButton");
  secretStatusButton.setAttribute("type", "button");
  secretStatus.appendChild(secretStatusButton);

  var tooltipDiv = document.createElement("div");
  tooltipDiv.setAttribute("class", "IconContainer js-tooltip");
  tooltipDiv.setAttribute("data-original-title", title);
  secretStatusButton.appendChild(tooltipDiv);

  var iconSpan = document.createElement("span");
  var icon = document.createElement("label");
  iconSpan.setAttribute("style", "font-size:14px; color:" + color + ";");

  icon.innerHTML = title;
  iconSpan.appendChild(icon);
  tooltipDiv.appendChild(iconSpan);

  var titleSpan = document.createElement("span");
  titleSpan.setAttribute("class", "u-hiddenVisually");
  titleSpan.innerHTML = title;
  tooltipDiv.appendChild(titleSpan);

  actionList.appendChild(secretStatus);
}

/* get tweets with images */
function checkForSecrets() {
  /* if mcl is not loaded yet (sometimes mcl and its functions are not yet ready here!)*/
  if (!mcl.deserializeHexStrToG1)
    return;

  /* get receiver tokens */
  chrome.runtime.sendMessage({request:CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE, keys:[CONSTANT.ITEMS.RECEIVER_TOKENS, CONSTANT.ITEMS.USER_ENTITY, CONSTANT.ITEMS.SHARED_KEY, CONSTANT.ITEMS.HVE_DECRYPTION_KEY]}, function(response){
    var receiverTokens = response[0];
    var userId = response[1].screen_name;
    var userSharedKey = response[2];
    var userDecryptionKey = response[3];

    /* get tweets that have images */
    var tweets = $(document).find("div.has-cards").has("div.AdaptiveMedia-photoContainer").has("img");

    /* loop over colleced tweets */
    for (var i = 0; i < tweets.length; i++) {
      /* if tweet is already checked for secrets */
      if (tweets[i]["attributes"]["check-done"] === "true")
        continue;

      /* mark the tweet as already checked for secrets in order to not redo the work! */
      tweets[i]["attributes"]["check-done"] = "true";

      /* get poster user id */
      var posterUserId = tweets[i]["attributes"]["data-screen-name"].value;

      var found = false;
      var sharedKey;
      var decryptionKey;
      var relationshipId;

      /* check if authenticated user is the poster user */
      if (userId === posterUserId) {
        sharedKey = userSharedKey;
        decryptionKey = userDecryptionKey;
        relationshipId = 0;
        found = true;
      }
      else {
        /* if authenticated user do not have receiver relationship with any other user */
        if (!receiverTokens) {
          console.log("No Receiver Tokens: You do not have any receiver relationship!");
          return;
        }

        /* check if authenticated user have recevier relationship with poster user */
        for (var j = 0; j < receiverTokens.length; j++) {
          if (receiverTokens[j].senderId === posterUserId) {
            sharedKey = receiverTokens[j].sharedKey;
            decryptionKey = receiverTokens[j].decryptionKey;
            relationshipId = receiverTokens[j].relationshipId;
            found = true;
            break;
          }
        }
      }

      if (!found)
        continue;

      // AHMED: used for performance evaluation [AHMED]
      /*
      test++;
      if (test > 1)
        return;
      */

      /* extract secret from the image */
      OPERATION.EXTRACT_SECRET(tweets[i], sharedKey, decryptionKey, relationshipId, createAndShowSecretStatus, function(secret, image, base64){
        /* if secret is found */
        if (secret) {
          /* check the type of the data */
          switch (HELPER.GET_SECRET_TYPE(secret)) {
            /* if image */
            case CONSTANT.SECRET_TYPE.IMAGE:
              /* display secret image once mouse is over the stego image */
              $(image).mouseover(function(){
                image.src = secret;
                $(image).mouseleave(function(){
                  image.src = base64;
                });
              });
              break;
            /* if file */
            case CONSTANT.SECRET_TYPE.FILE:
              var fileDownloadImage = HELPER.DOWNLOAD_FILE_AS_IMAGE(secret);
              /* download file when image is clicked */
              $(image).click(function(e){
                e.preventDefault();
                e.stopPropagation();

                /* link element */
                var link = document.createElement("a");
                link.href = secret;
                link.download = "secret";
                link.click();
              });
              /* display download file text once mouse is over the stego image */
              $(image).mouseover(function(){
                image.src = fileDownloadImage;
                $(image).mouseleave(function(){
                  image.src = base64;
                });
              });
              break;
            /* if text */
            case CONSTANT.SECRET_TYPE.TEXT:
              /* convert text to image */
              var textAsImage = HELPER.TEXT_AS_IMAGE(secret);
              /* display secret once mouse is over the stego image */
              $(image).mouseover(function(){
                image.src = textAsImage;
                $(image).mouseleave(function(){
                  image.src = base64;
                });
              });
              break;
            default:
          }
        }
      });
    }
  });
}
