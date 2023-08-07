import { ethers } from "hardhat";

const PROPOSALS = [ "Proposal 1", "Proposal 2", "Proposal 3" ];

async function main() {
  console.log( "Deploying Ballot contract" );
  console.log( "Proposals: " );
  PROPOSALS.forEach( ( element, index ) => {
    console.log( `Proposal N. ${ index + 1 }: ${ element }` );
  } );
  const ballotFactory = await ethers.getContractFactory( "Ballot" );
  const ballotContract = await ballotFactory.deploy( PROPOSALS.map( ethers.encodeBytes32String )
  );
  await ballotContract.waitForDeployment();
  const address = await ballotContract.getAddress();
  console.log( `Contract deployed at address: ${ address }` );
  for ( let index = 0; index < PROPOSALS.length; index++ ) {
    const proposal = await ballotContract.proposals( index );
    const name = ethers.decodeBytes32String( proposal.name );
    console.log( { index, name, proposal } );
  }
}

main().catch( ( error ) => {
  console.error( error );
  process.exitCode = 1;
} );