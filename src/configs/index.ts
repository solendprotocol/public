import * as devnetConfig from "./devnet.json";
import * as betaConfig from "./beta.json";
import * as productionConfig from "./production.json";

type ConfigType = typeof productionConfig;

export { devnetConfig, betaConfig, productionConfig };
export type { ConfigType };

export default function (
  deployment = "production",
  customConfig?: typeof productionConfig
): typeof productionConfig {
  switch (deployment) {
    case "production":
      return productionConfig;
    case "devnet":
      return devnetConfig;
    case "local":
      if (!customConfig) {
        throw new Error(`Invalid deployment ${deployment}`);
      }

      return customConfig;
    default:
      throw new Error(`Invalid deployment ${deployment}`);
  }
}
