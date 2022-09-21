# Stake Ether
This is a complete dapp (decentralized application) that allow anyone to stake ether and earn interest on it. The dapp allow to stake ether for 30, 90, 180 days and earn interest 7%, 10%, 12% respectively. Staker can unstake ether anytime but if he unstake before the unlock date, he will not earn any interest.

For frontend we have use `React` with `bootstarp`. To develop our smart contract, we have used `hardhat`.

It includes contract code, testing and deploy script. 

The frontend is in `client` directory.

---

## Available Scripts

### To compile

```console
yarn hardhat compile
```

### To Test
```console
yarn hardhat test
```

### To Run hardhat local network
```console
yarn hardhat node
```

### To Deploy on local hardhat network
```console
yarn hardhat run --network localhost ./scripts/01-deploy.js
```
