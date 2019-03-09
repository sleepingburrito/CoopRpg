"use strict";

let tileSizeWidthPx = 0;
let tileSizeHeightPx = 0;

let mapSizeWidthTiles = 0;
let mapSizeHeightTiles = 0;

let mapSizeWidthPx = 0;
let mapSizeHeighPx = 0;

let screenWidthTiles = 0;
let screenHeightTiles = 0;

let mapTileDataLoading = true;
let mapDataLoading = true;

let mapTilesetTileSheet = undefined; //graphics for the tileset
let mapTileSetTileAttributes = []; //array of objs that are attributes of the tiles
let mapData = undefined; //array of objs that holds ids to tile attributes
let mapCollisionNpc = []; //add dynamic collision detection to map

let ranLoadTileset = false;



function LoadMapData()
{
    //only load once
    if ( ranLoadTileset )
        return;
    else
        ranLoadTileset = true;

    function DecompressMap( mapObj )
    {
        function UndoRunLength( source )
        {
            let deflate = [];
            let repeat = 0;
        
            for( let i = 0; i < source.length; i++ )
            {
                if ( source[i] < 0 ) //run length is encoded as a negative number, next element is the number to repeat
                {
                    repeat = -source[i];
                }
                else if ( repeat < 1 ) //this is non repeated data
                {
                    deflate.push( source[i] );
                }
                else if ( repeat > 0 ) //deflate repeated number
                {
                    for( let i2 = 0; i2 <= repeat; i2++ )
                        deflate.push( source[i] );
        
                    repeat = 0;
                }
            }
        
            return deflate;
        }
        
        function UndoDictionary( source, dictionary )
        {
            let undid = [];
            for( let i = 0; i < source.length; i++ )
            {
                undid.push( dictionary[ source[i] ].num );
            }
            return undid;
        }
    
        return UndoDictionary( UndoRunLength( mapObj.data ), mapObj.dictionary )
    }

    //load map tile attribute
    GetFileWebJson
    (
        MAP_TILESHEET_DATA_FILE,
        function( inputJson )
        {
            //phrasing some tile attribute
            tileSizeWidthPx = inputJson.tilewidth;
            tileSizeHeightPx = inputJson.tileheight;

            screenWidthTiles = Math.ceil( SCREEN_WIDTH_PX / tileSizeWidthPx );
            screenHeightTiles = Math.ceil( SCREEN_HEIGHT_PX / tileSizeHeightPx );

            //load map data
            console.log("loading map data");
            GetFileWebJson
            (
                MAP_DATA_FILE,
                function( mapJson )
                {
                    mapData = mapJson;

                    //decompress map
                    for( let i = 0; i < mapData.layers.length; i++ )
                        if ( !Array.isArray( mapData.layers[i].data ) )
                            mapData.layers[i].data = DecompressMap( mapData.layers[i].data );
                    
                    mapSizeWidthTiles = mapData.width;
                    mapSizeHeightTiles = mapData.height;

                    mapSizeWidthPx = mapSizeWidthTiles * tileSizeWidthPx;
                    mapSizeHeighPx = mapSizeHeightTiles * tileSizeHeightPx;

                    mapDataLoading = false;
                    console.log("done loading map data");
                }
            );

            //load tile graphics
            console.log("loading tile attribute");
            mapTilesetTileSheet = LoadTileSheet
            ( 
                MAP_TILESHEET_IMAGE_FILE, 
                tileSizeWidthPx, 
                tileSizeHeightPx,
                function( tileSetData )
                {
                    //finish phrasing tile data
                    //make base tiles
                    for( let tileId = 0; tileId < inputJson.tilecount; tileId++ )
                    {
                        //loading attributes
                        let tmpAtt = inputJson.tileproperties[ tileId.toString() ] != undefined ? inputJson.tileproperties[ tileId.toString() ] : {};

                        //set graphic
                        let tmpSpr = SpriteObj();
                        tmpSpr.tileSheet = tileSetData;
                        tmpSpr.screenSpace = true;
                        tmpSpr.startingTile = tileId;
                        tmpSpr.tileLength = tmpAtt.length != undefined ? tmpAtt.length : 1;
                        tmpSpr.delay = tmpAtt.delay != undefined ? tmpAtt.delay : 0;
                        tmpSpr.animation = tmpAtt.animation != undefined ? tmpAtt.animation : false;

                        //set attributes/default attributes
                        mapTileSetTileAttributes.push
                        (
                            {
                                //background tile settings
                                sprite: tmpSpr,

                                solid: tmpAtt.solid != undefined ? tmpAtt.solid : false,
                                water: tmpAtt.water != undefined ? tmpAtt.water : false,
                                oneWay: tmpAtt.oneWay != undefined ? tmpAtt.oneWay : false,

                                grass: tmpAtt.grass != undefined ? tmpAtt.grass : false,
                                door: tmpAtt.door != undefined ? tmpAtt.door : false,
                                visible: tmpAtt.visible != undefined ? tmpAtt.visible : true,

                                //for anything that directions make sence
                                directionay: tmpAtt.directionay != undefined ? tmpAtt.directionay : DIREC_NON,
                                staticText: tmpAtt.staticText != undefined ? tmpAtt.staticText : "", //signs
                                
                                //for doors and lader
                                teleportX: tmpAtt.teleportX != undefined ? tmpAtt.teleportX : NO_TELEPORT,
                                teleportY: tmpAtt.teleportY != undefined ? tmpAtt.teleportY : NO_TELEPORT,

                                //npc related
                                npc: tmpAtt.npc != undefined ? tmpAtt.npc : false,
                                npcSpriteId: tmpAtt.npcSpriteId != undefined ? tmpAtt.npcSpriteId : NPC_SPRID_1,
                                npcAiWalkType: tmpAtt.npcAiWalkType != undefined ? tmpAtt.npcAiWalkType : NPC_WALK_AI_STAND,
                                npcAiMoveFrequency: tmpAtt.npcAiMoveFrequency != undefined ? tmpAtt.npcAiMoveFrequency : 0,
                                npcStartingText: tmpAtt.npcStartingText != undefined ? tmpAtt.npcStartingText : "",

                                //npc battel realted
                                npcAiBattelLevel: tmpAtt.npcAiBattelLevel != undefined ? tmpAtt.npcAiBattelLevel : NO_BATTLE,
                                npcDefeatedText: tmpAtt.npcDefeatedText != undefined ? tmpAtt.npcDefeatedText : "",
                                npcRewardItem: tmpAtt.npcRewardItem != undefined ? tmpAtt.npcRewardItem : NO_ITEM,
                                npcRewardPokemon: tmpAtt.npcRewardPokemon != undefined ? tmpAtt.npcRewardPokemon : NO_POKEMON, 
                            }
                        )
                    }
                    
                    //set done processing
                    mapTileDataLoading = false;
                    console.log("done loading tile Attributes");
                }
            );


        }
    );
}

