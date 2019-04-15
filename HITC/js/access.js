$(document).ready(function(){
  /* set current screen */
  STORAGE.STORE(CONSTANT.UI.CURRENT_SCREEN, "access.html");
});

$("#register").click(function(){
  /* go to register page */
  window.location.href = "register.html";
});

$("#login").click(function(){
  /* go to login page */
  window.location.href = "login.html";
});

$("#back").click(function(){
  /* go to start page */
  window.location.href = "start.html";
});
