// Where the app looks for published recipes and new releases.
export const GITHUB_REPO = 'tellu2/kitchen-collection';

/** GitHub Pages copy of data/, published by .github/workflows/pages.yml */
export const DEFAULT_SOURCE = 'https://tellu2.github.io/kitchen-collection/';

/** Releases with signed APKs, published by .github/workflows/release.yml */
export const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
export const RELEASES_PAGE = `https://github.com/${GITHUB_REPO}/releases/latest`;
