import { handleAdminsRequest } from '../server/adminsHandler.mjs';

export default async function handler(req, res) {
  return handleAdminsRequest(req, res, { env: process.env });
}

