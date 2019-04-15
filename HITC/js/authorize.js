$(document).ready(function(){
  /* set current screen */
  STORAGE.STORE(CONSTANT.UI.CURRENT_SCREEN, "authorize.html");

  /* if user did not sent authorization request or not yet authorized */
  if (!STORAGE.RETRIEVE(CONSTANT.UI.ACCESS_REQUESTED)) {
    /* set access requested status to true */
    STORAGE.STORE(CONSTANT.UI.ACCESS_REQUESTED, CONSTANT.BOOLEAN.TRUE);

    /* authenticate twitter account */
    OPERATION.AUTHENTICATE(function(response){
      if (response)
        ALERT.SUCCESS("Authentication Success", "Authentication succeeded.");
      else
        ALERT.ERROR("Authentication Failure", "Authentication failed.");
    });
  }
});

$("#authorize").click(function(){
  OPERATION.AUTHORIZE($("#pin").val(), function(response){
    if (response) {
      /* go to access page */
      window.location.href = "access.html";
    }
    else
      ALERT.ERROR("Authorization Failure", "Authorization failed.");
  });
});

$("#back").click(function(){
  /* go to start page */
  window.location.href = "start.html";
});
