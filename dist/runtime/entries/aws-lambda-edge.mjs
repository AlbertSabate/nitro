import "#internal/nitro/virtual/polyfill";
import { nitroApp } from "../app.mjs";
import { normalizeLambdaOutgoingBody } from "../utils.lambda.mjs";
export const handler = async function handler2(event, context) {
  const request = event.Records[0].cf.request;
  const url = getFullUrl(request.uri, request.querystring);
  const r = await nitroApp.localCall({
    event,
    url,
    context,
    headers: normalizeIncomingHeaders(request.headers),
    method: request.method,
    query: request.querystring,
    body: normalizeBody(request.body)
  });
  return {
    status: r.status.toString(),
    headers: normalizeOutgoingHeaders(r.headers),
    body: (await normalizeLambdaOutgoingBody(r.body, r.headers)).body
  };
};
function normalizeBody(body) {
  if (body === void 0) {
    return body;
  }
  const bodyString = body;
  if (body.encoding !== void 0 && body.encoding === "base64") {
    bodyString.data = Buffer.from(body.data, "base64").toString("utf8");
    bodyString.data = decodeURIComponent(bodyString.data);
  }
  return bodyString;
}
function normalizeIncomingHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, keyValues]) => [
      key,
      keyValues.map((kv) => kv.value)
    ])
  );
}
function normalizeOutgoingHeaders(headers) {
  const entries = Object.fromEntries(
    Object.entries(headers).filter(([key]) => !["content-length"].includes(key))
  );
  return Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.map((value) => ({ value })) : [{ value: v.toString() }]
    ])
  );
}
function getFullUrl(uri, querystring) {
  return uri + (querystring ? "?" + querystring : "");
}
