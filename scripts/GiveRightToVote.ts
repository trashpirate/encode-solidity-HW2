import {ethers} from "ethers";
import {Ballot__factory} from "../typechain-types";
import {Ballot} from "../typechain-types";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    const contractAddress = args[0];
    const voterAddress = args[1];
    console.log(`Contract Address: ${ contractAddress }`);
    console.log(`Voter Address: ${ contractAddress }`);

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
    const tx = await ballotContract.giveRightToVote(voterAddress);

    console.log(`Giving rights to vote to ${ voterAddress }...`);
    tx.wait().then(async (receipt) => {
        // console.log(receipt);
        if (receipt && receipt.status == 1) {
            console.log("Transaction completed.");
            const voter = await ballotContract.voters(voterAddress);
            console.log(`Voting weight for ${ voterAddress } = ${ voter.weight }`);
        }
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});