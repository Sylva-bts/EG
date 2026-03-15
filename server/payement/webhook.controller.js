const Transaction = require("../models/Transaction");
const User = require("../models/User");

function normalizeStatus(status = "") {
    return String(status).trim().toLowerCase();
}

exports.oxapayWebhook = async (req, res) => {
    try {
        const secret = req.headers["x-webhook-secret"];

        if (process.env.OXAPAY_WEBHOOK_SECRET && secret !== process.env.OXAPAY_WEBHOOK_SECRET) {
            console.log("Webhook unauthorized - invalid secret");
            return res.status(403).json({ message: "Webhook non autorisé" });
        }

        const payload = req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
        const { status, order_id, amount, invoice_id, track_id } = payload;

        console.log("Webhook received:", { status, order_id, invoice_id, track_id, amount });

        const candidates = [order_id, invoice_id, track_id]
            .filter(Boolean)
            .map((value) => String(value));

        if (!candidates.length) {
            return res.status(200).send("OK");
        }

        // Try by order_id first (our internal UUID), then by external invoice/track id
        const transaction = await Transaction.findOne({
            $or: [
                { order_id: { $in: candidates } },
                { invoice_id: { $in: candidates } }
            ]
        });

        if (!transaction) {
            console.log("Transaction not found for:", candidates.join(", "));
            return res.status(200).send("OK");
        }

        const normalized = normalizeStatus(status);

        if (["paid", "confirming", "completed"].includes(normalized)) {
            const user = await User.findById(transaction.user);

            if (user && transaction.status !== "paid" && transaction.status !== "completed") {
                transaction.status = "paid";
                transaction.amount_crypto = amount || transaction.amount_crypto;
                if (!transaction.invoice_id && (track_id || invoice_id)) {
                    transaction.invoice_id = String(track_id || invoice_id);
                }
                transaction.updatedAt = new Date();
                await transaction.save();

                user.balance += transaction.amount_fiat;
                await user.save();

                console.log(`✅ Balance credited: $${transaction.amount_fiat} for user ${user.email}`);
            }
        } else if (normalized === "expired") {
            transaction.status = "expired";
            transaction.updatedAt = new Date();
            await transaction.save();
            console.log("Invoice expired:", candidates.join(", "));
        } else if (normalized === "failed") {
            transaction.status = "failed";
            transaction.updatedAt = new Date();
            await transaction.save();
            console.log("Invoice failed:", candidates.join(", "));
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).send("Erreur webhook");
    }
};
