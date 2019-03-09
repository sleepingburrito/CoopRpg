"use strict";

//sprite depth
tmpEnum = 0;
const SPRITE_DEPTH_BACKGROUND_BACK = tmpEnum++;
const SPRITE_DEPTH_BACKGROUND = tmpEnum++;
const SPRITE_DEPTH_MIDDLEGROUND_BACK = tmpEnum++;
const SPRITE_DEPTH_MIDDLEGROUND = tmpEnum++;
const SPRITE_DEPTH_FOREGROUND_BACK = tmpEnum++;
const SPRITE_DEPTH_FOREGROUND = tmpEnum++;
const SPRITE_DEPTH_UI = tmpEnum++;
const SPRITE_DEPTH_UI_TOP = tmpEnum++;
const SPRITE_DEPTH_DEBUG = tmpEnum++;
const SPRITE_DEPTH_COUNT_MAX = tmpEnum++;

//animation
tmpEnum = 0;
const SPRITE_SINGLE_START = tmpEnum++;
const SPRITE_SINGLE_PLAYING = tmpEnum++; //dont set to this, use to know if its still playing
const SPRITE_SINGLE_DONE = tmpEnum++;
const SPRITE_LOOP = tmpEnum++;

let render = {}; //the canvas
let screen = {}; //the 2d context of the canvas
//looks for canvas id sets up the size
function SetUpCanvas( canvasId )
{
	render = document.getElementById( canvasId );
	render.style.width  = SCREEN_WIDTH_PX  + "px";
	render.width = SCREEN_WIDTH_PX;

	render.style.height = SCREEN_HEIGHT_PX + "px"
	render.height = SCREEN_HEIGHT_PX;

	screen = render.getContext( "2d" ); //where to render to
}


//returns an object that sprite queue can use
function SpriteObj()
{
	return {
				tileSheet: undefined,
				x: 0, //x/y are in pixels
				y: 0, 
				depth: 0,
				screenSpace: false, //if the camera effects the offset
				cropWater: false, //only shows half the sprite and bobs the sprite
				startingTile: 0, //tile index

				animation: false, //toggle animation without needing to change values above
				animationType: SPRITE_LOOP,
				tileLength: 0, //how long the animation is, less than 1 counts as no animation
				delay: 0, //pause time between frames if animated, less than 1 will not animate
				singleAnimationTimer: 0 //timerstate for single play, internal use
			};
}

let tileSheetHolder = [];
function LoadTileSheet( imageURL, tileWidthSizeInPx, tileHeightSizeInPx, doneLoadingCallback )
{
	let tmpTileSheet = 
	{
		tiles: new Image(),
		loaded: false
	};

	tmpTileSheet.tiles.src = imageURL;
	
	tmpTileSheet.tiles.onload = function() 
	{ 
		tmpTileSheet.sheetWidthPx = this.width;
		tmpTileSheet.sheetHeightPx = this.height;
		
		tmpTileSheet.tileWidthPx = Math.min( tileWidthSizeInPx, tmpTileSheet.sheetWidthPx ); 
		tmpTileSheet.tileHeightPx = Math.min( tileHeightSizeInPx, tmpTileSheet.sheetHeightPx );
		
		tmpTileSheet.sheetWidthTiles = tmpTileSheet.sheetWidthPx / tmpTileSheet.tileWidthPx;
		tmpTileSheet.sheetHeightTiles = tmpTileSheet.sheetHeightPx / tmpTileSheet.tileHeightPx;
		
		tmpTileSheet.loaded = true;

		if ( doneLoadingCallback != undefined )
			doneLoadingCallback( tmpTileSheet );
	}
		
	return tmpTileSheet;
}


let camX = 0; //in pixels
let camY = 0;
function CenterCamera( x, y )
{
	camX = x - SCREEN_WIDTH_HALF_PX;
	camY = y - SCREEN_HEIGHT_HALF_PX;
}


