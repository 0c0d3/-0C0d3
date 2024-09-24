const blockListUrls = [
  "https://easylist.to/easylist/easylist.txt",
  "https://easylist.to/easylist/easyprivacy.txt",
  "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-combo-list.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-nochat.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-playables.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-shorts.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-paid-promotion-nag.txt"
];

async function fetchBlockList(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const text = await response.text();
    return text.split("\n").filter(line =>
      line && !line.startsWith("#") && !line.startsWith("0.0.0.0")
    ).map(line => line.trim().replace(/^(0\.0\.0\.0|127\.0\.0\.1)\s+/, ""));
  } catch (error) {
    console.error(`Error fetching or processing ${url}: ${error.message}`);
    return [];
  }
}

async function generateRules() {
  const rulesSet = new Set();
  const fetchPromises = blockListUrls.map(url => fetchBlockList(url));
  const results = await Promise.all(fetchPromises);

  results.forEach(domains => {
    domains.forEach(domain => rulesSet.add(domain));
  });

  return Array.from(rulesSet);
}

async function loadRules() {
  const domains = await generateRules();
  if (domains.length > 0) {
    const urlPatterns = domains.map(domain => `*://${domain}/*`);
    
    // Remove existing listeners
    browser.webRequest.onBeforeRequest.removeListener(handleRequest);
    
    // Add new listener
    browser.webRequest.onBeforeRequest.addListener(
      handleRequest,
      { urls: urlPatterns },
      ["blocking"]
    );

    console.log(`Loaded ${domains.length} rules.`);
  } else {
    console.log("No domains to load.");
  }
}

function handleRequest(details) {
  return { cancel: true }; // Block the request
}

// Initial load of rules
loadRules();

// Set interval to update rules every 5 minutes
setInterval(loadRules, 300000);
