"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDL = void 0;
exports.IDL = {
    "version": "0.1.0",
    "name": "ggoldca",
    "instructions": [
        {
            "name": "initializeVault",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "whirlpool",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "inputTokenAMintAddress",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "inputTokenBMintAddress",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultLpTokenMintPubkey",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "id",
                    "type": "u8"
                },
                {
                    "name": "fee",
                    "type": "u64"
                },
                {
                    "name": "minSlotsForReinvest",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "setVaultPauseStatus",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "isPaused",
                    "type": "bool"
                }
            ]
        },
        {
            "name": "setVaultUiStatus",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "isActive",
                    "type": "bool"
                }
            ]
        },
        {
            "name": "openPosition",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpoolProgramId",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "positionMint",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "positionTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpool",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bump",
                    "type": "u8"
                },
                {
                    "name": "tickLowerIndex",
                    "type": "i32"
                },
                {
                    "name": "tickUpperIndex",
                    "type": "i32"
                }
            ]
        },
        {
            "name": "closePosition",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpoolProgramId",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "positionMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "positionTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "setMarketRewards",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpool",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rewardsMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "destinationTokenAccount",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "marketRewards",
                    "type": {
                        "defined": "MarketRewardsInfoInput"
                    }
                }
            ]
        },
        {
            "name": "setVaultFee",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "fee",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "setMinSlotsForReinvest",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "minSlots",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "rebalance",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpoolProgramId",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenVaultA",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenVaultB",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "currentPosition",
                    "accounts": [
                        {
                            "name": "whirlpool",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "position",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "positionTokenAccount",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayLower",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayUpper",
                            "isMut": true,
                            "isSigner": false
                        }
                    ]
                },
                {
                    "name": "newPosition",
                    "accounts": [
                        {
                            "name": "whirlpool",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "position",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "positionTokenAccount",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayLower",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayUpper",
                            "isMut": true,
                            "isSigner": false
                        }
                    ]
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "deposit",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vaultLpTokenMintPubkey",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userLpTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpoolProgramId",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "accounts": [
                        {
                            "name": "whirlpool",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "position",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "positionTokenAccount",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayLower",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayUpper",
                            "isMut": true,
                            "isSigner": false
                        }
                    ]
                },
                {
                    "name": "whTokenVaultA",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whTokenVaultB",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "lpAmount",
                    "type": "u64"
                },
                {
                    "name": "maxAmountA",
                    "type": "u64"
                },
                {
                    "name": "maxAmountB",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "withdraw",
            "accounts": [
                {
                    "name": "userSigner",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "vaultAccount",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vaultLpTokenMintPubkey",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userLpTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpoolProgramId",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "accounts": [
                        {
                            "name": "whirlpool",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "position",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "positionTokenAccount",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayLower",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayUpper",
                            "isMut": true,
                            "isSigner": false
                        }
                    ]
                },
                {
                    "name": "whTokenVaultA",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whTokenVaultB",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "lpAmount",
                    "type": "u64"
                },
                {
                    "name": "minAmountA",
                    "type": "u64"
                },
                {
                    "name": "minAmountB",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "collectFees",
            "accounts": [
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "treasuryTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "treasuryTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpoolProgramId",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenVaultA",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenVaultB",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "accounts": [
                        {
                            "name": "whirlpool",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "position",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "positionTokenAccount",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayLower",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayUpper",
                            "isMut": true,
                            "isSigner": false
                        }
                    ]
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "collectRewards",
            "accounts": [
                {
                    "name": "vaultAccount",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vaultRewardsTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "treasuryRewardsTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "rewardVault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "whirlpoolProgramId",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "accounts": [
                        {
                            "name": "whirlpool",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "position",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "positionTokenAccount",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayLower",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayUpper",
                            "isMut": true,
                            "isSigner": false
                        }
                    ]
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "rewardIndex",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "swapRewards",
            "accounts": [
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultRewardsTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultDestinationTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "swapProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "transferRewards",
            "accounts": [
                {
                    "name": "vaultAccount",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vaultRewardsTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "destinationTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "reinvest",
            "accounts": [
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultLpTokenMintPubkey",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "whirlpoolProgramId",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenAAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultInputTokenBAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenVaultA",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenVaultB",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "accounts": [
                        {
                            "name": "whirlpool",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "position",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "positionTokenAccount",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayLower",
                            "isMut": true,
                            "isSigner": false
                        },
                        {
                            "name": "tickArrayUpper",
                            "isMut": true,
                            "isSigner": false
                        }
                    ]
                },
                {
                    "name": "tickArray0",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tickArray1",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tickArray2",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "oracle",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "setTokenMetadata",
            "accounts": [
                {
                    "name": "metadataAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultAccount",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vaultLpTokenMintPubkey",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userSigner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "tokenMetadataProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "tokenName",
                    "type": "string"
                },
                {
                    "name": "tokenSymbol",
                    "type": "string"
                },
                {
                    "name": "tokenUri",
                    "type": "string"
                },
                {
                    "name": "firstTime",
                    "type": "bool"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "vaultAccount",
            "docs": [
                "Strategy vault account"
            ],
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "version",
                        "docs": [
                            "Vault version"
                        ],
                        "type": "u8"
                    },
                    {
                        "name": "isActiveFromUi",
                        "docs": [
                            "The vault is active from the UI"
                        ],
                        "type": "bool"
                    },
                    {
                        "name": "isPaused",
                        "docs": [
                            "The smart contract is paused for this vault"
                        ],
                        "type": "bool"
                    },
                    {
                        "name": "id",
                        "docs": [
                            "Vault number for a given whirlpool"
                        ],
                        "type": "u8"
                    },
                    {
                        "name": "bumps",
                        "docs": [
                            "PDA bump seeds"
                        ],
                        "type": {
                            "defined": "Bumps"
                        }
                    },
                    {
                        "name": "whirlpoolId",
                        "docs": [
                            "Whirlpool pubkey"
                        ],
                        "type": "publicKey"
                    },
                    {
                        "name": "inputTokenAMintPubkey",
                        "docs": [
                            "Pool input token_a mint address"
                        ],
                        "type": "publicKey"
                    },
                    {
                        "name": "inputTokenBMintPubkey",
                        "docs": [
                            "Pool input token_b mint address"
                        ],
                        "type": "publicKey"
                    },
                    {
                        "name": "fee",
                        "docs": [
                            "Fee percentage using FEE_SCALE. Fee applied on earnings"
                        ],
                        "type": "u64"
                    },
                    {
                        "name": "minSlotsForReinvest",
                        "docs": [
                            "Minimum number of elapsed slots required for reinvesting"
                        ],
                        "type": "u64"
                    },
                    {
                        "name": "lastReinvestmentSlot",
                        "docs": [
                            "Last reinvestment slot"
                        ],
                        "type": "u64"
                    },
                    {
                        "name": "lastLiquidityIncrease",
                        "docs": [
                            "Last reinvestment liquidity increase"
                        ],
                        "type": "u128"
                    },
                    {
                        "name": "earnedRewardsTokenA",
                        "docs": [
                            "Total rewards earned by the vault"
                        ],
                        "type": "u64"
                    },
                    {
                        "name": "earnedRewardsTokenB",
                        "type": "u64"
                    },
                    {
                        "name": "marketRewards",
                        "docs": [
                            "The market where to sell the rewards"
                        ],
                        "type": {
                            "array": [
                                {
                                    "defined": "MarketRewardsInfo"
                                },
                                3
                            ]
                        }
                    },
                    {
                        "name": "positions",
                        "docs": [
                            "Information about the opened positions (max = MAX_POSITIONS)"
                        ],
                        "type": {
                            "vec": {
                                "defined": "PositionInfo"
                            }
                        }
                    },
                    {
                        "name": "padding",
                        "docs": [
                            "Additional padding"
                        ],
                        "type": {
                            "array": [
                                "u64",
                                10
                            ]
                        }
                    }
                ]
            }
        }
    ],
    "types": [
        {
            "name": "MarketRewardsInfoInput",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "docs": [
                            "Id of market associated"
                        ],
                        "type": {
                            "defined": "MarketRewards"
                        }
                    },
                    {
                        "name": "minAmountOut",
                        "docs": [
                            "Minimum number of lamports to receive during swap"
                        ],
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "Bumps",
            "docs": [
                "PDA bump seeds"
            ],
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "vault",
                        "type": "u8"
                    },
                    {
                        "name": "lpTokenMint",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "PositionInfo",
            "docs": [
                "Position information"
            ],
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "pubkey",
                        "docs": [
                            "Position pubkey"
                        ],
                        "type": "publicKey"
                    },
                    {
                        "name": "lowerTick",
                        "docs": [
                            "Position lower tick"
                        ],
                        "type": "i32"
                    },
                    {
                        "name": "upperTick",
                        "docs": [
                            "Position upper tick"
                        ],
                        "type": "i32"
                    }
                ]
            }
        },
        {
            "name": "MarketRewardsInfo",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "docs": [
                            "Id of market associated"
                        ],
                        "type": {
                            "defined": "MarketRewards"
                        }
                    },
                    {
                        "name": "rewardsMint",
                        "docs": [
                            "Pubkey of the rewards token mint"
                        ],
                        "type": "publicKey"
                    },
                    {
                        "name": "destinationTokenAccount",
                        "docs": [
                            "Destination account"
                        ],
                        "type": "publicKey"
                    },
                    {
                        "name": "minAmountOut",
                        "docs": [
                            "Minimum number of lamports to receive during swap"
                        ],
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "MarketRewards",
            "type": {
                "kind": "enum",
                "variants": [
                    {
                        "name": "NotSet"
                    },
                    {
                        "name": "Transfer"
                    },
                    {
                        "name": "OrcaV2"
                    },
                    {
                        "name": "Whirlpool"
                    }
                ]
            }
        }
    ],
    "events": [
        {
            "name": "CollectFeesEvent",
            "fields": [
                {
                    "name": "vaultAccount",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "totalFeesTokenA",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "totalFeesTokenB",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "treasuryFeeTokenA",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "treasuryFeeTokenB",
                    "type": "u64",
                    "index": false
                }
            ]
        },
        {
            "name": "CollectRewardsEvent",
            "fields": [
                {
                    "name": "vaultAccount",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "totalRewards",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "treasuryFee",
                    "type": "u64",
                    "index": false
                }
            ]
        },
        {
            "name": "DepositWithdrawEvent",
            "fields": [
                {
                    "name": "vaultAccount",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "amountA",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "amountB",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "liquidity",
                    "type": "u128",
                    "index": false
                }
            ]
        },
        {
            "name": "RebalanceEvent",
            "fields": [
                {
                    "name": "vaultAccount",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "oldLiquidity",
                    "type": "u128",
                    "index": false
                },
                {
                    "name": "newLiquidity",
                    "type": "u128",
                    "index": false
                }
            ]
        },
        {
            "name": "ReinvestEvent",
            "fields": [
                {
                    "name": "vaultAccount",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "lpSupply",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "liquidity",
                    "type": "u128",
                    "index": false
                },
                {
                    "name": "liquidityIncrease",
                    "type": "u128",
                    "index": false
                },
                {
                    "name": "elapsedSlots",
                    "type": "u64",
                    "index": false
                }
            ]
        },
        {
            "name": "SwapEvent",
            "fields": [
                {
                    "name": "vaultAccount",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "mintIn",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "amountIn",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "mintOut",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "amountOut",
                    "type": "u64",
                    "index": false
                }
            ]
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "MathOverflowAdd",
            "msg": "Math overflow during add"
        },
        {
            "code": 6001,
            "name": "MathOverflowSub",
            "msg": "Math overflow during sub"
        },
        {
            "code": 6002,
            "name": "MathOverflowMul",
            "msg": "Math overflow during mul"
        },
        {
            "code": 6003,
            "name": "MathZeroDivision",
            "msg": "Math division by zero"
        },
        {
            "code": 6004,
            "name": "MathOverflowConversion",
            "msg": "Math overflow during type conversion"
        },
        {
            "code": 6005,
            "name": "InvalidVaultVersion",
            "msg": "Invalid vault version"
        },
        {
            "code": 6006,
            "name": "UnauthorizedUser",
            "msg": "Unauthorized user"
        },
        {
            "code": 6007,
            "name": "PausedSmartContract",
            "msg": "The smart contract is paused"
        },
        {
            "code": 6008,
            "name": "PausedVault",
            "msg": "The provided vault is paused"
        },
        {
            "code": 6009,
            "name": "NotEnoughSlots",
            "msg": "Not enough elapsed slots since last call"
        },
        {
            "code": 6010,
            "name": "InvalidFee",
            "msg": "Fee cannot exceed FEE_SCALE"
        },
        {
            "code": 6011,
            "name": "MarketInvalidDestination",
            "msg": "Market rewards input invalid destination account mint"
        },
        {
            "code": 6012,
            "name": "MarketInvalidMint",
            "msg": "Market rewards input tokens not allowed"
        },
        {
            "code": 6013,
            "name": "MarketInvalidZeroAmount",
            "msg": "Market rewards input zero min_amount_out not allowed"
        },
        {
            "code": 6014,
            "name": "ZeroLpAmount",
            "msg": "LP amount must be greater than zero"
        },
        {
            "code": 6015,
            "name": "ExceededTokenMax",
            "msg": "Exceeded token max"
        },
        {
            "code": 6016,
            "name": "InvalidDestinationAccount",
            "msg": "Invalid destination token account"
        },
        {
            "code": 6017,
            "name": "InvalidInputMint",
            "msg": "Invalid input token mint pubkey"
        },
        {
            "code": 6018,
            "name": "InvalidRewardMint",
            "msg": "Invalid reward token mint pubkey"
        },
        {
            "code": 6019,
            "name": "PositionAlreadyOpened",
            "msg": "Position already opened"
        },
        {
            "code": 6020,
            "name": "PositionLimitReached",
            "msg": "Position limit reached"
        },
        {
            "code": 6021,
            "name": "PositionNotActive",
            "msg": "Position is not active"
        },
        {
            "code": 6022,
            "name": "PositionNonExistence",
            "msg": "Position does not exist"
        },
        {
            "code": 6023,
            "name": "NotEnoughFees",
            "msg": "Not enough fees generated yet"
        },
        {
            "code": 6024,
            "name": "NotEnoughRewards",
            "msg": "Not enough rewards generated yet"
        },
        {
            "code": 6025,
            "name": "InvalidNumberOfAccounts",
            "msg": "Invalid number of accounts"
        },
        {
            "code": 6026,
            "name": "SwapNotSet",
            "msg": "Swap is not set for the current rewards"
        },
        {
            "code": 6027,
            "name": "SwapInvalidProgramId",
            "msg": "Invalid swap program ID"
        },
        {
            "code": 6028,
            "name": "TransferNotSet",
            "msg": "Transfer is not set for the current rewards"
        },
        {
            "code": 6029,
            "name": "WhirlpoolLiquidityTooHigh",
            "msg": "whirlpool_cpi: Liquidity amount must be less than i64::MAX"
        },
        {
            "code": 6030,
            "name": "WhirlpoolLiquidityToDeltasOverflow",
            "msg": "whirlpool_cpi: Overflow while computing liquidity to token deltas"
        }
    ]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2dvbGRjYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWJzL3Vud3JhcC9uYXphcmUvZ2dvbGRjYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFnbERhLFFBQUEsR0FBRyxHQUFZO0lBQzFCLFNBQVMsRUFBRSxPQUFPO0lBQ2xCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLGNBQWMsRUFBRTtRQUNkO1lBQ0UsTUFBTSxFQUFFLGlCQUFpQjtZQUN6QixVQUFVLEVBQUU7Z0JBQ1Y7b0JBQ0UsTUFBTSxFQUFFLFlBQVk7b0JBQ3BCLE9BQU8sRUFBRSxJQUFJO29CQUNiLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDRSxNQUFNLEVBQUUsV0FBVztvQkFDbkIsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsVUFBVSxFQUFFLEtBQUs7aUJBQ2xCO2dCQUNEO29CQUNFLE1BQU0sRUFBRSx3QkFBd0I7b0JBQ2hDLE9BQU8sRUFBRSxLQUFLO29CQUNkLFVBQVUsRUFBRSxLQUFLO2lCQUNsQjtnQkFDRDtvQkFDRSxNQUFNLEVBQUUsd0JBQXdCO29CQUNoQyxPQUFPLEVBQUUsS0FBSztvQkFDZCxVQUFVLEVBQUUsS0FBSztpQkFDbEI7Z0JBQ0Q7b0JBQ0UsTUFBTSxFQUFFLGNBQWM7b0JBQ3RCLE9BQU8sRUFBRSxJQUFJO29CQUNiLFVBQVUsRUFBRSxLQUFLO2lCQUNsQjtnQkFDRDtvQkFDRSxNQUFNLEVBQUUseUJBQXlCO29CQUNqQyxPQUFPLEVBQUUsSUFBSTtvQkFDYixVQUFVLEVBQUUsS0FBSztpQkFDbEI7Z0JBQ0Q7b0JBQ0UsTUFBTSxFQUFFLHlCQUF5QjtvQkFDakMsT0FBTyxFQUFFLElBQUk7b0JBQ2IsVUFBVSxFQUFFLEtBQUs7aUJBQ2xCO2dCQUNEO29CQUNFLE1BQU0sRUFBRSx3QkFBd0I7b0JBQ2hDLE9BQU8sRUFBRSxJQUFJO29CQUNiLFVBQVUsRUFBRSxLQUFLO2lCQUNsQjtnQkFDRDtvQkFDRSxNQUFN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