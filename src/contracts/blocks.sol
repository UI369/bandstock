pragma solidity ^0.7.0;

// Enumeration for the possible states of a block
enum BlockState { Up, Down }

// Enumeration for the possible lighting states of a block
enum LightState { Lit0, Lit1, Lit2, Lit3, Lit4, Lit5, Lit6 }

// Contract to represent the state of a block
contract Block {
    // The state of the block (up or down)
    BlockState public state;

    // The lighting state of the block (lit or unlit)
    LightState public light;

    // Constructor to initialize the state of a new block
    constructor(BlockState _state, LightState _light) public {
        state = _state;
        light = _light;
    }

    // Function to change the state of the block
    function setState(BlockState _state) public {
        state = _state;
    }

    // Function to change the lighting state of the block
    function setLight(LightState _light) public {
        light = _light;
    }
}

// Contract to represent the state of the grid
contract Grid {
    // Mapping from block coordinates to block contract addresses
    mapping(uint => mapping(uint => address)) public blocks;

    // The width and height of the grid (11x11)
    uint public const WIDTH = 11;
    uint public const HEIGHT = 11;

    // Constructor to initialize the grid with all blocks in the down state and unlit
    constructor() public {
        for (uint x = 0; x < WIDTH; x++) {
            for (uint y = 0; y < HEIGHT; y++) {
                // Create a new block contract and store its address in the mapping
                blocks[x][y] = new Block(BlockState.Down, LightState.Unlit);
            }
        }
    }

    // Function to change the state of a block in the grid
    function setBlockState(uint x, uint y, BlockState state) public {
        // Retrieve the address of the block contract
        Block storage block = Block(blocks[x][y]);

        // Call the setState function on the block contract to change its state
        block.setState(state);
    }

    // Function to change the lighting state of a block in the grid
    function setBlockLight(uint x, uint y, LightState light) public {

        // Retrieve the address of the block contract
        Block storage block = Block(blocks[x][y]);

        // Call the setLight function on the block contract to change its lighting state
        block.setLight(light);
    }
}
