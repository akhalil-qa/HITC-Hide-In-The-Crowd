var ALERT = {

  /* time of displaying the alert */
  TIMEOUT: 5000,

  /* show success alert */
  SUCCESS: function (title, content){
    toastr.success(content, title, {timeOut: ALERT.TIMEOUT, positionClass: "toast-bottom-left"});
    console.log("[SUCCESS] " + "title: " + title + ": " + content);
  },

  /* show info alert */
  INFO: function (title, content){
    toastr.info(content, title, {timeOut: ALERT.TIMEOUT, positionClass: "toast-bottom-left"});
    console.log("[INFO] " + "title: " + title + ": " + content);
  },

  /* show warning alert */
  WARNING: function (title, content){
    toastr.warning(content, title, {timeOut: ALERT.TIMEOUT, positionClass: "toast-bottom-left"});
    console.log("[WARNING] " + "title: " + title + ": " + content);
  },

  /* show error alert */
  ERROR: function (title, content){
    toastr.error(content, title, {timeOut: ALERT.TIMEOUT, positionClass: "toast-bottom-left"});
    console.log("[ERROR] " + "title: " + title + ": " + content);
  }

};
