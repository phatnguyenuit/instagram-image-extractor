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

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function inspectSingleImage() {
    const article = document.querySelector(SELECTORS.ARTICLE);

    const imageElement = article.querySelector(SELECTORS.IMAGE);

    return [imageElement.src];
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

    const imageSources = [];

    while (document.querySelector(SELECTORS.RIGHT_NAV)) {
      let rightNav = document.querySelector(SELECTORS.RIGHT_NAV);
      const imageElements = article.querySelectorAll(SELECTORS.IMAGE);

      [...imageElements]
        .map((imageElement) => imageElement.src)
        .forEach((src) => {
          if (imageSources.includes(src)) {
            return;
          }

          imageSources.push(src);
        });

      rightNav.click();

      await sleep(1000);
      rightNav = document.querySelector(SELECTORS.RIGHT_NAV);
    }

    return imageSources;
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
    inspectImages().then((imageSources) => {
      imageSources.forEach((imageSource) => {
        window.open(imageSource, "_blank");
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
