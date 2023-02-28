# Solend LITE

[Solend LITE](https://lite.solend.fi/) is a lightweight open-source client to the [Solend program](https://github.com/solendprotocol/solana-program-library). It serves as a backup site, a starting point for third-party applications built on top of solend, and a way to personally host your own Solend client.

## How to run

### Working on Solend LITE
To contribute to Solend LITE, it is encouraged to run as a monorepo

1. Clone the solendprotocol`/public` repo
2. `cd` into `solend-lite` and run `yarn && yarn dev`
3. Create a `.env` file based on the included `.env.example`. Check out [`/src/common/config.ts`](https://github.com/solendprotocol/public/blob/master/solend-lite/src/common/config.ts) for possible `ENV` configurations
4. To host, use a provider like Vercel/Netlify and configure build environment variables accordingly. Make sure to set base directory as `solend-lite`

### "Eject" to fork your own project
Solend LITE is designed to be forked. Simply move the `solend-lite` repo out of `public` and `solend-lite` will function as a standalone package, pulling `solend-sdk` dependencies from the npm registry.

# FAQ
As always, come checkout the #dev-support channel in the [Solend Discord](https://discord.com/channels/839224914720325703/879615939484725259) for any questions or requests