function CheckMapData( AttributesIndex )
{
	if ( AttributesIndex > mapTileSetTileAttributes.length - 1 || AttributesIndex < -1 )
	{
		const error = 'map id out of attributes range with tile id: ' + ( AttributesIndex + 1 );
		console.log( error );
		throw error;
	}
	
	return AttributesIndex;
}

function LoadMapDataDone()
{
    return !mapDataLoading && !mapTileDataLoading && mapTilesetTileSheet != undefined  && mapTilesetTileSheet.loaded;
}

function GetMapTileAttribute( tileX, tileY, AttributeName )
{
    if ( MapOutOfBounds( tileX, tileY ) )
        return undefined;

    const index = tileX + tileY * mapSizeWidthTiles;

    if ( mapCollisionNpc[index] != undefined && mapCollisionNpc[index][AttributeName] != undefined )
        return mapCollisionNpc[index][AttributeName];

    for( let i = 0; i < mapData.layers.length; i++ )
    {
        const tmpAttributesIndex = CheckMapData( Math.max( mapData.layers[i].data[ index ] - 1, 1 ) );

        if ( mapTileSetTileAttributes[tmpAttributesIndex][AttributeName] != undefined 
            && mapTileSetTileAttributes[tmpAttributesIndex][AttributeName] != false 
            && mapTileSetTileAttributes[tmpAttributesIndex][AttributeName] != NO_TELEPORT 
            && mapTileSetTileAttributes[tmpAttributesIndex][AttributeName] != DIREC_NON
            && mapTileSetTileAttributes[tmpAttributesIndex][AttributeName].length != 0 )
                return mapTileSetTileAttributes[tmpAttributesIndex][AttributeName];
    }

    return undefined;
}

