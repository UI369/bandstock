pragma solidity ^0.8.0;

// Import the ERC-721 standard for non-fungible tokens
import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

// Define the dimensions of the grid
uint public constant GRID_WIDTH = 11;
uint public constant GRID_HEIGHT = 11;

// Define the available states for each block in the grid
enum BlockState { Up, Down }
enum BlockLight { Lit, Unlit }

// Define a struct to represent each block in the grid
struct Block {
  uint x;
  uint y;
  BlockState state;
  BlockLight light;
}

// Define the contract that represents the grid
contract Grid is ERC721 {
  // Mapping from each block's unique ID to its state
  mapping(uint => Block) public blocks;

  // Event that is emitted when a block's state changes
  event BlockStateChanged(uint id, BlockState newState);

  // Event that is emitted when a block's light state changes
  event BlockLightChanged(uint id, BlockLight newLight);

  // Function to change the state of a block
  function setBlockState(uint id, BlockState newState) public {
    // Ensure that the block exists
    require(blocks[id].x != 0, "Block does not exist");

    // Update the block's state and emit an event
    blocks[id].state = newState;
    emit BlockStateChanged(id, newState);
  }

  // Function to change the light state of a block
  function setBlockLight(uint id, BlockLight newLight) public {
    // Ensure that the block exists
    require(blocks[id].x != 0, "Block does not exist");

    // Update the block's light state and emit an event
    blocks[id].light = newLight;
    emit BlockLightChanged(id, newLight);
  }

  // Function to create a new block and assign it a unique ID
  function createBlock(uint x, uint y, BlockState state, BlockLight light) public {
    // Calculate the block's unique ID
    uint id = (x - 1) * GRID_WIDTH + y;

    // Ensure that the block doesn't already exist
    require(blocks[id].x == 0, "Block already exists");

    // Initialize the block and assign it a unique ID
    blocks[id] = Block(x, y, state, light);

    // Mint a new non-fungible token for the block
    _mint(msg.sender, id);
  }
}
