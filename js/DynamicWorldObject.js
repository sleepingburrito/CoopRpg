"use strict";

let worldObjects = [];

//shortcuts to these npcs
let playerNPC = undefined;
let guestNPC = undefined;

//graphics reference
let npcSpriteSheet = undefined;


//ANIMATION enum, order matters
tmpEnum = 0;
const ANIMATION_STANDING = tmpEnum++;
const ANIMATION_WALKING = tmpEnum++;
const ANIMATION_COUNT_MAX = tmpEnum++;

//sprites enum
tmpEnum = 0;
const NPC_SPRID_1 = tmpEnum++; //cop
const NPC_SPRID_2 = tmpEnum++; //girl 

//npc walk ai types
tmpEnum = 0;
const NPC_WALK_AI_STAND = tmpEnum++; //stand and face direction
const NPC_WALK_AI_WALK = tmpEnum++; //walk random around
const NPC_WALK_TURN = tmpEnum++; //stand but turn randomly




//==npc setup==
function BaseWorlNpc()
{
    return {
                //==gmaeplay==
                player: false,
                freeze: false,

                //timers
                walkTimer: 0,
                freezeTimer: 0, //when set cant move till passed

                //location/movment
                xTileStart: 0,
                yTileStart: 0,
				xTileLongGoal: 0, //set this to move the npc
                yTileLongGoal: 0,
                distanceFromCameraTile: 0, //read only, updated by draw
                direction: DIREC_DOWN,
                moveSpeed: NPC_WALK_ANIMATION_DELAY,

                //==graphics==
                spriteId: NPC_SPRID_1,
                spriteDirections: [], //index of this array are the DIRECs
                animationState: ANIMATION_STANDING,

                //used for walking animation state
                xTile: 0,
                yTile: 0,

                xTileGoal: 0, //x/y used for moving one tile animation
                yTileGoal: 0,

                alternateDirection: true, //used to zig zag to location
                
                //walking effects interaction graphics (grass/doors)
                wakingStartedThisFrame: false, //fires off the effects
                walkingEffectSlidingDoorSprite: undefined,
                walkingEffectNpcGrassSprite: undefined,

                //==npc ai==
                npcWalkAi: NPC_WALK_AI_STAND,
                npcAiMoveFrequency: NPC_WALK_AI_MOVE_FREQUENCY_MIN,
                npcStartingText: undefined,
           }
}

//use this insted of SetNpcPosition to teleport a npc
function TeleportNpc( xTile, yTile, direction, npc )
{
    npc.xPixel = TileToPixel( npc.xTileGoal = npc.xTile = npc.xTileLongGoal = xTile, tileSizeWidthPx );
    npc.yPixel = TileToPixel( npc.yTileGoal = npc.yTile = npc.yTileLongGoal = yTile, tileSizeHeightPx );
    npc.direction = direction;
}

//Sprite Helpers
function SetSpriteNPC( spriteId, npc )
{
    //sets the sprites off a predefined sprite layout
    npc.spriteId = spriteId;
    let spriteDirectionsArray = npc.spriteDirections;
    let startingSpriteSheetIndex = spriteId * NPC_SPRITESHEET_WIDTH * NPC_SPRITESHEET_HEIGHT; 

    //set base sprites
    for( let anima = 0; anima < ANIMATION_COUNT_MAX; anima++ )
        for( let direc = 0; direc < DIREC_COUNT_MAX; direc++ )
        {
            let tmpSpr = spriteDirectionsArray[ anima + direc * ANIMATION_COUNT_MAX ] = SpriteObj();
            tmpSpr.tileSheet = npcSpriteSheet;
            tmpSpr.depth = SPRITE_DEPTH_MIDDLEGROUND;        
        }

    //set sprites
    for( let direc = 0; direc < DIREC_COUNT_MAX - 1; direc++ ) //-1 to not set a non
    {
        //stand
        let tmpSpr = spriteDirectionsArray[ ANIMATION_STANDING + direc * ANIMATION_COUNT_MAX ];
        tmpSpr.startingTile = startingSpriteSheetIndex;

        //walk
        tmpSpr = spriteDirectionsArray[ ANIMATION_WALKING + direc * ANIMATION_COUNT_MAX ];
        tmpSpr.startingTile = startingSpriteSheetIndex;
        tmpSpr.tileLength = NPC_WALK_ANIMATION_LENGTH;
        tmpSpr.delay = NPC_WALK_ANIMATION_DELAY;
        tmpSpr.animation = true;

        //move to next diretion in the sprite sheet
        startingSpriteSheetIndex += NPC_WALK_ANIMATION_LENGTH;
    }
}

