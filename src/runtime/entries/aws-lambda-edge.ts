import type {
  CloudFrontHeaders,
  Context,
  CloudFrontRequestEvent,
  CloudFrontResultResponse,
} from "aws-lambda";
import "#internal/nitro/virtual/polyfill";
import { nitroApp } from "../app";
import { normalizeLambdaOutgoingBody } from "../utils.lambda";

export const handler = async function handler(
  event: CloudFrontRequestEvent,
  context: Context
): Promise<CloudFrontResultResponse> {
  const request = event.Records[0].cf.request;
  const url = getFullUrl(request.uri, request.querystring);

  const r = await nitroApp.localCall({
    event,
    url,
    context,
    headers: normalizeIncomingHeaders(request.headers),
    method: request.method,
    body: normalizeBody(request.body),
  });

  const outgoingHeaders = normalizeOutgoingHeaders(r.headers);
  const outgoingBody = (await normalizeLambdaOutgoingBody(r.body, r.headers))
    .body;

  return {
    status: r.status.toString(),
    headers: outgoingHeaders,
    body: outgoingBody,
  };
};

function normalizeBody(
  body: CloudFrontRequestEvent["Records"][0]["cf"]["request"]["body"]
) {
  if (body === undefined) {
    return undefined;
  }

  return body.encoding === "base64"
    ? decodeURIComponent(Buffer.from(body.data, "base64").toString("utf8"))
    : body.data;
}

function normalizeIncomingHeaders(headers: CloudFrontHeaders) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, keyValues]) => {
      if (keyValues.length > 1) {
        return [key, keyValues.map(({ value }) => value)];
      }

      return [key, keyValues.map(({ value }) => value)[0]];
    })
  );
}

function normalizeOutgoingHeaders(
  headers: Record<string, string | number | string[] | undefined>
): CloudFrontHeaders {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key]) => !["content-length"].includes(key))
      .map(([key, v]) => [
        key,
        Array.isArray(v)
          ? v.map((value) => ({ key, value }))
          : [{ key, value: v.toString() }],
      ])
  );
}

function getFullUrl(uri: string, querystring: string | undefined) {
  return uri + (querystring ? "?" + querystring : "");
}