function MapOutOfBounds( tileX, tileY )
{
    return tileX < 0 || tileY < 0 || tileX >= mapSizeWidthTiles || tileY >= mapSizeHeightTiles;
}

function MapIsSolid( tileX, tileY )
{
    if ( MapOutOfBounds( tileX, tileY ) )
        return false;

    const tmpIndex = tileX + tileY * mapSizeWidthTiles;

    if ( mapCollisionNpc[tmpIndex] != undefined )
        return true;

    for( let i = 0; i < mapData.layers.length; i++ )
    {
        const tmpAttributesIndex = CheckMapData( Math.max( mapData.layers[i].data[ tmpIndex ] - 1, 0 ) );

        if ( mapTileSetTileAttributes[tmpAttributesIndex].solid != undefined && mapTileSetTileAttributes[tmpAttributesIndex].solid )
            return true;
    }

    return false;
}

function MapSetNpc( tileX, tileY, npc )
{
    if ( MapOutOfBounds( tileX, tileY ) )
        return;

    mapCollisionNpc[tileX + tileY * mapSizeWidthTiles] = npc;
}

function MapGetNpc( tileX, tileY )
{
    if ( MapOutOfBounds( tileX, tileY ) )
        return undefined;

        return mapCollisionNpc[tileX + tileY * mapSizeWidthTiles];
}

function MapIsWater( tileX, tileY )
{
    if ( MapOutOfBounds( tileX, tileY ) )
        return false;

    const tmpIndex = tileX + tileY * mapSizeWidthTiles;
    let isWater = true;

    for( let i = 0; i < mapData.layers.length; i++ )
    {
        const tmpAttributesIndex = CheckMapData( Math.max( mapData.layers[i].data[ tmpIndex ] - 1, 0 ) );

        //see if there is any water on this tile
        if ( mapTileSetTileAttributes[tmpAttributesIndex].water != undefined && mapTileSetTileAttributes[tmpAttributesIndex].water )
            isWater = true;
        else if ( tmpAttributesIndex > 1 )
            isWater = false;
    }

    return isWater;
}


//debug walls
/*
let debugSprite = SpriteObj();
debugSprite.depth = SPRITE_DEPTH_DEBUG;
debugSprite.startingTile = 26;
debugSprite.screenSpace = true;
*/

function DrawMap()
{
    //debugSprite.tileSheet = mapTilesetTileSheet; //debug walls
    
    const scrollx = TruncateDecimal( camX ) % tileSizeWidthPx;
    const scrolly = TruncateDecimal( camY ) % tileSizeHeightPx;

    for( let drawY = -1; drawY <= screenHeightTiles + 1; drawY++ )
    {
        const searchY = drawY + TruncateDecimal( camY / tileSizeHeightPx );

        for( let drawX = -1; drawX <= screenWidthTiles + 1; drawX++ )
        {
            const searchX = drawX + TruncateDecimal( camX / tileSizeWidthPx );

            //bounds check
            if ( searchX < 0 || searchY < 0 || searchX >= mapSizeWidthTiles || searchY >= mapSizeHeightTiles )
                continue;
            
            const index = searchX + searchY * mapSizeWidthTiles;
            const x = drawX * tileSizeWidthPx - scrollx;
            const y = drawY * tileSizeHeightPx - scrolly;
            
            for( let i = 0; i < mapData.layers.length; i++ )
            {
                //note: ignore tile zero and offset the ids by -1. workarounds with working with Tiled
                const tmpAttributesIndex = CheckMapData( mapData.layers[i].data[index] - 1 );
                if ( tmpAttributesIndex <= 0 || !mapTileSetTileAttributes[tmpAttributesIndex].visible )
                    continue;

                mapTileSetTileAttributes[tmpAttributesIndex].sprite.x = x;
                mapTileSetTileAttributes[tmpAttributesIndex].sprite.y = y;
                mapTileSetTileAttributes[tmpAttributesIndex].sprite.depth = mapData.layers[i].properties.depth;

                AddDrawQueue( mapTileSetTileAttributes[tmpAttributesIndex].sprite );
            }
            
            //debug walls
            /*
            if ( MapIsSolid( searchX, searchY ) )
            {
                debugSprite.x = x;
                debugSprite.y = y;
                AddDrawQueue( debugSprite );
            }
            */

        }
    }
}