//returns a base npc and adds it to worldObjects list
function MakeNpc( spriteId, xtile, ytile )
{
    let tmpNpc = BaseWorlNpc();

    //graphics
    SetSpriteNPC( spriteId, tmpNpc );
    tmpNpc.direction = DIREC_DOWN;

    //location
    tmpNpc.xTileStart = xtile;
    tmpNpc.yTileStart = ytile;
    TeleportNpc( xtile, ytile, tmpNpc.direction, tmpNpc );


    //walking sprite effects
    //doors
    tmpNpc.walkingEffectSlidingDoorSprite = SpriteObj();
    tmpNpc.walkingEffectSlidingDoorSprite.tileSheet = mapTilesetTileSheet;
    tmpNpc.walkingEffectSlidingDoorSprite.animation = true;
    tmpNpc.walkingEffectSlidingDoorSprite.startingTile = NPC_DOOR_ID;
    tmpNpc.walkingEffectSlidingDoorSprite.delay = NPC_DOOR_DELAY;
    tmpNpc.walkingEffectSlidingDoorSprite.depth = SPRITE_DEPTH_MIDDLEGROUND_BACK;
    tmpNpc.walkingEffectSlidingDoorSprite.tileLength = NPC_DOOR_LENGTH;

    //grass
    tmpNpc.walkingEffectNpcGrassSprite = SpriteObj();
    tmpNpc.walkingEffectNpcGrassSprite.tileSheet = mapTilesetTileSheet;
    tmpNpc.walkingEffectNpcGrassSprite.animation = true;
    tmpNpc.walkingEffectNpcGrassSprite.startingTile = NPC_GRASS_ID;
    tmpNpc.walkingEffectNpcGrassSprite.delay = NPC_GRASS_DELAY;
    tmpNpc.walkingEffectNpcGrassSprite.depth = SPRITE_DEPTH_FOREGROUND_BACK;
    tmpNpc.walkingEffectNpcGrassSprite.tileLength = NPC_GRASS_LENGTH;


    //add to world
    worldObjects.push( tmpNpc );
    return tmpNpc;
}

//ran by LoadWorldObjs once to make the player
function MakePlayer( spriteId, xtile, ytile )
{
    let tmpOp = MakeNpc( spriteId, xtile, ytile );

    tmpOp.player = true;
    CenterCamera( tmpOp.xPixel, tmpOp.yPixel );

    return tmpOp;
}

let ranLoadWorldObjects = false;
function LoadWorldNpcs()
{
    //only load once if called multiple times/ make sure tiles are loaded
    if ( ranLoadWorldObjects || !LoadMapDataDone() )
        return;
    else
        ranLoadWorldObjects = true;

    console.log("Running LoadWorldObjects");

    npcSpriteSheet = LoadTileSheet
    ( 
        NPC_SPRITESHEET_IMAGE_FILE, NPC_TILES_WIDTH_PX, NPC_TILES_HEIGHT_PX, 
        function()
        {
            //once your done loading tileset
            playerNPC = MakePlayer( NPC_SPRID_1, 20, 16 );
            guestNPC = MakeNpc( NPC_SPRID_2, 20, 16 );

            //loop though map data to make npcs
            for( let y = 0; y < mapSizeHeightTiles; y++ )
                for( let x = 0; x < mapSizeWidthTiles; x++ )
                    if ( GetMapTileAttribute( x, y, "npc" ) )
                    {
                        const tmpStrId = GetMapTileAttribute( x, y, "npcSpriteId" );
                        let tmpNpc = MakeNpc( tmpStrId === undefined ? NPC_SPRID_1 : tmpStrId, x, y );
                        tmpNpc.npcWalkAi = GetMapTileAttribute( x, y, "npcAiWalkType" );
                        tmpNpc.npcAiMoveFrequency = Math.max( NPC_WALK_AI_MOVE_FREQUENCY_MIN, GetMapTileAttribute( x, y, "npcAiMoveFrequency" ) );
                        
                        const tmpDirection = GetMapTileAttribute( x, y, "directionay" );
                        if ( tmpDirection != DIREC_NON && tmpDirection != undefined )
                            tmpNpc.direction = tmpDirection;
                    
                        tmpNpc.npcStartingText = GetMapTileAttribute( x, y, "npcStartingText" );
                    }


            console.log("Done LoadWorldObjects"); 
        } 
    );
}

