import { isPlainObject, Tree } from "@weborigami/async-tree";

/**
 * Return a posts tree for the given WordPress site and credentials.
 *
 * @param {string} site
 */
export default async function wp(site, credentials) {
  if (!site.startsWith("https:")) {
    if (!site.startsWith("//")) {
      site = `//${site}`;
    }
    site = `https:${site}`;
  }

  if (Tree.isTreelike(credentials) && !isPlainObject(credentials)) {
    credentials = await Tree.plain(credentials);
  }

  // Construct a "Basic" authorization header from the credentials. This is the
  // WordPress username and application password encoded in base64.
  const { username, applicationPassword } = credentials;
  const base64Credentials = btoa(`${username}:${applicationPassword}`);
  const authorization = `Basic ${base64Credentials}`;

  // For now, we only support retrieving posts.
  return postsTree(site, authorization);
}

/**
 * Given a site and authorization header, return a tree of post objects.
 *
 * @param {string} site
 * @param {string} authorization
 * @returns {AsyncTree}
 */
function postsTree(site, authorization) {
  return {
    // Return the post object for the given ID.
    async get(id) {
      const query = `posts/${id}`;
      const post = await fetchWordPress(site, query, authorization);
      return post;
    },

    // Return the post IDs.
    async keys() {
      const query = "posts?_fields=id";
      const posts = await fetchWordPress(site, query, authorization);
      const ids = posts.map((post) => post.id);
      return ids;
    },
  };
}

/**
 * Issue a query to the WordPress REST API and return the response data.
 *
 * @param {string} site
 * @param {string} query
 * @param {string} authorization
 */
async function fetchWordPress(site, query, authorization) {
  const url = `${site}/wp-json/wp/v2/${query}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authorization,
    },
  });
  if (!response.ok) {
    throw new Error(`Couldn't fetch ${url}, error status: ${response.status}`);
  }
  const data = await response.json();
  return data;
}
