# Privy development setup

The implementation and complete walkthrough are now in [PRIVY-DEVELOPMENT.md](PRIVY-DEVELOPMENT.md).

Confirmed settings: **MUNK Development**, public app ID `cmvrdnznc00we0glcf33db0xh`, passkey/email/existing-wallet login methods saved, and local frontend **http://localhost:5173**. No Domains tab is required for local development; do not switch to production, create an app client or purchase a plan to obtain one.

Wallets are created through Privy's client SDK after real signup, owned by that authenticated user with no added MUNK signers or delegated authority. Existing wallet access requires actual provider sign-in, not connection alone. The local preview account is no longer an authentication path.

The backend requires a **read-only** development app secret to fetch the verified subject's linked wallets. Enter it only in ignored backend/.env as PRIVY_APP_SECRET, alongside the configured public PRIVY_APP_ID. Never paste it into chat or a VITE_ value. No authorization key, signer, quorum, production deployment or paid plan is needed.

After signup, link a backup email to the same account and retain a synced/backed-up passkey. Losing every linked login method is unrecoverable. Wallet export goes directly through the SDK's authenticated user UI and restores wallet control elsewhere; it does not automatically recover the Privy account. Actual signup/recovery/export remain a required local browser walkthrough, not a claim established by automated fixtures.

References: [local domains](https://docs.privy.io/recipes/react/allowed-domains), [app secrets/access levels](https://docs.privy.io/basics/get-started/dashboard/create-new-app), [wallet ownership](https://docs.privy.io/wallets/wallets/create/create-a-wallet), [recovery limits](https://docs.privy.io/user-management/users/managing-users/supporting-your-users).
