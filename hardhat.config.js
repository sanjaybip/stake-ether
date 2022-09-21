require("@nomiclabs/hardhat-waffle");
//require("@nomicfoundation/hardhat-chai-matchers");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.0"
    },
    paths: {
        artifacts: "./client/src/artifacts"
    }
};
