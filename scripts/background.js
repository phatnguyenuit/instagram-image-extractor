/*global chrome*/
function inject() {
  // SUPPORTED URLs
  const URL_MATCHES = [/https:\/\/www.instagram.com\/p\/.*/];

  const SELECTORS = {
    LEFT_NAV: ".coreSpriteLeftChevron",
    RIGHT_NAV: ".coreSpriteRightChevron",
    ARTICLE: "article",
    IMAGE: "img[srcset]",
  };

  function isMatchedUrl(url) {
    return URL_MATCHES.some((matchRegex) => matchRegex.test(url));
  }

  function extractImageSources(srcset) {
    const sources = srcset
      .split(",")
      .map((srcAndResolution) => srcAndResolution.split(" "))
      .reduce(
        (result, [src, resolution]) => ({
          ...result,
          [resolution]: src,
        }),
        {}
      );

    return sources;
  }

  function getHighestResolutionImageSrc(sources) {
    const resolutions = Object.keys(sources);

    const highestResolution = resolutions.sort((res1, res2) => {
      const v1 = Number(res1.replace("w", ""));
      const v2 = Number(res2.replace("w", ""));

      return v2 - v1;
    })[0];

    return sources[highestResolution];
  }

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function inspectSingleImage() {
    const article = document.querySelector(SELECTORS.ARTICLE);

    const image = article.querySelector(SELECTORS.IMAGE);

    return [getHighestResolutionImageSrc(extractImageSources(image.srcset))];
  }

  async function resetImageCollectionNavigation() {
    let leftNav = document.querySelector(SELECTORS.LEFT_NAV);

    while (leftNav) {
      leftNav.click();

      await sleep(1000);
      leftNav = document.querySelector(SELECTORS.LEFT_NAV);
    }
  }

  async function inspectImageCollection() {
    const article = document.querySelector(SELECTORS.ARTICLE);

    //   Reset collection navigation first
    await resetImageCollectionNavigation();

    const listOfSourceSets = [];

    while (document.querySelector(SELECTORS.RIGHT_NAV)) {
      let rightNav = document.querySelector(SELECTORS.RIGHT_NAV);
      const images = article.querySelectorAll(SELECTORS.IMAGE);

      [...images]
        .map((img) => img.srcset)
        .forEach((srcset) => {
          if (listOfSourceSets.includes(srcset)) {
            return;
          }

          listOfSourceSets.push(srcset);
        });

      rightNav.click();

      await sleep(1000);
      rightNav = document.querySelector(SELECTORS.RIGHT_NAV);
    }

    return listOfSourceSets;
  }

  async function inspectImages() {
    const rightNav = document.querySelector(SELECTORS.RIGHT_NAV);
    const leftNav = document.querySelector(SELECTORS.LEFT_NAV);

    if (leftNav || rightNav) {
      return inspectImageCollection();
    }

    return inspectSingleImage();
  }

  if (isMatchedUrl(window.location.href)) {
    inspectImages().then((listOfSourceSets) => {
      const links = listOfSourceSets
        .map(extractImageSources)
        .map(getHighestResolutionImageSrc);

      links.forEach((link) => {
        window.open(link, "_blank");
      });
    });
  }
}

function executeScript(tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: inject,
  });
}

chrome.action.onClicked.addListener(executeScript);
