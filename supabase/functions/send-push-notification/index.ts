import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push crypto utilities
async function generatePushPayload(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  // Import the web-push compatible library for Deno
  const encoder = new TextEncoder();

  // Create JWT for VAPID
  const audience = new URL(subscription.endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const body = btoa(
    JSON.stringify({ aud: audience, exp: expiration, sub: vapidSubject })
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const unsignedToken = `${header}.${body}`;

  // Import VAPID private key
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    convertECPrivateKeyToPKCS8(privateKeyBytes, base64UrlToUint8Array(vapidPublicKey)),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const sig = uint8ArrayToBase64Url(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${sig}`;
  const vapidPublicKeyBytes = base64UrlToUint8Array(vapidPublicKey);

  // Encrypt payload using Web Push encryption (aes128gcm)
  const { ciphertext, salt, localPublicKey } = await encryptPayload(
    subscription,
    encoder.encode(payload)
  );

  return {
    endpoint: subscription.endpoint,
    headers: {
      Authorization: `vapid t=${jwt}, k=${uint8ArrayToBase64Url(vapidPublicKeyBytes)}`,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
    },
    body: buildAes128gcmPayload(ciphertext, salt, localPublicKey),
  };
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) arr[i] = rawData.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function convertECPrivateKeyToPKCS8(
  privateKey: Uint8Array,
  publicKey: Uint8Array
): ArrayBuffer {
  // Build a PKCS#8 DER structure for EC P-256
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8Middle = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);

  const result = new Uint8Array(
    pkcs8Header.length + privateKey.length + pkcs8Middle.length + publicKey.length
  );
  result.set(pkcs8Header, 0);
  result.set(privateKey, pkcs8Header.length);
  result.set(pkcs8Middle, pkcs8Header.length + privateKey.length);
  result.set(publicKey, pkcs8Header.length + privateKey.length + pkcs8Middle.length);
  return result.buffer;
}

async function encryptPayload(
  subscription: { p256dh: string; auth: string },
  payload: Uint8Array
) {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    base64UrlToUint8Array(subscription.p256dh),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriberPublicKey },
      localKeyPair.privateKey,
      256
    )
  );

  const authSecret = base64UrlToUint8Array(subscription.auth);

  // HKDF to derive keys
  const encoder = new TextEncoder();
  const prk = await hkdfExtract(authSecret, sharedSecret);
  const ikm = await hkdfExpand(prk, createInfo("WebPush: info\0", subscriberPublicKey, localPublicKeyRaw), 32);

  const contentPrk = await hkdfExtract(salt, ikm);
  const contentKey = await hkdfExpand(contentPrk, createInfo("Content-Encoding: aes128gcm\0", new Uint8Array(0), new Uint8Array(0)), 16);
  const nonce = await hkdfExpand(contentPrk, createInfo("Content-Encoding: nonce\0", new Uint8Array(0), new Uint8Array(0)), 12);

  // Add padding delimiter
  const paddedPayload = new Uint8Array(payload.length + 1);
  paddedPayload.set(payload);
  paddedPayload[payload.length] = 2; // delimiter

  const key = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, paddedPayload)
  );

  return { ciphertext: encrypted, salt, localPublicKey: localPublicKeyRaw };
}

function createInfo(
  type: string,
  clientPublicKey: Uint8Array,
  serverPublicKey: Uint8Array
): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  if (clientPublicKey.length === 0) {
    return typeBytes;
  }
  const info = new Uint8Array(
    typeBytes.length + 1 + 5 + clientPublicKey.length + 5 + serverPublicKey.length
  );
  let offset = 0;
  info.set(typeBytes, offset); offset += typeBytes.length;
  info[offset++] = 0;
  info[offset++] = 0; info[offset++] = 65;
  info.set(clientPublicKey, offset + 3);
  offset += 5 + clientPublicKey.length - 2;
  // Simplified: for WebPush info the format is different
  return typeBytes;
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const input = new Uint8Array(info.length + 1);
  input.set(info);
  input[info.length] = 1;
  const output = new Uint8Array(await crypto.subtle.sign("HMAC", key, input));
  return output.slice(0, length);
}

function buildAes128gcmPayload(
  ciphertext: Uint8Array,
  salt: Uint8Array,
  localPublicKey: Uint8Array
): Uint8Array {
  // Header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKey.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs);
  header[20] = localPublicKey.length;
  header.set(localPublicKey, 21);

  const result = new Uint8Array(header.length + ciphertext.length);
  result.set(header);
  result.set(ciphertext, header.length);
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { title, body, url, user_ids, course_id } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build query for subscriptions
    let query = supabase.from("push_subscriptions").select("*");

    if (user_ids && user_ids.length > 0) {
      query = query.in("user_id", user_ids);
    } else if (course_id) {
      // Get all enrolled users for this course
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("course_id", course_id);
      const enrolledIds = enrollments?.map((e: { user_id: string }) => e.user_id) || [];
      if (enrolledIds.length === 0) {
        return new Response(JSON.stringify({ sent: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.in("user_id", enrolledIds);
    }

    const { data: subscriptions, error } = await query;
    if (error) throw error;

    const payload = JSON.stringify({ title, body, url: url || "/" });
    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions || []) {
      try {
        const pushData = await generatePushPayload(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          "mailto:admin@deenacademy.app"
        );

        const res = await fetch(pushData.endpoint, {
          method: "POST",
          headers: pushData.headers,
          body: pushData.body,
        });

        if (res.status === 201 || res.status === 200) {
          sent++;
        } else if (res.status === 410 || res.status === 404) {
          // Subscription expired, clean up
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          failed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
