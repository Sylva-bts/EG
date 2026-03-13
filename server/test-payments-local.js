const assert = require('assert');

const depositController = require('./payement/deposit.controller');
const withdrawController = require('./payement/withdraw.controller');
const OxaPayService = require('./payement/oxapay.service');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    }
  };
}

async function run() {
  const original = {
    createInvoice: OxaPayService.createInvoice,
    sendPayout: OxaPayService.sendPayout,
    checkPayoutStatus: OxaPayService.checkPayoutStatus,
    txSave: Transaction.prototype.save,
    txFindOne: Transaction.findOne,
    userFindById: User.findById,
    userSave: User.prototype.save,
  };

  try {
    // 1) dépôt invalide
    {
      const req = { body: { amount: 0, crypto: 'USDT' }, user: { id: 'u1' } };
      const res = createRes();
      await depositController.createDeposit(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.payload.success, false);
    }

    // 2) retrait adresse invalide
    {
      const req = { body: { amount: 1, crypto: 'USDT', address: 'bad' }, user: { id: 'u1' } };
      const res = createRes();
      await withdrawController.createWithdrawal(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.payload.success, false);
    }

    // 3) retrait succès
    {
      let savedTx = null;
      const fakeUser = {
        _id: 'u2',
        balance: 10,
        async save() { return this; },
      };

      User.findById = async () => fakeUser;
      OxaPayService.sendPayout = async () => ({ trans_id: 'payout_123', txid: 'txhash_abc' });
      Transaction.prototype.save = async function save() { savedTx = this; return this; };

      const req = {
        body: { amount: 1, crypto: 'USDT', address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE' },
        user: { id: 'u2' }
      };
      const res = createRes();

      await withdrawController.createWithdrawal(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.payload.success, true);
      assert.equal(res.payload.data.status, 'pending');
      assert.ok(savedTx);
      assert.equal(fakeUser.balance, 9);
    }

    // 4) statut retrait rejeté => remboursement
    {
      const fakeUser = {
        _id: 'u3',
        balance: 2,
        async save() { return this; },
      };
      const fakeTx = {
        _id: 'tx1',
        user: 'u3',
        invoice_id: 'payout_999',
        amount_fiat: 0.5,
        crypto: 'USDT',
        status: 'pending',
        updatedAt: new Date(),
        async save() { return this; },
      };

      Transaction.findOne = async () => fakeTx;
      User.findById = async () => fakeUser;
      OxaPayService.checkPayoutStatus = async () => ({ status: 'Rejected' });

      const req = { params: { transaction_id: 'tx1' }, user: { id: 'u3' } };
      const res = createRes();

      await withdrawController.checkWithdrawalStatus(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.payload.success, true);
      assert.equal(res.payload.data.status, 'rejected');
      assert.equal(fakeUser.balance, 2.5);
      assert.equal(fakeTx.status, 'rejected');
    }

    console.log('✅ Tests locaux paiements: OK');
  } finally {
    OxaPayService.createInvoice = original.createInvoice;
    OxaPayService.sendPayout = original.sendPayout;
    OxaPayService.checkPayoutStatus = original.checkPayoutStatus;
    Transaction.prototype.save = original.txSave;
    Transaction.findOne = original.txFindOne;
    User.findById = original.userFindById;
    User.prototype.save = original.userSave;
  }
}

run().catch((error) => {
  console.error('❌ Tests locaux paiements: KO');
  console.error(error);
  process.exit(1);
});
