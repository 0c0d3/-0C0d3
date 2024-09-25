const blockListUrls = [
  "https://raw.githubusercontent.com/betterwebleon/international-list/refs/heads/master/filters.txt",
  "https://raw.githubusercontent.com/no-cmyk/Search-Engine-Spam-Domains-Blocklist/master/blocklist.txt",
  "https://raw.githubusercontent.com/migueldemoura/ublock-umatrix-rulesets/master/Hosts/ads-tracking",
  "https://raw.githubusercontent.com/kowith337/PersonalFilterListCollection/master/filterlist/other/SurvivedTrackingLinkWarning.txt",
  "https://filters.adtidy.org/windows/filters/17.txt",
  "https://easylist-downloads.adblockplus.org/v3/full/abp-filters-anti-cv.txt",
  "https://easylist-downloads.adblockplus.org/v3/full/easylistspanish+easylist.txt",
  "https://easylist-downloads.adblockplus.org/v3/full/easyprivacy.txt",
  "https://easylist-downloads.adblockplus.org/v3/full/fanboy-notifications.txt",
  "https://easylist-downloads.adblockplus.org/v3/full/fanboy-social.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-combo-list.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-nochat.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-playables.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-shorts.txt",
  "https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/refs/heads/master/BaseFilter/sections/adservers_firstparty.txt",
  "https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/refs/heads/master/BaseFilter/sections/adservers.txt",
  "https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/refs/heads/master/BaseFilter/sections/antiadblock.txt",
  "https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/refs/heads/master/BaseFilter/sections/content_blocker.txt",
  "https://raw.githubusercontent.com/Kees1958/W3C_annual_most_used_survey_blocklist/refs/heads/master/EU_US_MV3_most_common_ad%2Btracking_networks.txt",
  "https://raw.githubusercontent.com/Kees1958/W3C_annual_most_used_survey_blocklist/refs/heads/master/Personal_Blocklist_ABP.txt",
  "https://raw.githubusercontent.com/Kees1958/W3C_annual_most_used_survey_blocklist/refs/heads/master/URL_tracking_parameters.txt",
  "https://raw.githubusercontent.com/Kees1958/W3C_annual_most_used_survey_blocklist/refs/heads/master/World%20most%20used%20advertising%20and%20tracking%20networks.txt",
  "https://raw.githubusercontent.com/Kees1958/W3C_annual_most_used_survey_blocklist/refs/heads/master/youtube_AG_rules.txt",
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/refs/heads/master/filters/filter_9_Spanish/filter.txt",
  "https://raw.githubusercontent.com/yokoffing/filterlists/refs/heads/main/privacy_essentials.txt",
  "https://raw.githubusercontent.com/yokoffing/filterlists/refs/heads/main/click2load.txt",
  "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/adblock/pro.mini.txt",
  "https://raw.githubusercontent.com/yokoffing/filterlists/refs/heads/main/annoyance_list.txt",
  "https://raw.githubusercontent.com/iam-py-test/uBlock-combo/refs/heads/main/list.txt",
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_2_Base/filter.txt",
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_4_Social/filter.txt",
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_17_TrackParam/filter.txt",
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_14_Annoyances/filter.txt",
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_18_Annoyances_Cookies/filter.txt",
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_22_Annoyances_Widgets/filter.txt",
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_10_Useful/filter.txt",
  "https://raw.githubusercontent.com/easylist/easylist/master/custom-lists/youtube-paid-promotion-nag.txt"
];

// Fetch blocklist content
async function fetchBlockList(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const text = await response.text();
    return text.split("\n");
  } catch (error) {
    console.error(`Error fetching or processing ${url}: ${error.message}`);
    return [];
  }
}

// Generate rules from blocklists
async function generateRules() {
  const rulesSet = new Set();
  const cosmeticRules = [];
  const fetchPromises = blockListUrls.map(url => fetchBlockList(url));
  const results = await Promise.all(fetchPromises);

  results.forEach(lines => {
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Handle network blocking rules
      if (trimmedLine && !trimmedLine.startsWith("#") && !trimmedLine.startsWith("0.0.0.0") && !trimmedLine.startsWith("127.0.0.1")) {
        const domain = trimmedLine.replace(/^(0\.0\.0\.0|127\.0\.0\.1)\s+/, "");
        rulesSet.add(domain);
      }
      
      // Handle cosmetic rules
      if (trimmedLine.startsWith("##")) {
        const cosmeticFilter = trimmedLine.substring(2).trim();
        cosmeticRules.push(cosmeticFilter);
      }
    });
  });

  return { networkRules: Array.from(rulesSet), cosmeticRules };
}

// Function to inject cosmetic CSS rules
async function injectCosmeticCSS(cosmeticRules) {
  const css = cosmeticRules.map(rule => `${rule} { display: none !important; }`).join("\n");

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    const tabId = tabs[0].id;
    
    // Check if the extension has host permissions for this tab
    const hasPermission = await browser.permissions.contains({
      permissions: ["scripting"],
      origins: ["*://*/*"] // This ensures we can inject into any page
    });

    if (hasPermission) {
      try {
        await browser.scripting.insertCSS({
          target: { tabId },
          css: css
        });
        console.log("Cosmetic CSS injected successfully.");
      } catch (err) {
        console.error(`Failed to inject CSS: ${err.message}`);
      }
    } else {
      console.warn("Missing host permission for the tab.");
    }
  } else {
    console.warn("No active tab found.");
  }
}

// Load and apply rules
async function loadRules() {
  const { networkRules, cosmeticRules } = await generateRules();

  if (networkRules.length > 0) {
    const urlPatterns = networkRules.map(domain => `*://${domain}/*`);
    
    // Remove existing listeners
    browser.webRequest.onBeforeRequest.removeListener(handleRequest);
    
    // Add new listener
    browser.webRequest.onBeforeRequest.addListener(
      handleRequest,
      { urls: urlPatterns },
      ["blocking"]
    );

    console.log(`Loaded ${networkRules.length} network rules.`);
  } else {
    console.log("No network rules to load.");
  }

  // Inject cosmetic CSS
  if (cosmeticRules.length > 0) {
    await injectCosmeticCSS(cosmeticRules);
    console.log(`Loaded ${cosmeticRules.length} cosmetic rules.`);
  } else {
    console.log("No cosmetic rules to load.");
  }
}

// Handle request blocking
function handleRequest(details) {
  return { cancel: true }; // Block the request
}

// Initial load of rules
loadRules();

// Set interval to update rules every 5 minutes
setInterval(loadRules, 300000);
