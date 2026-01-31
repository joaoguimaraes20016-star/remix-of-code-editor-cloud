# Fanbasis OAuth Deployment Checklist

Use this checklist to ensure proper deployment of the Fanbasis OAuth integration.

## Pre-Deployment

### 1. Credentials Setup
- [ ] Obtained Fanbasis Client ID
- [ ] Obtained Fanbasis Client Secret
- [ ] Confirmed redirect URI with Fanbasis: `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-callback`
- [ ] Verified scope access: `creator:api`

### 2. Environment Configuration
- [ ] Set `FANBASIS_CLIENT_ID` in Supabase secrets
- [ ] Set `FANBASIS_CLIENT_SECRET` in Supabase secrets
- [ ] (Optional) Set `FANBASIS_BASE_URL` if using custom instance

```bash
supabase secrets set FANBASIS_CLIENT_ID=your_client_id
supabase secrets set FANBASIS_CLIENT_SECRET=your_client_secret
```

### 3. Code Review
- [ ] Reviewed `fanbasis-oauth-start/index.ts`
- [ ] Reviewed `fanbasis-oauth-callback/index.ts`
- [ ] Reviewed `fanbasis-refresh-token/index.ts`
- [ ] Verified callback HTML page exists: `public/fanbasis-callback.html`
- [ ] Confirmed logo asset exists: `src/assets/integrations/fanbasis.svg`

## Deployment

### 4. Database Verification
- [ ] Confirmed `team_integrations` table exists
- [ ] Verified table has required columns:
  - `id` (UUID)
  - `team_id` (UUID)
  - `integration_type` (TEXT)
  - `is_connected` (BOOLEAN)
  - `config` (JSONB)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)
- [ ] Verified unique constraint on `(team_id, integration_type)`

### 5. Function Deployment
- [ ] Deployed `fanbasis-oauth-start` function
- [ ] Deployed `fanbasis-oauth-callback` function
- [ ] Deployed `fanbasis-refresh-token` function
- [ ] Verified functions are accessible (no 404 errors)

```bash
supabase functions deploy fanbasis-oauth-start
supabase functions deploy fanbasis-oauth-callback
supabase functions deploy fanbasis-refresh-token
```

### 6. Static Assets
- [ ] Deployed `fanbasis-callback.html` to public folder
- [ ] Verified callback page is accessible
- [ ] Confirmed logo SVG is included in build

## Testing

### 7. Manual Testing
- [ ] Started OAuth flow from application
- [ ] OAuth popup opened successfully
- [ ] Redirected to Fanbasis authorization page
- [ ] Successfully authenticated with Fanbasis
- [ ] Granted `creator:api` scope
- [ ] Redirected back to callback
- [ ] Callback page showed success message
- [ ] Popup auto-closed after 1.5 seconds
- [ ] Parent window received success message

### 8. Database Verification
- [ ] Integration record created in `team_integrations`
- [ ] `is_connected` set to `true`
- [ ] `config` contains:
  - `access_token`
  - `refresh_token`
  - `expires_at`
  - `scope` = "creator:api"
  - `creator_id` (if available)
  - `creator_name` (if available)
  - `connected_at`

```sql
SELECT 
  team_id,
  integration_type,
  is_connected,
  config->>'creator_id' as creator_id,
  config->>'scope' as scope,
  config->>'connected_at' as connected_at
FROM team_integrations
WHERE integration_type = 'fanbasis';
```

### 9. Token Testing
- [ ] Retrieved access token from database
- [ ] Made test API call to Fanbasis with token
- [ ] Received successful response (200 OK)
- [ ] Verified API response contains expected data

### 10. Token Refresh Testing
- [ ] Called refresh token function
- [ ] Function returned success
- [ ] New access token stored in database
- [ ] `last_refreshed_at` timestamp updated
- [ ] Old token still works (if not expired)

### 11. Error Handling
- [ ] Tested OAuth cancellation (user clicks "Cancel")
- [ ] Verified error message displayed
- [ ] Tested with invalid state token
- [ ] Tested with expired OAuth session
- [ ] Tested refresh with invalid refresh token
- [ ] Verified integration marked as disconnected on refresh failure

### 12. Security Testing
- [ ] Verified PKCE code_verifier is stored server-side only
- [ ] Confirmed state token prevents CSRF
- [ ] Checked that client secret is never exposed to frontend
- [ ] Verified tokens are not logged in function output
- [ ] Confirmed HTTPS is used for all OAuth requests

## Post-Deployment

### 13. Monitoring
- [ ] Set up monitoring for function errors
- [ ] Configure alerts for failed OAuth attempts
- [ ] Monitor token refresh failures
- [ ] Track integration connection/disconnection events

### 14. Documentation
- [ ] Updated team documentation with Fanbasis integration
- [ ] Documented how to connect Fanbasis account
- [ ] Added troubleshooting guide for common issues
- [ ] Documented API usage examples

### 15. User Communication
- [ ] Notified users of new Fanbasis integration
- [ ] Provided instructions for connecting accounts
- [ ] Documented available features/capabilities
- [ ] Set up support channel for integration issues

## Rollback Plan

### 16. Rollback Preparation
- [ ] Documented rollback procedure
- [ ] Backed up current function versions
- [ ] Prepared rollback commands
- [ ] Identified rollback triggers

### Rollback Commands
```bash
# If needed, rollback to previous function versions
supabase functions deploy fanbasis-oauth-start --no-verify-jwt
supabase functions deploy fanbasis-oauth-callback --no-verify-jwt
supabase functions deploy fanbasis-refresh-token --no-verify-jwt

# Or delete functions entirely
supabase functions delete fanbasis-oauth-start
supabase functions delete fanbasis-oauth-callback
supabase functions delete fanbasis-refresh-token
```

## Production Checklist

### 17. Production Environment
- [ ] Verified correct Supabase project (production)
- [ ] Confirmed production environment variables
- [ ] Tested with production Fanbasis credentials
- [ ] Verified production redirect URI is registered
- [ ] Tested with production domain/URL

### 18. Performance
- [ ] Monitored function execution time
- [ ] Verified function cold start time acceptable
- [ ] Checked database query performance
- [ ] Monitored API rate limits

### 19. Compliance
- [ ] Reviewed data privacy implications
- [ ] Confirmed GDPR compliance (if applicable)
- [ ] Verified token storage encryption
- [ ] Documented data retention policy

## Sign-Off

- [ ] Technical lead approval
- [ ] Security review completed
- [ ] QA testing passed
- [ ] Product owner approval
- [ ] Deployment scheduled
- [ ] Stakeholders notified

---

## Deployment Date: _______________

## Deployed By: _______________

## Notes:
```
[Add any deployment notes, issues encountered, or special considerations here]
```

---

## Quick Test Commands

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT * FROM team_integrations WHERE integration_type = 'fanbasis' LIMIT 1;"

# Check function logs
supabase functions logs fanbasis-oauth-start --tail
supabase functions logs fanbasis-oauth-callback --tail
supabase functions logs fanbasis-refresh-token --tail

# Test function accessibility
curl -X OPTIONS https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-start

# Run automated tests
npx tsx scripts/test-fanbasis-oauth.ts
```

## Support Contacts

- **Fanbasis Support**: [contact info]
- **Technical Lead**: [name/email]
- **On-Call Engineer**: [name/contact]
