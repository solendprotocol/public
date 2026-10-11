mod instructions;

use anyhow::Result;
use instructions::{build_borrow_instruction, build_repay_instruction, AssetConfig, ProtocolConfig};
use solana_commitment_config::CommitmentConfig;
use solana_message::{v0, VersionedMessage};
use solana_rpc_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    compute_budget::ComputeBudgetInstruction,
    pubkey::Pubkey,
    signature::read_keypair_file,
    signer::Signer,
    transaction::VersionedTransaction,
};
#[allow(deprecated)]
use solana_sdk::system_instruction;
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account_idempotent,
};
use std::env;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<()> {
    let rpc_url = env::var("RPC_URL")
        .unwrap_or_else(|_| "https://api.mainnet-beta.solana.com".to_string());
    let client = RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed());

    let home = env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let keypair_path = format!("{}/.config/solana/id.json", home);
    let payer = read_keypair_file(&keypair_path).unwrap_or_else(|_| {
        panic!("Requires funded keypair at ~/.config/solana/id.json to simulate transaction");
    });

    println!("Signer: {}", payer.pubkey());

    let protocol = ProtocolConfig {
        program_id: Pubkey::from_str("So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo")?,
        lending_market: Pubkey::from_str("4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY")?,
        vault: Pubkey::from_str("DdZR6zRFiUt4S5mg7AV1uKB2z1f1WzcNYCaTEEWPAuby")?,
        fee_receiver: Pubkey::from_str("9RuqAN42PTUi9ya59k9suGATrkqzvb9gk2QABJtQzGP5")?,
    };

    let wsol_mint = Pubkey::from_str("So11111111111111111111111111111111111111112")?;
    let asset = AssetConfig {
        reserve: Pubkey::from_str("8PbodeaosQP19SjYFx855UMqWxH2HynZLdBXmsrbac36")?,
        liquidity_supply: Pubkey::from_str("8UviNr47S8eL6J3WfDxMRa3hvLta1VDJwNWqsDgtN3Cv")?,
    };

    let user_wsol_ata = get_associated_token_address(&payer.pubkey(), &wsol_mint);
    let fee_receiver_ata = get_associated_token_address(&protocol.fee_receiver, &wsol_mint);

    let loan_amount: u64 = 10_000_000; // 0.01 SOL
    let fee_buffer: u64 = 1_000_000;   // 0.001 SOL buffer for fees

    let mut instructions = vec![
        ComputeBudgetInstruction::set_compute_unit_limit(400_000),
        ComputeBudgetInstruction::set_compute_unit_price(1_000),
        create_associated_token_account_idempotent(&payer.pubkey(), &payer.pubkey(), &wsol_mint, &spl_token::id()),
        system_instruction::transfer(&payer.pubkey(), &user_wsol_ata, fee_buffer),
        spl_token::instruction::sync_native(&spl_token::id(), &user_wsol_ata)?,
    ];

    // Dynamic index for sysvar::instructions introspection
    let borrow_ix_index = instructions.len() as u8;
    instructions.push(build_borrow_instruction(&protocol, &asset, user_wsol_ata, loan_amount));

    // Business logic goes here (e.g. swaps, liquidations, arbitrage)

    instructions.push(build_repay_instruction(
        &protocol,
        &asset,
        user_wsol_ata,
        fee_receiver_ata,
        payer.pubkey(),
        loan_amount,
        borrow_ix_index,
    ));

    let blockhash = client.get_latest_blockhash().await?;
    let msg = v0::Message::try_compile(&payer.pubkey(), &instructions, &[], blockhash)?;
    let tx = VersionedTransaction::try_new(VersionedMessage::V0(msg), &[&payer])?;

    println!("Simulating transaction...");
    let sim = client.simulate_transaction(&tx).await?;

    match sim.value.err {
        Some(err) => println!("Simulation failed, errors: {:?}", err),
        None => println!("Simulation succeeded"),
    }

    Ok(())
}
