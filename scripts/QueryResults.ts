import {ethers} from "ethers";
import {Ballot__factory} from "../typechain-types";
import {Ballot} from "../typechain-types";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    const contractAddress = args[0];
    console.log(`Get Results on Ballot contract: ${ contractAddress }`);

    const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_URL ?? "");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEYS?.split(',')[0] ?? "", provider);

    console.log(`Using address ${ wallet.address }`);
    const balanceBN = await provider.getBalance(wallet.address);
    const balance = Number(ethers.formatUnits(balanceBN));
    console.log(`Wallet balance ${ balance }`);
    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }

    const ballotFactory = new Ballot__factory(wallet);
    const ballotContract = ballotFactory.attach(contractAddress) as Ballot;
    const proposal = await ballotContract.winningProposal();
    console.log(`Winning propsal: ${ ethers.formatUnits(proposal, 0) }`);
    const winnerName = await ballotContract.winnerName();
    console.log(`Winner name: ${ ethers.decodeBytes32String(winnerName) }`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});