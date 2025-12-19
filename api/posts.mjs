import { handlePostsRequest } from '../server/postsHandler.mjs';

export default async function handler(req, res) {
  return handlePostsRequest(req, res, { env: process.env });
}

