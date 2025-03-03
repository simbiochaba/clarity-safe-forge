import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure only owner can add templates",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "safe-forge",
        "add-template",
        [
          types.ascii("Test Template"),
          types.utf8("(contract-code)")
        ],
        user.address
      )
    ]);
    
    block.receipts[0].result.expectErr(100); // err-owner-only
    
    block = chain.mineBlock([
      Tx.contractCall(
        "safe-forge", 
        "add-template",
        [
          types.ascii("Test Template"),
          types.utf8("(contract-code)")
        ],
        owner.address
      )
    ]);
    
    block.receipts[0].result.expectOk().expectUint(1);
  }
});

Clarinet.test({
  name: "Can deploy contract from active template",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "safe-forge",
        "add-template",
        [
          types.ascii("Test Template"),
          types.utf8("(contract-code)")
        ],
        owner.address
      ),
      Tx.contractCall(
        "safe-forge",
        "deploy-contract",
        [
          types.uint(1),
          types.list([types.utf8("param1"), types.utf8("param2")])
        ],
        user.address
      )
    ]);
    
    block.receipts[0].result.expectOk().expectUint(1);
    block.receipts[1].result.expectOk().expectUint(1);
  }
});

Clarinet.test({
  name: "Cannot deploy from inactive template",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "safe-forge",
        "add-template",
        [
          types.ascii("Test Template"),
          types.utf8("(contract-code)")
        ],
        owner.address
      ),
      Tx.contractCall(
        "safe-forge",
        "update-template-status",
        [
          types.uint(1),
          types.bool(false)
        ],
        owner.address
      ),
      Tx.contractCall(
        "safe-forge",
        "deploy-contract",
        [
          types.uint(1),
          types.list([types.utf8("param1"), types.utf8("param2")])
        ],
        user.address
      )
    ]);
    
    block.receipts[2].result.expectErr(104); // err-inactive-template
  }
});

Clarinet.test({
  name: "Cannot deploy contract with empty parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "safe-forge",
        "add-template",
        [
          types.ascii("Test Template"),
          types.utf8("(contract-code)")
        ],
        owner.address
      ),
      Tx.contractCall(
        "safe-forge",
        "deploy-contract",
        [
          types.uint(1),
          types.list([])
        ],
        user.address
      )
    ]);
    
    block.receipts[1].result.expectErr(105); // err-empty-params
  }
});
