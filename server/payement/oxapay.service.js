const axios = require("axios");

const BASE_URL = (process.env.OXAPAY_BASE_URL || "https://api.oxapay.com").replace(/\/$/, "");
const MERCHANT_KEY = process.env.OXAPAY_MERCHANT_API_KEY;
const PAYOUT_KEY = process.env.OXAPAY_PAYOUT_API_KEY;
const FIAT_CURRENCY = (process.env.FIAT_CURRENCY || "USD").toUpperCase();

// Supported cryptocurrencies mapping
const CRYPTO_MAP = {
    TRX: "TRX",
    USDT: "USDT",
    BTC: "BTC",
    ETH: "ETH",
    BNB: "BNB"
};

function extractError(error, fallbackMessage) {
    const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.description ||
        error.response?.data?.data?.message;

    return apiMessage || error.message || fallbackMessage;
}

function normalizeResponsePayload(data) {
    if (!data) return {};
    return data.data && typeof data.data === "object" ? { ...data, ...data.data } : data;
}

class OxaPayService {
    async postWithFallback(paths, payload, fallbackMessage, { requiresSuccessCode = true } = {}) {
        let lastError;

        for (const path of paths) {
            const url = `${BASE_URL}${path}`;
            try {
                const response = await axios.post(url, payload, { timeout: 15000 });
                const normalized = normalizeResponsePayload(response.data);

                if (requiresSuccessCode && normalized.code !== 100) {
                    throw new Error(normalized.message || `Erreur OxaPay (${path})`);
                }

                return normalized;
            } catch (error) {
                lastError = error;
                console.error(`OxaPay request failed on ${path}:`, error.response?.data || error.message);
            }
        }

        throw new Error(extractError(lastError, fallbackMessage));
    }

    // 🔹 Création facture (DÉPÔT)
    async createInvoice(amount, crypto, orderId) {
        return this.postWithFallback(
            ["/merchant/invoice", "/invoice"],
            {
                merchant: MERCHANT_KEY,
                amount,
                currency: FIAT_CURRENCY,
                order_id: orderId,
                callback_url: process.env.OXAPAY_WEBHOOK_URL || "https://tonsite.com/payments/webhook",
                pay_currency: CRYPTO_MAP[crypto] || "USDT"
            },
            "Erreur création facture OxaPay"
        );
    }

    // 🔹 Vérifier statut facture
    async checkInvoiceStatus(invoiceId) {
        return this.postWithFallback(
            ["/merchant/inquiry", "/merchant/invoice/status", "/inquiry"],
            {
                merchant: MERCHANT_KEY,
                track_id: invoiceId,
                invoice_id: invoiceId
            },
            "Erreur vérification facture"
        );
    }

    // 🔹 Payout (RETRAIT)
    async sendPayout(amount, crypto, address) {
        return this.postWithFallback(
            ["/api/send", "/payout"],
            {
                key: PAYOUT_KEY,
                amount,
                currency: CRYPTO_MAP[crypto] || "USDT",
                address
            },
            "Erreur envoi payout OxaPay"
        );
    }

    // 🔹 Vérifier statut payout
    async checkPayoutStatus(payoutId) {
        return this.postWithFallback(
            ["/api/status", "/payout/status"],
            {
                key: PAYOUT_KEY,
                track_id: payoutId,
                trans_id: payoutId
            },
            "Erreur vérification payout",
            { requiresSuccessCode: false }
        );
    }
}

module.exports = new OxaPayService();
