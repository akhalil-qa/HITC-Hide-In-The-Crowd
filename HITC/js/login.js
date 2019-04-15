$(document).ready(function(){
  /* set current screen */
  STORAGE.STORE(CONSTANT.UI.CURRENT_SCREEN, "login.html");

  /* display twitter screen name */
  $("#userId").val(STORAGE.RETRIEVE(CONSTANT.ITEMS.USER_ENTITY).screen_name);
});

$("#login").click(function(){
  var password = $("#password").val();
  var secretPhrase = $("#secretPhrase").val();
  var hashtag = $("#hashtag").val();

  /* read profile image url */
  //var profileImageUrl = STORAGE.RETRIEVE(CONSTANT.ITEMS.USER_ENTITY).profile_image_url_https;
  //profileImageUrl = profileImageUrl.replace("normal", "400x400");

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

  /* login user */
  OPERATION.LOGIN(password, secretPhrase, hashtag, function(response){
    if (response) {
      /* go to main page */
      window.location.href = "main.html";
    }
    else
      ALERT.ERROR("Login Failed", "Failed to login!");
  });
});

$("#back").click(function(){
  /* go to start page */
  window.location.href = "access.html";
});
