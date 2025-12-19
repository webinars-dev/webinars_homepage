import { handleAnalyticsRequest } from '../server/analyticsHandler.mjs';

export default async function handler(req, res) {
  return handleAnalyticsRequest(req, res, { env: process.env });
}

