# TODO - Corrections des paiements OxaPay

## Terminé:
- [x] 1. Corriger le sélecteur de crypto dans `public/js/transactions.js`
- [x] 2. Mettre le minimum de dépôt à $0.5 USD dans `server/payement/deposit.controller.js`
- [x] 3. Mettre le minimum de retrait à $0.5 USD dans `server/payement/withdraw.controller.js`
- [x] 4. Mettre à jour l'affichage du minimum dans `public/deposit.html`
- [x] 5. Mettre à jour l'affichage du minimum dans `public/withdraw.html`
- [x] 6. Les variables .env sont déjà utilisées dans `oxapay.service.js` (OXAPAY_MERCHANT_API_KEY et OXAPAY_PAYOUT_API_KEY)

## Résumé des corrections:
1. **Bug du sélecteur crypto**: Le code utilisait `document.getElementById('crypto-selector')` qui n'existait pas. Maintenant il utilise correctement `document.querySelector('input[name="crypto"]:checked')` pour récupérer la crypto sélectionnée via les boutons radio.

2. **Minimum dépôt**: Changé de $10 USD à $0.5 USD pour toutes les cryptomonnaies.

3. **Minimum retrait**: Changé de $20 USD à $0.5 USD pour toutes les cryptomonnaies.

4. **Services OxaPay**: Les deux services (dépôt et retrait) sont déjà connectés et utilisent les variables d'environnement:
   - `OXAPAY_MERCHANT_API_KEY` pour les factures de dépôt
   - `OXAPAY_PAYOUT_API_KEY` pour les retraits
   - `OXAPAY_BASE_URL` pour l'URL de l'API
   - `OXAPAY_WEBHOOK_URL` pour le webhook
