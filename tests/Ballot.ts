import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Ballot } from "../typechain-types";

const PROPOSALS = [ "Proposal 1", "Proposal 2", "Proposal 3" ];

// manual way of converting stirng into bytes32
function convertStringArrayToBytes32( array: string[] ) {
    const bytes32Array = [];
    for ( let index = 0; index < array.length; index++ ) {
        bytes32Array.push( ethers.encodeBytes32String( array[ index ] ) );
    }
    return bytes32Array;
}

// function to use loadFixtures
async function deployContract() {
    const ballotFactory = await ethers.getContractFactory( "Ballot" );
    const ballotContract = await ballotFactory.deploy(
        convertStringArrayToBytes32( PROPOSALS )
    );
    await ballotContract.waitForDeployment();
    return ballotContract;
}

describe( "Ballot", async () => {
    let ballotContract: Ballot;
    beforeEach( async () => {
        ballotContract = await loadFixture( deployContract );
    } );
    describe( "when the contract is deployed", async () => {
        it( "has the provided proposals", async () => {
            for ( let index = 0; index < PROPOSALS.length; index++ ) {
                const proposal = await ballotContract.proposals( index );
                expect( ethers.decodeBytes32String( proposal.name ) ).to.eq( PROPOSALS[ index ] );
            }

        } );
        it( "has zero votes for all proposals", async () => {
            for ( let index = 0; index < PROPOSALS.length; index++ ) {
                const proposal = await ballotContract.proposals( index );
                expect( proposal.voteCount ).to.eq( 0n ); // n is for big number
            }
        } );
        it( "sets the deployer as chairperson", async () => {
            const accounts = await ethers.getSigners();
            // const ballotFactory = await ethers.getContractFactory("Ballot");
            // const ballotContract = await ballotFactory.deploy(PROPOSALS.map(ethers.encodeBytes32String));
            // // const ballotContract = await ballotFactory.deploy(convertStringArrayToBytes32(PROPOSALS));
            // await ballotContract.waitForDeployment();
            const chairperson = await ballotContract.chairperson();
            expect( chairperson ).to.eq( accounts[ 0 ].address );
        } );
        it( "sets the voting weight for the chairperson as 1", async () => {
            const accounts = await ethers.getSigners();
            const chairpersonVoter = await ballotContract.voters( accounts[ 0 ].address );
            expect( chairpersonVoter.weight ).to.eq( 1n );
        } );
    } );
    describe( "when the chairperson interacts with the giveRightToVote function in the contract", async () => {
        it( "gives right to vote for another address", async () => {
            const accounts = await ethers.getSigners();
            await ballotContract.giveRightToVote( accounts[ 1 ].address );
            const voter = await ballotContract.voters( accounts[ 1 ].address );
            expect( voter.weight ).to.eq( 1n );
        } );
        it( "can not give right to vote for someone that has voted", async () => {
            const accounts = await ethers.getSigners();
            await ballotContract.giveRightToVote( accounts[ 1 ].address );
            await ballotContract.connect( accounts[ 1 ] ).vote( 1 );
            const voter = await ballotContract.voters( accounts[ 1 ].address );
            // this doesn't really make sense, you need to give the rights so someone can vote,
            // but then you can't for someone who's voted -> redundant?
        } );
        it( "can not give right to vote for someone that has already voting rights", async () => {
            const accounts = await ethers.getSigners();
            await ballotContract.giveRightToVote( accounts[ 1 ].address );
            const voter = await ballotContract.voters( accounts[ 1 ].address );
            expect( ballotContract.giveRightToVote( accounts[ 1 ].address ) ).to.be.reverted;
            // question here: how to do the reverted cases, when await (why not here?)
        } );
    } );

    describe( "when the voter interacts with the vote function in the contract", async () => {
        it( "should register the vote", async () => {
            const accounts = await ethers.getSigners();
            await ballotContract.giveRightToVote( accounts[ 1 ].address );
            await ballotContract.connect( accounts[ 1 ] ).vote( 1 );
            const voter = await ballotContract.voters( accounts[ 1 ].address );
            expect( voter.voted ).to.eq( true );
        } );
    } );

    describe( "when the voter interacts with the delegate function in the contract", async () => {
        // TODO
        it( "should transfer voting power", async () => {
            const accounts = await ethers.getSigners();
            await ballotContract.giveRightToVote( accounts[ 1 ].address );
            await ballotContract.giveRightToVote( accounts[ 2 ].address );
            await ballotContract.connect( accounts[ 1 ] ).delegate( accounts[ 2 ].address );
            const voter = await ballotContract.voters( accounts[ 1 ].address );
            const delegate = await ballotContract.voters( accounts[ 2 ].address );
            // when await ?
            expect( voter.voted ).to.eq( true );
            expect( delegate.weight ).to.eq( 2 );
        } );
    } );

    describe( "when an account other than the chairperson interacts with the giveRightToVote function in the contract", async () => {
        it( "should revert", async () => {
            const accounts = await ethers.getSigners();
            expect( ballotContract.connect( accounts[ 1 ] ).giveRightToVote( accounts[ 2 ].address ) ).to.be.reverted;
        } );
    } );

    describe( "when an account without right to vote interacts with the vote function in the contract", async () => {
        it( "should revert", async () => {
            const accounts = await ethers.getSigners();
            expect( ballotContract.connect( accounts[ 1 ] ).vote( 1 ) ).to.be.reverted;
        } );
    } );

    describe( "when an account without right to vote interacts with the delegate function in the contract", async () => {
        it( "should revert", async () => {
            const accounts = await ethers.getSigners();
            await ballotContract.giveRightToVote( accounts[ 2 ].address );
            expect( ballotContract.connect( accounts[ 1 ] ).delegate( accounts[ 2 ].address ) ).to.be.reverted;
        } );
    } );
} );