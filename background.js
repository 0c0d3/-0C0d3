// Block fonts and images
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        const blockedTypes = ["font", "image"];

        // Block specified resource types (fonts and images)
        if (blockedTypes.includes(details.type)) {
            console.log("Blocked resource:", details.url);
            return { cancel: true }; // Block the request
        }

        return {}; // Allow other requests (including XHR)
    },
    { urls: ["<all_urls>"] }, // Apply to all URLs
    ["blocking"]
);

// Block outgoing cookies by removing the Cookie header
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        console.log("Blocked outgoing cookies for:", details.url);

        for (let i = 0; i < details.requestHeaders.length; ++i) {
            if (details.requestHeaders[i].name.toLowerCase() === "cookie") {
                details.requestHeaders.splice(i, 1); // Remove the cookie header
                break;
            }
        }

        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["<all_urls>"] }, // Apply to all URLs
    ["blocking", "requestHeaders"]
);

// Block incoming cookies by removing the Set-Cookie header
chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        console.log("Blocked incoming cookies for:", details.url);

        for (let i = 0; i < details.responseHeaders.length; ++i) {
            if (details.responseHeaders[i].name.toLowerCase() === "set-cookie") {
                details.responseHeaders.splice(i, 1); // Remove the Set-Cookie header
                break;
            }
        }

        return { responseHeaders: details.responseHeaders };
    },
    { urls: ["<all_urls>"] }, // Apply to all URLs
    ["blocking", "responseHeaders"]
);

// Apply rules when the extension is loaded
console.log("Blocking all fonts and images, allowing XHR and cookies.");

