import "./App.css";
import NavBar from "./components/NavBar";
import StakeModal from "./components/StakeModal";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Bank, PiggyBank, Coin } from "react-bootstrap-icons";
import artifact from "./artifacts/contracts/Staking.sol/Staking.json";
const CONTARCT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
    const [provider, setProvider] = useState(undefined);
    const [signer, setSigner] = useState(undefined);
    const [contract, setContract] = useState("");
    const [signerAddress, setSignerAddress] = useState("");

    const [assetIds, setAssetIds] = useState([]);
    const [assets, setAssets] = useState([]);

    const [showStakeModal, setShowStakeModal] = useState(false);
    const [stakingPeriod, setStakingPeriod] = useState(undefined);
    const [stakingPercent, setStakingPercent] = useState(undefined);
    const [amount, setAmount] = useState(0);

    //helpers
    const toString = bytes32 => ethers.utils.parseBytes32String(bytes32);
    const toWei = ether => ethers.utils.parseEther(ether);

    const toEther = wei => ethers.utils.formatEther(wei);

    //Logics
    const isConnected = () => signer !== undefined;

    const getSigner = async () => {
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        return signer;
    };

    const getAssetIds = async (signer, address) => {
        const assetIds = await contract.connect(signer).getPositionIdsForAddress(address);
        return assetIds;
    };

    const calcDaysRemaining = unlockDate => {
        const timeNow = Date.now() / 1000; //converted in seconds
        const secondsRemaining = unlockDate - timeNow;
        return Math.max((secondsRemaining / 60 / 60 / 24).toFixed(0), 0);
    };
    const getAssets = async (signer, ids) => {
        const assets = await Promise.all(
            ids.map(id => contract.connect(signer).getPositionById(id))
        );
        assets.map(async asset => {
            const parsedAsset = {
                positionId: Number(asset.positionId),
                interestRate: Number(asset.percentInterest) / 100,
                daysRemaining: calcDaysRemaining(Number(asset.unlockDate)),
                etherStaked: toEther(asset.weiStaked.toString()),
                interestEarned: toEther(asset.weiInterest.toString()),
                open: asset.open
            };
            setAssets(prev => [...prev, parsedAsset]);
        });
    };

    const connectAndLoad = async () => {
        const signer = await getSigner();
        setSigner(signer);

        const signerAddress = await signer.getAddress();
        setSignerAddress(signerAddress);

        const assetIds = await getAssetIds(signer, signerAddress);
        setAssetIds(assetIds);

        await getAssets(signer, assetIds);
    };

    const showModal = (stakingPeriod, stakingPercent) => {
        setShowStakeModal(true);
        setStakingPeriod(stakingPeriod);
        setStakingPercent(stakingPercent);
    };

    const stakeEther = async () => {
        const wei = toWei(amount);
        await contract.connect(signer).stakeEther(stakingPeriod, { value: wei });
    };

    const withdraw = async positionId => {
        await contract.connect(signer).closePosition(positionId);
    };
    useEffect(() => {
        const onLoad = async () => {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(provider);
            const contract = new ethers.Contract(CONTARCT_ADDRESS, artifact.abi);
            setContract(contract);
        };
        onLoad();
    }, []);

    return (
        <div className="App">
            <div>
                <NavBar isConnected={isConnected} connect={connectAndLoad} />
            </div>
            <div className="appBody">
                <div className="marketContainer">
                    <div className="subContainer">
                        <span>
                            <img className="logoImg" src="ethereum-logo.png" />
                        </span>
                        <span className="marketHeader">Ethereum Market</span>
                    </div>

                    <div className="row">
                        <div className="col-md-4">
                            <div className="marketOption" onClick={() => showModal(30, "7%")}>
                                <div className="glyphContainer hoverButton">
                                    <span className="glyph">
                                        <Coin />
                                    </span>
                                </div>
                                <div className="optionData">
                                    <span>1 Month</span>
                                    <span className="optionPercent">7%</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="marketOption" onClick={() => showModal(90, "10%")}>
                                <div className="glyphContainer hoverButton">
                                    <span className="glyph">
                                        <Coin />
                                    </span>
                                </div>
                                <div className="optionData">
                                    <span>3 Months</span>
                                    <span className="optionPercent">10%</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="marketOption" onClick={() => showModal(180, "12%")}>
                                <div className="glyphContainer hoverButton">
                                    <span className="glyph">
                                        <Coin />
                                    </span>
                                </div>
                                <div className="optionData">
                                    <span>6 Months</span>
                                    <span className="optionPercent">12%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="assetContainer m-b-8">
                    <div className="subContainer">
                        <span className="marketHeader">Staked Assets</span>
                    </div>
                    <div>
                        <div className="row columnHeaders">
                            <div className="col-md-2">Assets</div>
                            <div className="col-md-2">InterestRate</div>
                            <div className="col-md-2">Staked Ether</div>
                            <div className="col-md-2">Interest</div>
                            <div className="col-md-2">Days Remaining</div>
                            <div className="col-md-2"></div>
                        </div>
                    </div>
                    <br />
                    {assets.length > 0 &&
                        assets.map((asset, index) => (
                            <div className="row">
                                <div className="col-md-2">
                                    <span>
                                        <img className="stakedLogoImg" src="ethereum-logo.png" />
                                    </span>
                                </div>
                                <div className="col-md-2">{asset.interestRate} %</div>
                                <div className="col-md-2">{asset.etherStaked}</div>
                                <div className="col-md-2">{asset.interestEarned}</div>
                                <div className="col-md-2">{asset.daysRemaining}</div>
                                <div className="col-md-2">
                                    {asset.open ? (
                                        <div
                                            onClick={() => withdraw(asset.positionId)}
                                            className="orangeMiniButton"
                                        >
                                            Withdraw
                                        </div>
                                    ) : (
                                        <span>closed</span>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            {showStakeModal && (
                <StakeModal
                    onClose={() => setShowStakeModal(false)}
                    stakingLength={stakingPeriod}
                    stakingPercent={stakingPercent}
                    amount={amount}
                    setAmount={setAmount}
                    stakeEther={stakeEther}
                />
            )}
        </div>
    );
}

export default App;
