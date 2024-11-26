export const MERKLE_PROGRAM_ID = "mrksLcZ6rMs9xkmJgw6oKiR3GECw44Gb5NeDqu64kiw";

export type MerkleDistributorIDL = {
  version: "0.0.0";
  name: "merkle_distributor";
  instructions: [
    {
      name: "newDistributor";
      accounts: [
        {
          name: "base";
          isMut: false;
          isSigner: true;
        },
        {
          name: "distributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bump";
          type: "u8";
        },
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "maxTotalClaim";
          type: "u64";
        },
        {
          name: "maxNumNodes";
          type: "u64";
        }
      ];
    },
    {
      name: "claim";
      accounts: [
        {
          name: "distributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "claimStatus";
          isMut: true;
          isSigner: false;
        },
        {
          name: "from";
          isMut: true;
          isSigner: false;
        },
        {
          name: "to";
          isMut: true;
          isSigner: false;
        },
        {
          name: "claimant";
          isMut: false;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bump";
          type: "u8";
        },
        {
          name: "index";
          type: "u64";
        },
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "proof";
          type: {
            vec: {
              array: ["u8", 32];
            };
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "merkleDistributor" | "MerkleDistributor";
      type: {
        kind: "struct";
        fields: [
          {
            name: "base";
            type: "publicKey";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "root";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "mint";
            type: "publicKey";
          },
          {
            name: "maxTotalClaim";
            type: "u64";
          },
          {
            name: "maxNumNodes";
            type: "u64";
          },
          {
            name: "totalAmountClaimed";
            type: "u64";
          },
          {
            name: "numNodesClaimed";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "claimStatus" | "ClaimStatus";
      type: {
        kind: "struct";
        fields: [
          {
            name: "isClaimed";
            type: "bool";
          },
          {
            name: "claimant";
            type: "publicKey";
          },
          {
            name: "claimedAt";
            type: "i64";
          },
          {
            name: "amount";
            type: "u64";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "ClaimedEvent";
      fields: [
        {
          name: "index";
          type: "u64";
          index: false;
        },
        {
          name: "claimant";
          type: "publicKey";
          index: false;
        },
        {
          name: "amount";
          type: "u64";
          index: false;
        }
      ];
    }
  ];
  errors: [
    {
      code: 300;
      name: "InvalidProof";
      msg: "Invalid Merkle proof.";
    },
    {
      code: 301;
      name: "DropAlreadyClaimed";
      msg: "Drop already claimed.";
    },
    {
      code: 302;
      name: "ExceededMaxClaim";
      msg: "Exceeded maximum claim amount.";
    },
    {
      code: 303;
      name: "ExceededMaxNumNodes";
      msg: "Exceeded maximum number of claimed nodes.";
    },
    {
      code: 304;
      name: "Unauthorized";
      msg: "Account is not authorized to execute this instruction";
    },
    {
      code: 305;
      name: "OwnerMismatch";
      msg: "Token account owner did not match intended owner";
    }
  ];
};
export const MerkleDistributorJSON: MerkleDistributorIDL = {
  version: "0.0.0",
  name: "merkle_distributor",
  instructions: [
    {
      name: "newDistributor",
      accounts: [
        {
          name: "base",
          isMut: false,
          isSigner: true,
        },
        {
          name: "distributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bump",
          type: "u8",
        },
        {
          name: "root",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "maxTotalClaim",
          type: "u64",
        },
        {
          name: "maxNumNodes",
          type: "u64",
        },
      ],
    },
    {
      name: "claim",
      accounts: [
        {
          name: "distributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "claimStatus",
          isMut: true,
          isSigner: false,
        },
        {
          name: "from",
          isMut: true,
          isSigner: false,
        },
        {
          name: "to",
          isMut: true,
          isSigner: false,
        },
        {
          name: "claimant",
          isMut: false,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bump",
          type: "u8",
        },
        {
          name: "index",
          type: "u64",
        },
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "proof",
          type: {
            vec: {
              array: ["u8", 32],
            },
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "MerkleDistributor",
      type: {
        kind: "struct",
        fields: [
          {
            name: "base",
            type: "publicKey",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "root",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "mint",
            type: "publicKey",
          },
          {
            name: "maxTotalClaim",
            type: "u64",
          },
          {
            name: "maxNumNodes",
            type: "u64",
          },
          {
            name: "totalAmountClaimed",
            type: "u64",
          },
          {
            name: "numNodesClaimed",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "ClaimStatus",
      type: {
        kind: "struct",
        fields: [
          {
            name: "isClaimed",
            type: "bool",
          },
          {
            name: "claimant",
            type: "publicKey",
          },
          {
            name: "claimedAt",
            type: "i64",
          },
          {
            name: "amount",
            type: "u64",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "ClaimedEvent",
      fields: [
        {
          name: "index",
          type: "u64",
          index: false,
        },
        {
          name: "claimant",
          type: "publicKey",
          index: false,
        },
        {
          name: "amount",
          type: "u64",
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 300,
      name: "InvalidProof",
      msg: "Invalid Merkle proof.",
    },
    {
      code: 301,
      name: "DropAlreadyClaimed",
      msg: "Drop already claimed.",
    },
    {
      code: 302,
      name: "ExceededMaxClaim",
      msg: "Exceeded maximum claim amount.",
    },
    {
      code: 303,
      name: "ExceededMaxNumNodes",
      msg: "Exceeded maximum number of claimed nodes.",
    },
    {
      code: 304,
      name: "Unauthorized",
      msg: "Account is not authorized to execute this instruction",
    },
    {
      code: 305,
      name: "OwnerMismatch",
      msg: "Token account owner did not match intended owner",
    },
  ],
};
