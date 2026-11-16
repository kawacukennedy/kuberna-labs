/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: deployments/*-latest.json
 * Regenerate with: npm run sync:deployments
 */

export interface DeploymentContracts {
  [contract: string]: string;
}

export interface DeploymentRecord {
  network: string;
  chainId: number;
  deployer: string | null;
  deployedAt: string | null;
  contracts: DeploymentContracts;
}

export const DEPLOYMENTS: DeploymentRecord[] = [
  {
    network: "mantleSepolia",
    chainId: 5003,
    deployer: null,
    deployedAt: "2026-06-21T12:08:30.362Z",
    contracts: {
      escrow: "0x22dF9cBdf45F7874602d3Bf950A2B7EB51314ad1",
      intent: "0xb663f2A79Fcc64eD1CB6c6adD7625b443aB1D19C",
      certificateNFT: "0x8f21D43d50266580e21dbCB0BcEa7E073FefA7c0",
      payment: "0x360ec009ba6967F5f7C53a88FAD0452C6140493d",
      subscription: "0xB819ab0Bac2f22e8895C66fE3aDF23aa0a65145a",
      reputationNFT: "0x5e42c329Ef517B495261f57054d5844EAabD3dbf",
      agentRegistry: "0xFFe8A88E9E99938174B8a3C9EcA1c1462315395A",
      courseNFT: "0x9be7afE1793ad14F9026d7579cf7c2313184a7E0",
      workshop: "0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35",
      dispute: "0x817fB0D00f033bb2982fF44855Fb6F8AE2D41324",
      treasury: "0x9b0D1d05A6EBafE6364648d9e7109E2C37e331BF",
      feeManager: "0x1Fa14FfB410EfA65b3aADBB9B65e2426A1fB0F66",
      attestation: "0x8bcc424C07afCf231046F58B15d3677b8E842023",
      crossChainRouter: "0x5DA30BDE4A774dcccE6099717d6b41A6329fDe34",
    },
  },
  {
    network: "ogTestnet",
    chainId: 16602,
    deployer: null,
    deployedAt: "2026-06-21T12:03:38.646Z",
    contracts: {
      escrow: "0x9b0D1d05A6EBafE6364648d9e7109E2C37e331BF",
      intent: "0x1Fa14FfB410EfA65b3aADBB9B65e2426A1fB0F66",
      certificateNFT: "0x8bcc424C07afCf231046F58B15d3677b8E842023",
      payment: "0x5DA30BDE4A774dcccE6099717d6b41A6329fDe34",
      subscription: "0xD27b4Dcec846bdfF2DB9D70B163bfb61A3090E2e",
      reputationNFT: "0xFB105A77806d365EdeCf45F677481043ec1D46F4",
      agentRegistry: "0xE2924838E5914cE099e5969aD63b0C4A4eeB8BAD",
      courseNFT: "0xab28501BC5736f56D1Fd909ffD8EB98407EB049E",
      workshop: "0xF9c36107F943C9eECAa88B20C05Bd090322fC56f",
      dispute: "0x6CBeE1F98DBd05d5B05A18062B5029c5618D340F",
      treasury: "0xc0679cdB6E30291De974635cBaFa572e083e6564",
      feeManager: "0x32b0298eF0e0e438A45965Ed26d9EfA2A7Cf9061",
      attestation: "0x10aC2c7cAA2d7C5fC8a561F8654d289eeb2E29F4",
      crossChainRouter: "0x563193BeD72b2b1F284EE0e80b29dADc4D9bEC91",
    },
  },
  {
    network: "baseSepolia",
    chainId: 84532,
    deployer: null,
    deployedAt: "2026-06-21T12:00:43.365Z",
    contracts: {
      escrow: "0xab28501BC5736f56D1Fd909ffD8EB98407EB049E",
      intent: "0xF9c36107F943C9eECAa88B20C05Bd090322fC56f",
      certificateNFT: "0x6CBeE1F98DBd05d5B05A18062B5029c5618D340F",
      payment: "0xc0679cdB6E30291De974635cBaFa572e083e6564",
      subscription: "0x32b0298eF0e0e438A45965Ed26d9EfA2A7Cf9061",
      reputationNFT: "0x10aC2c7cAA2d7C5fC8a561F8654d289eeb2E29F4",
      agentRegistry: "0x563193BeD72b2b1F284EE0e80b29dADc4D9bEC91",
      courseNFT: "0x2b80B538cCC8846AFb3c6cb901A819178c2E805f",
      workshop: "0xe48844e98A6760cd561f025aeD575f44DF5aABa3",
      dispute: "0x9d5A959CA6C6c6D1304beBF293387c4208163071",
      treasury: "0xA5BDFFfA521C2234F74Dd03B1529797068C8A717",
      feeManager: "0x039C4456CB9C195C2dFD1F370a4891b0857F4aa0",
      attestation: "0x68d0a647E4a1F68CbDA62Ce31273D1d0298C1a02",
      crossChainRouter: "0xf13Efb8885F11B6E81dE47DF74CC1849a5855edb",
    },
  },
];
