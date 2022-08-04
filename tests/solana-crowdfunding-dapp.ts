import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import { SolanaCrowdfundingDapp } from "../target/types/solana_crowdfunding_dapp";

describe("solana-crowdfunding-dapp", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolanaCrowdfundingDapp as Program<SolanaCrowdfundingDapp>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
