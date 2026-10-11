A minimal working Rust reference demonstrating atomic composable flash loans on Save Finance (`FlashBorrowReserveLiquidity` #19 & `FlashRepayReserveLiquidity` #20) using `solana-sdk` 2.x and Versioned Transactions (`v0`).

## Highlights

- **Dynamic Indexing**: automatically resolves `borrow_instruction_index` for `sysvar::instructions` introspection regardless of prepended Compute Budget or setup instructions.
- **Pure Native Rust**: zero reliance on third-party frameworks.

## Usage

Simulate against Mainnet using an ephemeral keypair:
```bash
cargo run
