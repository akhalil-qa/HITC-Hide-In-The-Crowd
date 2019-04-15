$(document).ready(function(){
  /* set current screen */
  STORAGE.STORE(CONSTANT.UI.CURRENT_SCREEN, "register.html");

  /* display twitter screen name */
  $("#userId").val(STORAGE.RETRIEVE(CONSTANT.ITEMS.USER_ENTITY).screen_name);
});

$("#register").click(function(){
  var userId = STORAGE.RETRIEVE(CONSTANT.ITEMS.USER_ENTITY).screen_name;
  var password = $("#password").val();
  var secretPhrase = $("#secretPhrase").val();
  var hashtag = $("#hashtag").val();

  /* if password is not entered */
  if (password == "") {
    ALERT.WARNING("Missing Password", "No password was entered.");
    return;
  }

  /* if secret phrase is not entered */
  if (secretPhrase == "") {
    ALERT.WARNING("Missing Secret Phrase", "No secret phrase was entered.");
    return;
  }

  /* if hashtag is not entered */
  if (hashtag == "") {
    ALERT.WARNING("Missing Hashtag", "No hashtag was entered.");
    return;
  }

  /* check image before reading */
  if ($("#coverImage")[0].files.length != 1) {
    ALERT.WARNING("Single Image To Be Uploaded", "Please select one image only to be uploaded.");
    return;
  }

  /* read the image data */
  var image = document.createElement("img");
  var reader = new FileReader();
  reader.onload = function(){
    image.src = reader.result;

    image.onload = function(){
      /* register user */
      OPERATION.REGISTER(userId, password, secretPhrase, "#" + hashtag, image, function(response){
        if (response)
          ALERT.SUCCESS("Registration Completed", "User registered successfully.");
        else
          ALERT.ERROR("User Registration Failed", "Failed to register user!");
      });
    }
  }
  reader.readAsDataURL($("#coverImage")[0].files[0]);
});


$("#back").click(function(){
  /* go to start page */
  window.location.href = "access.html";
});
