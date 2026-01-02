# Gmail OAuth and API Issues

## Common Gmail API Errors and Fixes

### Error: 401 Unauthorized - Invalid Authentication Credentials

**Symptom:**
```
Gmail API error: 401 Request had invalid authentication credentials.
Expected OAuth 2 access token, login cookie or other valid authentication credential.
```

**Possible Causes:**

1. **Authorization Header Truncation (FIXED)**
   - **Problem:** Token was being truncated to first 20 characters
   - **Location:** `packages/mcp-gmail/src/utils/gmail-client.ts` line 129
   - **Before:** `'Authorization': 'Bearer ${token.substring(0, 20)}...'`
   - **After:** `'Authorization': 'Bearer ${token}'`
   - **Fix Date:** 2026-01-02

2. **Invalid Token Format**
   - Token might be expired
   - Token might not have required scopes
   - Token might be corrupted

3. **OAuth Broker Issues**
   - Token not stored correctly in KV
   - Token refresh failing
   - OAuth flow not completed

**Debugging Steps:**

1. **Check token fetch logs:**
   ```powershell
   cd packages\mcp-gateway
   wrangler tail --format pretty | Select-String "GMAIL-TOKEN"
   ```

2. **Verify token is received:**
   - Look for: `✅ Token received (length: XXX)`
   - Check: `Token expires_at: YYYY-MM-DDTHH:MM:SS.ZZZZ`

3. **Check Gmail API request:**
   - Look for: `🌐 Making request to: https://www.googleapis.com/gmail/v1/...`
   - Check response: `Response: XXX YYY in ZZZms`

4. **Verify OAuth broker has valid token:**
   ```powershell
   # Test broker directly
   $body = @{ user_id = "jason" } | ConvertTo-Json
   Invoke-WebRequest -Uri "https://oauth-broker.jason-leacox.workers.dev/token/google" `
     -Method POST -Headers @{"Content-Type" = "application/json"} -Body $body
   ```

## Base64 Encoding Issues

### Error: Base64 Encoding Error in Claude API

**Symptom:**
```
Claude API error: Invalid base64 encoding
Error trying to parse PNG attachment - base64 encoding issue
```

**Root Cause:**
- Gmail API returns **base64url**-encoded data (uses `-` and `_`)
- Claude API expects **standard base64**-encoded data (uses `+` and `/`)
- Images were being sent without conversion

**Fix:**
Convert base64url to standard base64 before sending to Claude:

```typescript
// In packages/mcp-gmail/src/tools/extract-dates.ts
const attachmentData = await getAttachment(messageId, att.attachmentId, config);
// Convert base64url to standard base64 for Claude API
const base64Data = attachmentData.data.replace(/-/g, '+').replace(/_/g, '/');
imageAttachments.push({
  filename: att.filename,
  imageData: base64Data,  // Now in standard base64 format
  mimeType: att.mimeType,
});
```

**Why This Happens:**
- Gmail API uses base64url encoding (URL-safe, RFC 4648 §5)
- Claude API expects standard base64 encoding (RFC 4648 §4)
- PDFs were already being converted (line 519), but images were not

**Cost Impact:**
- ✅ **No cost increase** - same data size, same tokens
- ✅ **Format conversion only** - happens locally, free
- ✅ **Enables functionality** - images can now be processed

## Service Bindings for Gmail

**Current Status:** Gmail still uses HTTP fetch (not Service Bindings yet)

**Future Improvement:**
- Update `getAccessToken` in `packages/mcp-gmail/src/utils/gmail-client.ts`
- Add Service Binding support (like GitHub)
- Will reduce latency and eliminate billing for token fetches

**See:** [Service Bindings Guide](../architecture/SERVICE_BINDINGS_GUIDE.md)

## OAuth Broker Token Refresh

**How It Works:**
1. OAuth broker stores tokens in Cloudflare KV
2. Tokens are automatically refreshed when expired
3. Google tokens are always refreshed to ensure latest scopes
4. GitHub tokens don't have refresh tokens (OAuth Apps)

**Troubleshooting Token Refresh:**

1. **Check if token exists in KV:**
   ```powershell
   cd packages\oauth-broker
   wrangler kv key get --namespace-id=f6553e7719f64e30a230177f152b6db1 --remote "jason_google_token"
   ```

2. **Check broker logs:**
   ```powershell
   cd packages\oauth-broker
   wrangler tail --format pretty | Select-String "token|refresh"
   ```

3. **Verify OAuth flow completed:**
   - Visit: `https://oauth-broker.jason-leacox.workers.dev/auth/google`
   - Complete OAuth flow
   - Token should be stored in KV

## Common Issues Summary

| Issue | Symptom | Fix | Status |
|-------|---------|-----|--------|
| Token truncation | 401 Unauthorized | Use full token in Authorization header | ✅ Fixed |
| Base64 encoding | Claude API base64 error | Convert base64url to base64 | ✅ Fixed |
| Missing token | No token available | Complete OAuth flow | ⚠️ User action needed |
| Expired token | 401 Unauthorized | OAuth broker auto-refreshes | ✅ Automatic |
| Service Bindings | Not implemented | Add Service Binding support | 📋 Future |

## References

- [Service Bindings Guide](../architecture/SERVICE_BINDINGS_GUIDE.md)
- [Cloudflare Worker-to-Worker Fetch](./CLOUDFLARE_WORKER_TO_WORKER_FETCH.md)
- [OAuth Broker README](../../packages/oauth-broker/README.md)

