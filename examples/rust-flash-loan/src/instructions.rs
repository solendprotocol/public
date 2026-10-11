use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    sysvar,
};

#[derive(Clone, Copy)]
pub struct ProtocolConfig {
    pub program_id: Pubkey,
    pub lending_market: Pubkey,
    pub vault: Pubkey,
    pub fee_receiver: Pubkey,
}

#[derive(Clone, Copy)]
pub struct AssetConfig {
    pub reserve: Pubkey,
    pub liquidity_supply: Pubkey,
}

pub fn build_borrow_instruction(
    protocol: &ProtocolConfig,
    asset: &AssetConfig,
    destination_ata: Pubkey,
    amount: u64,
) -> Instruction {
    let mut data = vec![19u8]; // FlashBorrowReserveLiquidity discriminator
    data.extend_from_slice(&amount.to_le_bytes());

    Instruction {
        program_id: protocol.program_id,
        accounts: vec![
            AccountMeta::new(asset.liquidity_supply, false),
            AccountMeta::new(destination_ata, false),
            AccountMeta::new(asset.reserve, false),
            AccountMeta::new_readonly(protocol.lending_market, false),
            AccountMeta::new_readonly(protocol.vault, false),
            AccountMeta::new_readonly(sysvar::instructions::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data,
    }
}

pub fn build_repay_instruction(
    protocol: &ProtocolConfig,
    asset: &AssetConfig,
    source_ata: Pubkey,
    fee_receiver_ata: Pubkey,
    payer: Pubkey,
    amount: u64,
    borrow_ix_index: u8,
) -> Instruction {
    let mut data = vec![20u8]; // FlashRepayReserveLiquidity discriminator
    data.extend_from_slice(&amount.to_le_bytes());
    data.push(borrow_ix_index);

    Instruction {
        program_id: protocol.program_id,
        accounts: vec![
            AccountMeta::new(source_ata, false),
            AccountMeta::new(asset.liquidity_supply, false),
            AccountMeta::new(fee_receiver_ata, false),
            AccountMeta::new(source_ata, false), // host_fee_receiver placeholder
            AccountMeta::new(asset.reserve, false),
            AccountMeta::new_readonly(protocol.lending_market, false),
            AccountMeta::new_readonly(payer, true),
            AccountMeta::new_readonly(sysvar::instructions::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data,
    }
}