function LoadWorldNpcsDone()
{
    return npcSpriteSheet != undefined && npcSpriteSheet.loaded;
}

function FaceTileNPC( npc, tileX, tileY )
{
    if ( npc === undefined )
        return;

    if ( npc.xTile > tileX )
        npc.direction = DIREC_LEFT;
    else if ( npc.xTile < tileX )
        npc.direction = DIREC_RIGHT;

    if ( npc.yTile > tileY )
        npc.direction = DIREC_UP;
    else if ( npc.yTile < tileY )
        npc.direction = DIREC_DOWN;
}

//==npc tick==
let playerTurnPaseTimer = 0; //these 3 varables are for the pause when turing and only used for that for the function below for the player
let playerTurnLastDirection = DIREC_NON;
let playerWalkingLastFrame = false;

function UpdateWorldNpcs()
{
    //used internaly to set animation values
    function SetNpcPosition( xTile, yTile, direction, npc )
    {
        npc.xPixel = TileToPixel( npc.xTileGoal = npc.xTile = xTile, tileSizeWidthPx );
        npc.yPixel = TileToPixel( npc.yTileGoal = npc.yTile = yTile, tileSizeHeightPx );
        npc.direction = direction;
    }

    for( let i = 0; i < worldObjects.length; i++ )
    {
        let tmpNpc = worldObjects[i];

        //==move npcs==
        if ( tmpNpc.animationState === ANIMATION_WALKING )
        {
            //end firing of walking effects
            tmpNpc.wakingStartedThisFrame = false;

            //walk animation
            tmpNpc.xPixel = ( TileToPixel( tmpNpc.xTileGoal, tileSizeWidthPx ) - TileToPixel( tmpNpc.xTile, tileSizeWidthPx ) ) * ( 1 - TimerAmountDonePercent( tmpNpc.walkTimer, tmpNpc.moveSpeed ) ) + TileToPixel( tmpNpc.xTile, tileSizeWidthPx );
            tmpNpc.yPixel = ( TileToPixel( tmpNpc.yTileGoal, tileSizeHeightPx ) - TileToPixel( tmpNpc.yTile, tileSizeHeightPx ) ) * ( 1 - TimerAmountDonePercent( tmpNpc.walkTimer, tmpNpc.moveSpeed ) ) + TileToPixel( tmpNpc.yTile, tileSizeHeightPx );

            if ( TimerPassed( tmpNpc.walkTimer ) )
            {
                //switch back to standing and move the npc
                tmpNpc.animationState = ANIMATION_STANDING;
                SetNpcPosition( tmpNpc.xTileGoal, tmpNpc.yTileGoal, tmpNpc.direction, tmpNpc );

                //check if teleport tile
                const tmpX = GetMapTileAttribute( tmpNpc.xTile, tmpNpc.yTile, "teleportX" );
                const tmpY = GetMapTileAttribute( tmpNpc.xTile, tmpNpc.yTile, "teleportY" );
                const tmpDirectionay = GetMapTileAttribute( tmpNpc.xTile, tmpNpc.yTile, "directionay" );

                if ( tmpX != undefined && tmpX != NO_TELEPORT && tmpY != undefined && tmpY != NO_TELEPORT )
                {
                    if ( tmpNpc.player )
                        StartScreenEffect( SCREEN_EFFECT_BLACK_FADE );

                    tmpNpc.freezeTimer = StartTimer( NPC_TELEPORT_PAUSE );
                    tmpNpc.xTileLongGoal = tmpX;
                    tmpNpc.yTileLongGoal = tmpY;
                    SetNpcPosition( tmpX, tmpY, tmpDirectionay != undefined && tmpDirectionay != DIREC_NON ? tmpDirectionay : tmpNpc.direction, tmpNpc );
                }
                
            }
        }


        //==player code==
        if ( tmpNpc.player )
        {
            //walking/running/interacting io
            if ( tmpNpc.animationState === ANIMATION_STANDING 
                && !tmpNpc.freeze
                && TimerPassed( tmpNpc.freezeTimer ) 
                && !uiOpen )
            {
                //==movment setup==
                let yDelta = 0;
                let xDelta = 0;

                const lastKey = GetLastDirectionalKey();

                if ( lastKey === KEY_UP )
                {
                    yDelta--;
                    tmpNpc.direction = DIREC_UP;
                }
                else
                if ( lastKey === KEY_DOWN )
                {
                    yDelta++;
                    tmpNpc.direction = DIREC_DOWN;
                }
                else
                if ( lastKey === KEY_LEFT )
                {
                    tmpNpc.direction = DIREC_LEFT;
                    xDelta--;
                }
                else
                if ( lastKey === KEY_RIGHT )
                {
                    tmpNpc.direction = DIREC_RIGHT;
                    xDelta++;
                }

                //pause the player when turning
                if ( playerTurnLastDirection != tmpNpc.direction && !playerWalkingLastFrame )
                {
                    playerTurnPaseTimer = StartTimer( NPC_PLAYER_TURN_PAUSE );
                    playerTurnLastDirection = tmpNpc.direction;
                }

                if ( TimerPassed(playerTurnPaseTimer) && ( xDelta != 0 || yDelta != 0 ) && !MapIsSolid( tmpNpc.xTile + xDelta, tmpNpc.yTile + yDelta ) )
                {                    
                    tmpNpc.xTileLongGoal += xDelta;
                    tmpNpc.yTileLongGoal += yDelta;

                    playerWalkingLastFrame = true;
                }
                else
                    playerWalkingLastFrame = false;

                
                //==running==
                if ( keyStateFrame[KEY_BACK] != KEY_STATE_UP )
                    tmpNpc.moveSpeed = NPC_WALK_ANIMATION_DELAY_RUN;
                else
                    tmpNpc.moveSpeed = NPC_WALK_ANIMATION_DELAY;


                //==interacting with a==
                if ( keyStateFrame[KEY_ACTION] === KEY_STATE_TAP )
                {
                    let tmpTileX = tmpNpc.xTile;
                    let tmpTileY = tmpNpc.yTile;

                    if ( tmpNpc.direction === DIREC_UP )
                        tmpTileY--;
                    else if ( tmpNpc.direction === DIREC_DOWN )
                        tmpTileY++;
                    else if ( tmpNpc.direction === DIREC_LEFT )
                        tmpTileX--;
                    else if ( tmpNpc.direction === DIREC_RIGHT )
                        tmpTileX++;


                    //signs/npc static text
                    DrawTextBoxStart( GetMapTileAttribute( tmpTileX, tmpTileY, "staticText" ) );

                    let tmpNpcSearch = MapGetNpc( tmpTileX, tmpTileY );
                    if ( tmpNpcSearch != undefined )
                    {
                        DrawTextBoxStart( tmpNpcSearch.npcStartingText );
                    }
                }
            }

            //make camera follow player in overworld
            CenterCamera( playerNPC.xPixel + NPC_SPRITESHEET_WIDTH / 2, playerNPC.yPixel + NPC_SPRITESHEET_HEIGHT / 2 );
        }
        //==npc ai==
        else if ( tmpNpc != guestNPC ) //make sure its not the other plays
        {
            function NpcSynchronizedSeed()
            {
                if ( hostOrGuest === ONLINE_NOT_CONNECTED || hostOrGuest === ONLINE_HOST )
                    return masterClockMs;
                else
                    return otherPlayerMasterClock === undefined ? 0 : otherPlayerMasterClock;
            }

            function CheckNextToPlayer( playerObj )
            {
                //see if its a block next to you
                return Distance( tmpNpc.xTile, tmpNpc.yTile, playerObj.xTile, playerObj.yTile ) <= 1;
            }

            //if in activation distance
            if ( tmpNpc.distanceFromCameraTile < NPC_MAX_DISTANCE_TILES )
            {
                if ( tmpNpc.animationState === ANIMATION_STANDING ) 
                {
                    //set where your standing in the world
                    MapSetNpc( tmpNpc.xTile, tmpNpc.yTile, tmpNpc );

                    //synchronize random movment
                    CrappyPseudoRandom( TruncateDecimal( NpcSynchronizedSeed() / tmpNpc.npcAiMoveFrequency ) );
                    
                    //stop and face a player if next to one
                    if ( CheckNextToPlayer( playerNPC ) )
                    {
                        FaceTileNPC( tmpNpc, playerNPC.xTile, playerNPC.yTile );
                    }
                    else if ( CheckNextToPlayer( guestNPC ) )
                    {
                        FaceTileNPC( tmpNpc, guestNPC.xTile, guestNPC.yTile );
                    }
                    else if ( tmpNpc.npcWalkAi === NPC_WALK_AI_WALK ) //walk around randomly (does not take inaccount walls)
                    {
                        const halfDist = -TruncateDecimal( NPC_WALK_AI_MAX_DISTANCE / 2 );
                        tmpNpc.xTileLongGoal = tmpNpc.xTileStart + halfDist + TruncateDecimal( NPC_WALK_AI_MAX_DISTANCE * CrappyPseudoRandom() );
                        tmpNpc.yTileLongGoal = tmpNpc.yTileStart + halfDist + TruncateDecimal( NPC_WALK_AI_MAX_DISTANCE * CrappyPseudoRandom() );
                    }
                    else if ( tmpNpc.npcWalkAi === NPC_WALK_TURN ) //face random directions
                    {
                        switch( Math.floor( 4 * CrappyPseudoRandom() ) )
                        {
                            case 0:
                                tmpNpc.direction = DIREC_DOWN;
                            break;

                            case 1:
                                tmpNpc.direction = DIREC_UP;
                            break;

                            case 2:
                                tmpNpc.direction = DIREC_LEFT;
                            break;

                            case 3:
                                tmpNpc.direction = DIREC_RIGHT;
                            break;
                        }
                         
                    }
                }
            }
        }
        
        
        //setup moving npc
        if ( tmpNpc.animationState === ANIMATION_STANDING )
        {
            //==setup npc movment==
            if ( TimerPassed( tmpNpc.freezeTimer ) && ( tmpNpc.xTileLongGoal != tmpNpc.xTile || tmpNpc.yTileLongGoal != tmpNpc.yTile ) )
            {
                //npc free tile you where on
                if ( !tmpNpc.player && tmpNpc != guestNPC )
                    MapSetNpc( tmpNpc.xTile, tmpNpc.yTile, undefined );

                //find where to move
                let xDelta = clamp( tmpNpc.xTileLongGoal - tmpNpc.xTile, -1, 1 );
                let yDelta = clamp( tmpNpc.yTileLongGoal - tmpNpc.yTile, -1, 1 );
                
                //zig zag
                if ( xDelta != 0 && yDelta != 0 )
                    if ( tmpNpc.alternateDirection )
                    {
                        xDelta = 0;
                        tmpNpc.alternateDirection = false;
                    }
                    else
                    {
                        yDelta = 0;
                        tmpNpc.alternateDirection = true;
                    }
                    
                //set facing
                if ( xDelta < 0 )
                    tmpNpc.direction = DIREC_LEFT;
                else if ( xDelta > 0 )
                    tmpNpc.direction = DIREC_RIGHT;
                else if ( yDelta < 0 )
                    tmpNpc.direction = DIREC_UP;
                else if ( yDelta > 0 )
                    tmpNpc.direction = DIREC_DOWN;


                //error protection if problems getting to location
                if 
                ( //teleport if
                        Distance( tmpNpc.xTileLongGoal, tmpNpc.yTileLongGoal, tmpNpc.xTile, tmpNpc.yTile ) >= NPC_MAX_DISTANCE_TILES //npc is too far
                        || MapIsSolid( tmpNpc.xTile + xDelta, tmpNpc.yTile + yDelta ) //you run into a wall on the way there
                )
                {
                    SetNpcPosition( tmpNpc.xTileLongGoal, tmpNpc.yTileLongGoal, tmpNpc.direction, tmpNpc ); 
                }
                else 
                { //start single tile movment
                    tmpNpc.xTileGoal = ( tmpNpc.xTile = PixelToTile( tmpNpc.xPixel, tileSizeWidthPx ) ) + xDelta;
                    tmpNpc.yTileGoal = ( tmpNpc.yTile = PixelToTile( tmpNpc.yPixel, tileSizeHeightPx ) ) + yDelta;

                    //start walking
                    tmpNpc.walkTimer = StartTimer( tmpNpc.moveSpeed );
                    tmpNpc.animationState = ANIMATION_WALKING;

                    //fire off walking effects
                    tmpNpc.wakingStartedThisFrame = true;
                }
            }
        }


    }
}


