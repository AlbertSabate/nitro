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
    return void 0;
  }
  return body.encoding === "base64" ? decodeURIComponent(Buffer.from(body.data, "base64").toString("utf8")) : body.data;
}
function normalizeIncomingHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, keyValues]) => [
      key,
      keyValues.map(({ value }) => value).pop()
    ])
  );
}
function normalizeOutgoingHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => !["content-length"].includes(key)).map(([key, v]) => [
      key,
      Array.isArray(v) ? v.map((value) => ({ key, value })) : [{ key, value: v.toString() }]
    ])
  );
}
function getFullUrl(uri, querystring) {
  return uri + (querystring ? "?" + querystring : "");
}
