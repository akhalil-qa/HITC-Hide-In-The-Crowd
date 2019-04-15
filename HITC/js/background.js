/* list of supported domains */
var SUPPORTED_DOMAINS = ["twitter.com"];

/* check if domain supported by extension */
function domainIsSupported(domain) {
  for (var i = 0; i < SUPPORTED_DOMAINS.length; i++)
    if (domain.indexOf(SUPPORTED_DOMAINS[i]) > -1)
      return true;

  return false;
}

/* listen to url changes */
chrome.tabs.onUpdated.addListener(function(tabId, data, tab){
  /* activate icon of the extension once twitter is open */
  var domain = new URL(tab.url).hostname;
  if (domainIsSupported(domain))
    chrome.pageAction.show(tabId);
});

/* listen to content script messages */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  /* read request type */
  switch (message.request) {
    /* read from localStorage */
    case CONSTANT.MESSAGE.RETRIEVE_LOCAL_STORAGE:
      var values = [];
      /* read the values requested from the localStorage */
      for (var i = 0; i < message.keys.length; i++) {
        values[i] = STORAGE.RETRIEVE(message.keys[i]);
      }
      sendResponse(values); /* return the requested value */
      break;
    /* store in localStorage */
    case CONSTANT.MESSAGE.STORE_LOCAL_STORAGE:
      for (var i = 0; i < message.keys.length; i++) {
        STORAGE.STORE(message.keys[i], message.values[i]);
      }
      break;
    default:
      console.log("Unknown message sent to background script.");
  }
});