let spriteQueue = [];
function AddDrawQueue( SpriteObj )
{
	//work off a copy of sprite data
	let SpriteObjTmp = {};
	Object.assign( SpriteObjTmp, SpriteObj );
	
	//move the sprite to the camera
	if ( !SpriteObjTmp.screenSpace )
	{
		SpriteObjTmp.x -= camX;
		SpriteObjTmp.y -= camY;
	}
	
	//culling
	if 
	(  
		   SpriteObjTmp.tileSheet.sheetWidthPx + SpriteObjTmp.x < 0
		|| SpriteObjTmp.x > SCREEN_WIDTH_PX
		|| SpriteObjTmp.tileSheet.sheetHeightPx + SpriteObjTmp.y < 0
		|| SpriteObjTmp.y > SCREEN_HEIGHT_PX
	)
		return;
	
	//update animation
	if ( SpriteObjTmp.tileLength > 0 && SpriteObjTmp.delay > 0 && SpriteObjTmp.animation )
	{
		if ( SpriteObj.animationType === SPRITE_LOOP )
		{
			SpriteObjTmp.tileState = SpriteObjTmp.startingTile + TruncateDecimal( masterClockMs / SpriteObjTmp.delay ) % SpriteObjTmp.tileLength;
		}
		else if ( SpriteObj.animationType === SPRITE_SINGLE_START )
		{
			SpriteObj.singleAnimationTimer = StartTimer( SpriteObjTmp.tileLength * SpriteObjTmp.delay );
			SpriteObj.animationType = SPRITE_SINGLE_PLAYING;
		}
		
		if ( SpriteObj.animationType === SPRITE_SINGLE_PLAYING && !TimerPassed( SpriteObj.singleAnimationTimer ) )
		{
			SpriteObjTmp.tileState = SpriteObjTmp.startingTile + Math.floor( SpriteObjTmp.tileLength * ( 1 - TimerAmountDonePercent( SpriteObj.singleAnimationTimer, SpriteObjTmp.tileLength * SpriteObjTmp.delay ) ) );
		}
		else if ( SpriteObj.animationType === SPRITE_SINGLE_PLAYING || SpriteObj.animationType === SPRITE_SINGLE_DONE )
		{
			SpriteObj.animationType = SPRITE_SINGLE_DONE;
			SpriteObjTmp.tileState = SpriteObjTmp.startingTile + SpriteObjTmp.tileLength - 1; //leave it on last frame
		}
	}
	else //just leave on first frame if not animated
	{
		SpriteObjTmp.tileState = SpriteObjTmp.startingTile;
	}

	spriteQueue.push( SpriteObjTmp );
}

function DrawSpriteQueue()
{
	//clear screen
	screen.fillStyle = SCREEN_BACKGROUND_COLOR;
	screen.fillRect( 0, 0, SCREEN_WIDTH_PX, SCREEN_HEIGHT_PX );

	//sort sprites by depth then y to give correct perspetive effect
	spriteQueue.sort
	( 
		function( a, b ) 
		{
			if ( a.depth != b.depth )
				return a.depth - b.depth
			else
				return a.y - b.y; 
		} 
	);

	//draw sprites
	spriteQueue.forEach( function( sprite )
	{
		//water effect
		const tmpHeight = sprite.cropWater ? sprite.tileSheet.tileHeightPx / WATER_BOB_OFFSET : sprite.tileSheet.tileHeightPx;
		const waterBobOffset = sprite.cropWater ? TruncateDecimal( masterClockMs / WATER_BOB_TIME ) % WATER_BOB_AMOUNT_PX : 0;

		//draw sprite
		screen.drawImage
		(
			sprite.tileSheet.tiles, 
			sprite.tileState % sprite.tileSheet.sheetWidthTiles * sprite.tileSheet.tileWidthPx,
			TruncateDecimal( sprite.tileState / sprite.tileSheet.sheetWidthTiles ) * sprite.tileSheet.tileHeightPx, 
			sprite.tileSheet.tileWidthPx,
			tmpHeight,
			sprite.x,
			sprite.y + waterBobOffset,
			sprite.tileSheet.tileWidthPx,
			tmpHeight
		)
	});
	
	//reset the draw queue
	spriteQueue.length = 0;
}