$(document).ready(function(){
  /* clear twitter authentication and authorization stored data */
  STORAGE.CLEAR(CONSTANT.UI.ACCESS_REQUESTED);
  STORAGE.CLEAR(CONSTANT.TWITTER.OAUTH_TOKEN);
  STORAGE.CLEAR(CONSTANT.TWITTER.OAUTH_TOKEN_SECRET);

  /* set current screen */
  STORAGE.STORE(CONSTANT.UI.CURRENT_SCREEN, "start.html");
});

$("#access").click(function(){
  /* go to authorize page */
  window.location.href = "authorize.html";
});
