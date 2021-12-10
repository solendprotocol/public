import fetchMock from "jest-fetch-mock";
import { calculateMarinadeData } from '../src';

const rewardResponse = {
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: {
    supply: {
      rewardsPerShare: "43509501020530514141047478",
      totalBalance: "586676972796064",
      lastSlot: 110713034,
      side: "supply",
      tokenMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      rewardRates: [
        {
          beginningSlot: 0,
          rewardRate: 0,
          name: "",
        },
        {
          beginningSlot: 107566100,
          rewardRate: "434782608695652173913043478260869565217391",
          name: "1x",
        },
        {
          beginningSlot: 110527000,
          rewardRate: "400000000000000000000000000000000000000000",
          name: "1x",
        },
      ],
    },
    borrow: null,
  },
};

const externalRewardResponse = {
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: {
    supply: {
      rewardsPerShare: "906745261174844852329818744",
      totalBalance: "586697896062796",
      lastSlot: 110712923,
      side: "supply",
      tokenMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      rewardRates: [
        {
          beginningSlot: 0,
          rewardRate: 0,
        },
        {
          beginningSlot: 107566100,
          rewardRate: "9024723550000000000000000000000000000000000",
        },
      ],
    },
    borrow: null,
  },
};

const coinGeckoResponse = {
  marinade: { usd: 0.539689 },
  solend: { usd: 4.16 },
};

beforeEach(() => {
  fetchMock.mockIf(/^.*coingecko.com.*$/, (req) => {
    return new Promise((resolve) => {
      resolve(JSON.stringify(coinGeckoResponse));
    });
  });
});

describe("calculate", function () {
  it("add", async function () {
    let result = await calculateMarinadeData();
    console.log(result);
  });
});
