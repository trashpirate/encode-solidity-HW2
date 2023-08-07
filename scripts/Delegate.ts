import { encodeBytes32String } from "ethers";
import { ethers } from "ethers";
import { Ballot__factory } from "../typechain-types";
import { Ballot } from "../typechain-types";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const args = process.argv.slice( 2 );
    const contractAddress = args[ 0 ];
    const delegateAddress = args[ 1 ];
    console.log( `Vote on Ballot contract: ${ contractAddress }` );
    console.log( `Vote on Ballot contract: ${ delegateAddress }` );

    const provider = new ethers.JsonRpcProvider( process.env.RPC_ENDPOINT_URL ?? "" );
    const wallet = new ethers.Wallet( process.env.PRIVATE_KEYS?.split( ',' )[ 1 ] ?? "", provider );

    console.log( `Using address ${ wallet.address }` );
    const balanceBN = await provider.getBalance( wallet.address );
    const balance = Number( ethers.formatUnits( balanceBN ) );
    console.log( `Wallet balance ${ balance }` );
    if ( balance < 0.01 ) {
        throw new Error( "Not enough ether" );
    }

    const ballotFactory = new Ballot__factory( wallet );
    const ballotContract = ballotFactory.attach( contractAddress ) as Ballot;
    const tx = await ballotContract.delegate( delegateAddress );

    console.log( "Delegating..." );
    tx.wait().then( async ( receipt ) => {
        // console.log(receipt);
        if ( receipt && receipt.status == 1 ) {
            // transaction success.
            console.log( "Vote delegated." );
        }
    } );
}

main().catch( ( error ) => {
    console.error( error );
    process.exitCode = 1;
} );