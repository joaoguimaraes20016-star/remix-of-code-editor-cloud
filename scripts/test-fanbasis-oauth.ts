/**
 * Test script for Fanbasis OAuth integration
 * 
 * Usage:
 *   npx tsx scripts/test-fanbasis-oauth.ts
 * 
 * Prerequisites:
 *   - SUPABASE_URL and SUPABASE_ANON_KEY in .env
 *   - Valid user session token
 *   - Team ID to test with
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
  results.push(result);
  const icon = result.passed ? '✅' : '❌';
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  console.log(`${icon} ${result.name}${duration}`);
  if (!result.passed) {
    console.log(`   ${result.message}`);
  }
}

async function testDatabaseSchema() {
  const start = Date.now();
  try {
    // Check if team_integrations table exists and has correct structure
    const { data, error } = await supabase
      .from('team_integrations')
      .select('id, team_id, integration_type, is_connected, config')
      .limit(1);

    if (error) {
      logTest({
        name: 'Database Schema',
        passed: false,
        message: `Table query failed: ${error.message}`,
        duration: Date.now() - start,
      });
      return false;
    }

    logTest({
      name: 'Database Schema',
      passed: true,
      message: 'team_integrations table exists with correct columns',
      duration: Date.now() - start,
    });
    return true;
  } catch (error) {
    logTest({
      name: 'Database Schema',
      passed: false,
      message: `Unexpected error: ${error}`,
      duration: Date.now() - start,
    });
    return false;
  }
}

async function testOAuthStartFunction(userToken: string, teamId: string) {
  const start = Date.now();
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/fanbasis-oauth-start`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          redirectUri: 'http://localhost:3000/test',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      logTest({
        name: 'OAuth Start Function',
        passed: false,
        message: `HTTP ${response.status}: ${data.error || 'Unknown error'}`,
        duration: Date.now() - start,
      });
      return null;
    }

    if (!data.authUrl) {
      logTest({
        name: 'OAuth Start Function',
        passed: false,
        message: 'Response missing authUrl',
        duration: Date.now() - start,
      });
      return null;
    }

    // Validate authUrl structure
    const url = new URL(data.authUrl);
    const requiredParams = [
      'response_type',
      'client_id',
      'redirect_uri',
      'scope',
      'state',
      'code_challenge',
      'code_challenge_method',
    ];

    const missingParams = requiredParams.filter(param => !url.searchParams.has(param));

    if (missingParams.length > 0) {
      logTest({
        name: 'OAuth Start Function',
        passed: false,
        message: `Missing URL parameters: ${missingParams.join(', ')}`,
        duration: Date.now() - start,
      });
      return null;
    }

    // Validate parameter values
    if (url.searchParams.get('response_type') !== 'code') {
      logTest({
        name: 'OAuth Start Function',
        passed: false,
        message: 'response_type should be "code"',
        duration: Date.now() - start,
      });
      return null;
    }

    if (url.searchParams.get('scope') !== 'creator:api') {
      logTest({
        name: 'OAuth Start Function',
        passed: false,
        message: 'scope should be "creator:api"',
        duration: Date.now() - start,
      });
      return null;
    }

    if (url.searchParams.get('code_challenge_method') !== 'S256') {
      logTest({
        name: 'OAuth Start Function',
        passed: false,
        message: 'code_challenge_method should be "S256"',
        duration: Date.now() - start,
      });
      return null;
    }

    logTest({
      name: 'OAuth Start Function',
      passed: true,
      message: 'Generated valid OAuth URL with all required parameters',
      duration: Date.now() - start,
    });

    return data.authUrl;
  } catch (error) {
    logTest({
      name: 'OAuth Start Function',
      passed: false,
      message: `Unexpected error: ${error}`,
      duration: Date.now() - start,
    });
    return null;
  }
}

async function testIntegrationRecord(teamId: string) {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from('team_integrations')
      .select('*')
      .eq('team_id', teamId)
      .eq('integration_type', 'fanbasis')
      .maybeSingle();

    if (error) {
      logTest({
        name: 'Integration Record',
        passed: false,
        message: `Query failed: ${error.message}`,
        duration: Date.now() - start,
      });
      return false;
    }

    if (!data) {
      logTest({
        name: 'Integration Record',
        passed: true,
        message: 'No existing integration (expected for first run)',
        duration: Date.now() - start,
      });
      return true;
    }

    // Validate config structure
    const config = data.config as Record<string, unknown>;
    const requiredFields = ['state_token', 'code_verifier'];

    const hasRequiredFields = requiredFields.every(field => field in config);

    if (!hasRequiredFields) {
      logTest({
        name: 'Integration Record',
        passed: false,
        message: 'Config missing required fields (state_token, code_verifier)',
        duration: Date.now() - start,
      });
      return false;
    }

    logTest({
      name: 'Integration Record',
      passed: true,
      message: `Integration record exists with valid config`,
      duration: Date.now() - start,
    });
    return true;
  } catch (error) {
    logTest({
      name: 'Integration Record',
      passed: false,
      message: `Unexpected error: ${error}`,
      duration: Date.now() - start,
    });
    return false;
  }
}

async function testRefreshTokenFunction(userToken: string, teamId: string) {
  const start = Date.now();
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/fanbasis-refresh-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
      }
    );

    const data = await response.json();

    // We expect this to fail if not connected, which is OK
    if (response.status === 404 && data.error?.includes('not found')) {
      logTest({
        name: 'Refresh Token Function',
        passed: true,
        message: 'Function responds correctly (no connection to refresh)',
        duration: Date.now() - start,
      });
      return true;
    }

    if (response.status === 401 && data.reconnect_required) {
      logTest({
        name: 'Refresh Token Function',
        passed: true,
        message: 'Function handles invalid refresh token correctly',
        duration: Date.now() - start,
      });
      return true;
    }

    if (response.ok && data.success) {
      logTest({
        name: 'Refresh Token Function',
        passed: true,
        message: 'Token refreshed successfully',
        duration: Date.now() - start,
      });
      return true;
    }

    logTest({
      name: 'Refresh Token Function',
      passed: false,
      message: `Unexpected response: ${JSON.stringify(data)}`,
      duration: Date.now() - start,
    });
    return false;
  } catch (error) {
    logTest({
      name: 'Refresh Token Function',
      passed: false,
      message: `Unexpected error: ${error}`,
      duration: Date.now() - start,
    });
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Fanbasis OAuth Integration\n');

  // Get test parameters from command line or environment
  const userToken = process.env.TEST_USER_TOKEN;
  const teamId = process.env.TEST_TEAM_ID;

  if (!userToken || !teamId) {
    console.log('⚠️  Missing TEST_USER_TOKEN or TEST_TEAM_ID');
    console.log('   Set these environment variables to run full tests\n');
  }

  // Run tests
  await testDatabaseSchema();

  if (userToken && teamId) {
    const authUrl = await testOAuthStartFunction(userToken, teamId);
    if (authUrl) {
      await testIntegrationRecord(teamId);
    }
    await testRefreshTokenFunction(userToken, teamId);
  } else {
    console.log('\n⏭️  Skipping function tests (no credentials provided)');
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('═══════════════');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log(`Passed: ${passed}/${total} (${percentage}%)`);

  if (passed === total) {
    console.log('\n✨ All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
  }

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
