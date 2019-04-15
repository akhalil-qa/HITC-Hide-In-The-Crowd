$(document).ready(function(){
  /* read current screen */
  var currentScreen = STORAGE.RETRIEVE(CONSTANT.UI.CURRENT_SCREEN);

  /* route to the current screen */
  if (!currentScreen) /* if current screen is null */
    window.location.href = "start.html";
  else
    window.location.href = currentScreen;

});
