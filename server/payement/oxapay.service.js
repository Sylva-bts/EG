const axios = require("axios");

const BASE_URL = process.env.OXAPAY_BASE_URL || "https://api.oxapay.com";
const MERCHANT_KEY = process.env.OXAPAY_MERCHANT_API_KEY;
const PAYOUT_KEY = process.env.OXAPAY_PAYOUT_API_KEY;

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
        error.response?.data?.description;

    return apiMessage || error.message || fallbackMessage;
}

class OxaPayService {

    // 🔹 Création facture (DÉPÔT)
    async createInvoice(amount, crypto, orderId) {
        try {
            // OxaPay uses fiat currency for invoice, crypto amount is calculated by their system
            const response = await axios.post(`${BASE_URL}/merchant/invoice`, {
                merchant: MERCHANT_KEY,
                amount,
                currency: "USD", // OxaPay uses USD as base
                order_id: orderId,
                callback_url: process.env.OXAPAY_WEBHOOK_URL || "https://tonsite.com/payments/webhook",
                pay_currency: CRYPTO_MAP[crypto] || "USDT" // User will pay with selected crypto
            });

            if (response.data.code !== 100) {
                throw new Error(response.data.message || "Erreur OxaPay");
            }

            return response.data;
        } catch (error) {
            const message = extractError(error, "Erreur création facture OxaPay");
            console.error("OxaPay createInvoice error:", error.response?.data || error.message);
            throw new Error(message);
        }
    }

    // 🔹 Vérifier statut facture
    async checkInvoiceStatus(invoiceId) {
        try {
            const response = await axios.post(`${BASE_URL}/merchant/inquiry`, {
                merchant: MERCHANT_KEY,
                track_id: invoiceId
            });

            if (response.data.code !== 100) {
                throw new Error(response.data.message || "Erreur OxaPay");
            }

            return response.data;
        } catch (error) {
            const message = extractError(error, "Erreur vérification facture");
            console.error("OxaPay checkStatus error:", error.response?.data || error.message);
            throw new Error(message);
        }
    }

    // 🔹 Payout (RETRAIT)
    async sendPayout(amount, crypto, address) {
        try {
            const response = await axios.post(`${BASE_URL}/api/send`, {
                key: PAYOUT_KEY,
                amount,
                currency: CRYPTO_MAP[crypto] || "USDT",
                address
            });

            if (response.data.code !== 100) {
                throw new Error(response.data.message || "Erreur OxaPay");
            }

            return response.data;
        } catch (error) {
            const message = extractError(error, "Erreur envoi payout OxaPay");
            console.error("OxaPay sendPayout error:", error.response?.data || error.message);
            throw new Error(message);
        }
    }

    // 🔹 Vérifier statut payout
    async checkPayoutStatus(payoutId) {
        try {
            const response = await axios.post(`${BASE_URL}/api/status`, {
                key: PAYOUT_KEY,
                track_id: payoutId
            });

            if (response.data.code && response.data.code !== 100) {
                throw new Error(response.data.message || "Erreur OxaPay");
            }

            return response.data;
        } catch (error) {
            const message = extractError(error, "Erreur vérification payout");
            console.error("OxaPay checkPayoutStatus error:", error.response?.data || error.message);
            throw new Error(message);
        }
    }
}

module.exports = new OxaPayService();