//==drawing==
function DrawNpcs()
{
    const camTileX = PixelToTile( camX + SCREEN_WIDTH_HALF_PX, tileSizeWidthPx );
    const camTileY = PixelToTile( camY + SCREEN_HEIGHT_HALF_PX, tileSizeHeightPx );
    let playerSprite = undefined;

    for( let i = 0; i < worldObjects.length; i++ )
    {
        //find distance from npc to camera
        let tmpNpc = worldObjects[i];
        tmpNpc.distanceFromCameraTile = Distance( tmpNpc.xTile, tmpNpc.yTile, camTileX, camTileY );

        //==culling==
        if ( tmpNpc.distanceFromCameraTile >= NPC_MAX_DISTANCE_TILES )
            return;
    
        //==walking/standing sprites==
        let tmpSpr = tmpNpc.spriteDirections[ tmpNpc.animationState + tmpNpc.direction * ANIMATION_COUNT_MAX ];
        tmpSpr.x = tmpNpc.xPixel;
        tmpSpr.y = tmpNpc.yPixel - tileSizeHeightPx; //npc sprites are 2 blocks big, offset one block up
        tmpSpr.delay = tmpNpc.moveSpeed;

        //water effects
        tmpSpr.cropWater = MapIsWater( tmpNpc.xTile, tmpNpc.yTile );;
        
        //draw npc sprite
        if ( !tmpNpc.player )
            AddDrawQueue( tmpSpr );
        else //add the player at the end to sprite queue so they draw on top of other npcs
            playerSprite = tmpSpr;

        //==walking animation effects==
        //door
        if ( tmpNpc.wakingStartedThisFrame )
        {
            //sliding door
            tmpNpc.walkingEffectSlidingDoorSprite.animationType = SPRITE_SINGLE_START;

            //grass
            tmpNpc.walkingEffectNpcGrassSprite.animationType = SPRITE_SINGLE_START;
        }

        //sliding doors
        if ( GetMapTileAttribute( tmpNpc.xTileGoal, tmpNpc.yTileGoal, "door" ) != undefined )
        {
            tmpNpc.walkingEffectSlidingDoorSprite.x = TileToPixel( tmpNpc.xTileGoal, tileSizeHeightPx );
            tmpNpc.walkingEffectSlidingDoorSprite.y = TileToPixel( tmpNpc.yTileGoal, tileSizeHeightPx );
            AddDrawQueue( tmpNpc.walkingEffectSlidingDoorSprite );
        }

        //force the player to watch the door open
        if ( tmpNpc.walkingEffectSlidingDoorSprite.animationType != SPRITE_SINGLE_DONE && GetMapTileAttribute( tmpNpc.xTileGoal, tmpNpc.yTileGoal, "door" ) != undefined )
        {
            tmpNpc.walkTimer = StartTimer( NPC_WALK_ANIMATION_DELAY );
        }

        //grass
        if ( GetMapTileAttribute( tmpNpc.xTileGoal, tmpNpc.yTileGoal, "grass" ) != undefined )
        {
            tmpNpc.walkingEffectNpcGrassSprite.x = tmpNpc.xPixel;
            tmpNpc.walkingEffectNpcGrassSprite.y = tmpNpc.yPixel;
            AddDrawQueue( tmpNpc.walkingEffectNpcGrassSprite );
        }
    }

    //add at end to draw player ontop
    AddDrawQueue( playerSprite );
}