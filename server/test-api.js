const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEST_CRYPTO = process.env.TEST_CRYPTO || 'USDT';
const TEST_DEPOSIT_AMOUNT = Number(process.env.TEST_DEPOSIT_AMOUNT || 1);
const TEST_WITHDRAW_AMOUNT = Number(process.env.TEST_WITHDRAW_AMOUNT || 0.5);
const TEST_WITHDRAW_ADDRESS = process.env.TEST_WITHDRAW_ADDRESS || 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'; // TRC20-like sample

let authToken = '';
let userId = '';
let depositInvoiceId = '';
let withdrawTransactionId = '';

function authHeaders() {
  return { Authorization: `Bearer ${authToken}` };
}

async function testAPI() {
  console.log('========================================');
  console.log('🧪 TEST API - Paiements (dépôt/retrait)');
  console.log('========================================');
  console.log(`🌐 BASE_URL: ${BASE_URL}`);
  console.log(`💱 Crypto: ${TEST_CRYPTO}`);
  console.log(`💵 Dépôt: ${TEST_DEPOSIT_AMOUNT} USD | Retrait: ${TEST_WITHDRAW_AMOUNT} USD`);
  console.log('');

  try {
    console.log('📌 Test 1: Health Check');
    const health = await axios.get(`${BASE_URL}/api/health`, { timeout: 15000 });
    console.log('✅ Serveur actif:', health.data);
    console.log('');

    const registerData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@test.com`,
      password: 'test123456'
    };

    console.log('📌 Test 2: Inscription');
    const register = await axios.post(`${BASE_URL}/api/auth/register`, registerData, { timeout: 20000 });
    console.log('✅ Inscription réussie:', register.data?.message || 'OK');
    console.log('');

    console.log('📌 Test 3: Connexion');
    const login = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: registerData.email,
      password: registerData.password
    }, { timeout: 20000 });

    authToken = login.data.token;
    userId = login.data.user.id;
    console.log('✅ Connexion réussie');
    console.log('   User ID:', userId);
    console.log('');

    console.log('📌 Test 4: Solde initial');
    const balanceBefore = await axios.get(`${BASE_URL}/api/payments/balance`, {
      headers: authHeaders(),
      timeout: 15000
    });
    console.log('✅ Solde:', balanceBefore.data.data);
    console.log('');

    console.log('📌 Test 5: Création dépôt');
    const deposit = await axios.post(`${BASE_URL}/api/payments/deposit`, {
      amount: TEST_DEPOSIT_AMOUNT,
      crypto: TEST_CRYPTO
    }, {
      headers: authHeaders(),
      timeout: 30000
    });

    depositInvoiceId = deposit.data?.data?.invoice_id;
    console.log('✅ Dépôt créé:', deposit.data.data);
    console.log('');

    if (depositInvoiceId) {
      console.log('📌 Test 6: Statut dépôt');
      const depositStatus = await axios.get(`${BASE_URL}/api/payments/status/${depositInvoiceId}`, {
        headers: authHeaders(),
        timeout: 20000
      });
      console.log('✅ Statut dépôt:', depositStatus.data.data);
      console.log('');
    }

    console.log('📌 Test 7: Création retrait');
    const withdraw = await axios.post(`${BASE_URL}/api/payments/withdraw`, {
      amount: TEST_WITHDRAW_AMOUNT,
      crypto: TEST_CRYPTO,
      address: TEST_WITHDRAW_ADDRESS
    }, {
      headers: authHeaders(),
      timeout: 30000
    });

    withdrawTransactionId = withdraw.data?.data?.transaction_id;
    console.log('✅ Retrait créé:', withdraw.data.data);
    console.log('');

    if (withdrawTransactionId) {
      console.log('📌 Test 8: Statut retrait');
      const withdrawalStatus = await axios.get(`${BASE_URL}/api/payments/withdraw/${withdrawTransactionId}`, {
        headers: authHeaders(),
        timeout: 20000
      });
      console.log('✅ Statut retrait:', withdrawalStatus.data.data);
      console.log('');
    }

    console.log('📌 Test 9: Historique transactions');
    const transactions = await axios.get(`${BASE_URL}/api/payments/transactions?limit=5`, {
      headers: authHeaders(),
      timeout: 20000
    });
    console.log('✅ Transactions (5 max):', {
      total: transactions.data?.data?.pagination?.total,
      count: transactions.data?.data?.transactions?.length
    });
    console.log('');

    console.log('========================================');
    console.log('🏁 Tests paiements terminés avec succès');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    const payload = err.response?.data || err.message;
    console.error('❌ Échec test API paiements:', payload);
    process.exit(1);
  }
}

testAPI();
