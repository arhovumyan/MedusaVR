/**
 * Test script to verify the subscription coin distribution fix
 * 
 * This script tests that:
 * 1. Icon tier subscription gives exactly 3000 coins (not 6000)
 * 2. Virtuoso tier gives exactly 1200 coins (not 2400)
 * 3. Artist tier gives exactly 400 coins (not 800)
 */

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002/api';
const TEST_USER_EMAIL = 'test-subscription-fix@test.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testSubscriptionCoinDistribution() {
  console.log(' Testing Subscription Coin Distribution Fix...\n');

  try {
    // 1. Create a test user
    console.log('👤 Creating test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: TEST_USER_EMAIL,
      password: TEST_PASSWORD,
      firstName: 'Test',
      lastName: 'User'
    });

    if (registerResponse.status !== 201) {
      throw new Error(`Registration failed: ${registerResponse.status}`);
    }

    console.log(' Test user created successfully');

    // 2. Login to get auth token
    console.log('🔑 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_PASSWORD
    });

    const authToken = loginResponse.data.accessToken;
    console.log(' Login successful');

    // 3. Get initial user data
    console.log(' Getting initial user data...');
    const initialUserResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const initialCoins = initialUserResponse.data.coins;
    console.log(` Initial coins: ${initialCoins}`);

    // 4. Test Icon tier subscription (should give exactly 3000 coins)
    console.log('\n Testing Icon tier subscription...');
    const iconResponse = await axios.post(`${BASE_URL}/subscriptions/upgrade`, {
      tier: 'icon',
      billingPeriod: 'monthly',
      coinsToAward: 3000
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (iconResponse.status === 200) {
      const userAfterIcon = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const expectedCoins = initialCoins + 3000;
      const actualCoins = userAfterIcon.data.coins;
      
      if (actualCoins === expectedCoins) {
        console.log(' Icon tier test PASSED');
        console.log(`   Expected: ${expectedCoins}, Actual: ${actualCoins}`);
      } else {
        console.log(' Icon tier test FAILED');
        console.log(`   Expected: ${expectedCoins}, Actual: ${actualCoins}`);
        if (actualCoins === initialCoins + 6000) {
          console.log('   ERROR: Double coin distribution detected!');
        }
      }
    }

    // 5. Reset user for Virtuoso test
    console.log('\n Resetting for Virtuoso test...');
    await axios.patch(`${BASE_URL}/users/reset-for-test`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // 6. Test Virtuoso tier subscription (should give exactly 1200 coins)
    console.log(' Testing Virtuoso tier subscription...');
    const virtuosoResponse = await axios.post(`${BASE_URL}/subscriptions/upgrade`, {
      tier: 'virtuoso',
      billingPeriod: 'monthly',
      coinsToAward: 1200
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (virtuosoResponse.status === 200) {
      const userAfterVirtuoso = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const expectedCoins = initialCoins + 1200;
      const actualCoins = userAfterVirtuoso.data.coins;
      
      if (actualCoins === expectedCoins) {
        console.log(' Virtuoso tier test PASSED');
        console.log(`   Expected: ${expectedCoins}, Actual: ${actualCoins}`);
      } else {
        console.log(' Virtuoso tier test FAILED');
        console.log(`   Expected: ${expectedCoins}, Actual: ${actualCoins}`);
        if (actualCoins === initialCoins + 2400) {
          console.log('   ERROR: Double coin distribution detected!');
        }
      }
    }

    // 7. Reset user for Artist test
    console.log('\n Resetting for Artist test...');
    await axios.patch(`${BASE_URL}/users/reset-for-test`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // 8. Test Artist tier subscription (should give exactly 400 coins)
    console.log(' Testing Artist tier subscription...');
    const artistResponse = await axios.post(`${BASE_URL}/subscriptions/upgrade`, {
      tier: 'artist',
      billingPeriod: 'monthly',
      coinsToAward: 400
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (artistResponse.status === 200) {
      const userAfterArtist = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const expectedCoins = initialCoins + 400;
      const actualCoins = userAfterArtist.data.coins;
      
      if (actualCoins === expectedCoins) {
        console.log(' Artist tier test PASSED');
        console.log(`   Expected: ${expectedCoins}, Actual: ${actualCoins}`);
      } else {
        console.log(' Artist tier test FAILED');
        console.log(`   Expected: ${expectedCoins}, Actual: ${actualCoins}`);
        if (actualCoins === initialCoins + 800) {
          console.log('   ERROR: Double coin distribution detected!');
        }
      }
    }

    console.log('\n Subscription coin distribution test completed!');

  } catch (error) {
    console.error(' Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSubscriptionCoinDistribution();
