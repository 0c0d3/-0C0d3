const blockListUrls = [
  "https://easylist.to/easylist/easylist.txt",
  "https://easylist.to/easylist/easyprivacy.txt",
  "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt",
  "https://filters.adtidy.org/extension/ublock/filters/14_optimized.txt",
  "https://easylist-downloads.adblockplus.org/fanboy-annoyance.txt",
  "https://filters.adtidy.org/extension/ublock/filters/4.txt",
  "https://filters.adtidy.org/extension/ublock/filters/101_optimized.txt",
  "https://raw.githubusercontent.com/easylist/easylist/refs/heads/master/custom-lists/youtube-combo-list.txt",
  "https://raw.githubusercontent.com/easylist/easylist/refs/heads/master/custom-lists/bing-with-no-copilt.txt",
  "https://raw.githubusercontent.com/easylist/easylist/refs/heads/master/custom-lists/youtube-nochat.txt",
  "https://raw.githubusercontent.com/easylist/easylist/refs/heads/master/custom-lists/youtube-paid-promotion-nag.txt",
  "https://raw.githubusercontent.com/easylist/easylist/refs/heads/master/custom-lists/youtube-playables.txt",
  "https://raw.githubusercontent.com/easylist/easylist/refs/heads/master/custom-lists/youtube-shorts.txt",
  "https://raw.githubusercontent.com/easylist/easylist/refs/heads/master/custom-lists/twitter-no-right-side-nags.txt",
  "https://raw.githubusercontent.com/easylist/easylist/refs/heads/master/custom-lists/google_geolocation_popup.txt",
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
  "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_10_Useful/filter.txt"
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

  // Fetch block lists in parallel and gather results
  const fetchPromises = blockListUrls.map(url => fetchBlockList(url));
  const results = await Promise.all(fetchPromises);

  results.forEach(domains => {
    domains.forEach(domain => rulesSet.add(domain)); // Ensure uniqueness
  });

  return Array.from(rulesSet); // Convert Set back to Array for return
}

// Load the rules into webRequest
generateRules().then(domains => {
  if (domains.length > 0) {
    const urlPatterns = domains.map(domain => `*://${domain}/*`);
    browser.webRequest.onBeforeRequest.addListener(
      (details) => ({ cancel: true }),
      { urls: urlPatterns },
      ["blocking"]
    );
  }
});
