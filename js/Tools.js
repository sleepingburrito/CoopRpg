"use strict";

//==timing==
let masterClockMs = 0; //read only, get time passsed in ms since app started
let masterClockDelta = Date.now(); //internal use to update master clock
function UpdateMasterClock() //update once a frame
{
	masterClockMs += Date.now() - masterClockDelta;
	masterClockDelta = Date.now();
}

function StartTimer( timeInMs )
{
	return timeInMs + masterClockMs;
}

function TimerPassed( timer )
{
	return timer <= masterClockMs;
}

function TimerAmountDonePercent( timer, duration )
{
	return clamp( (timer - masterClockMs) / duration, 0, 1 );
}

function SpinWait( timeMs )
{
	const doneTime = Date.now() + timeMs;
	while( doneTime >= Date.now() );
}

let fpsCounter = 0;
let displayFps = fpsCounter; //read from for fps
let fpsTimer = StartTimer( ONE_SECOND_MS );
function UpdateFpsCounter()
{
	if ( fpsCounter++, TimerPassed( fpsTimer ) )
	{
		fpsTimer = StartTimer( 1000 ); 
		displayFps = fpsCounter;
		fpsCounter = 0;
	}
}


//==web data==
function GetFileWebJson( url, processJsonFunction )
{
	let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() 
	{
		if ( this.readyState === XMLHttpRequest.DONE && this.status === 200 )
			processJsonFunction( JSON.parse( this.responseText ) );
				
	}
	xhttp.open( "GET", url, true );
	xhttp.send();
}


//==math==
function Distance( x1, y1, x2, y2 )
{
	return Math.sqrt( ( ( x1 - x2 ) ** 2 ) + ( ( y1 - y2 ) ** 2 ) );
}

function TruncateDecimal( value )
{
	return value < 0 ? Math.ceil( value ) : Math.floor( value );
}

function clamp( value, min, max )
{
	return Math.max( Math.min( value, max ), min );
}

function CrappyHash( input )
{
	let str = JSON.stringify( input );
	let hash = 0;

	for( let i = 0; i < str.length; i++ )
		hash += str.charCodeAt( i );

	return hash;
}

//map spacing math tools
function PixelToTile( coordinate, tileSize )
{
    return TruncateDecimal( coordinate / tileSize );
}

function TileToPixel( coordinate, tileSize )
{
    return coordinate * tileSize;
}