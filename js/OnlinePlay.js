"use strict";

let hostOrGuest = ONLINE_NOT_CONNECTED;
let stateId = 0;
let pullRateTimer = 0;

//other player vaules
let otherPlayerMasterClock = undefined;

function StartConnection( setHostOrGuest, setStateId )
{
	hostOrGuest = setHostOrGuest;
	stateId = setStateId;
}

function EndConnection()
{
	hostOrGuest = ONLINE_NOT_CONNECTED;
}

function OppositeOfMe()
{
	if ( hostOrGuest === ONLINE_HOST )
		return ONLINE_GUEST;
	else
		return ONLINE_HOST;
}

function MakeStateURL( doOppositeOfMe )
{
	return "/?stateId=" + stateId + "&hostOrGuest=" + ( doOppositeOfMe ? OppositeOfMe() : hostOrGuest ).toString();
}

function GetDataOtherPlayer( callBack )
{
	let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() 
	{
		if ( this.readyState == XMLHttpRequest.DONE && this.status === 200 && this.responseText.length > 0 )
			callBack( JSON.parse( this.responseText ) );
		
		//start timer to pull only after response/timeout
		pullRateTimer = StartTimer( SERVER_PULL_RATE );
	}

	xhttp.open( "POST", MakeStateURL( true ), true );
	xhttp.send();
}

function SendMyData( dataToSend )
{
	let xhttp = new XMLHttpRequest();
	xhttp.open( "POST", MakeStateURL( false ), true );
	xhttp.setRequestHeader( "Content-type", "application/json" );
	xhttp.send( JSON.stringify( dataToSend ) );
}

function UpdateOnline()
{
	if ( hostOrGuest != ONLINE_NOT_CONNECTED && TimerPassed( pullRateTimer ) )
	{
		//==other player==
		GetDataOtherPlayer
		( 
			function( fromServer )
			{ 
				guestNPC.xTileLongGoal = fromServer.xTileLongGoal != undefined ? fromServer.xTileLongGoal : 0;
				guestNPC.yTileLongGoal = fromServer.yTileLongGoal != undefined ? fromServer.yTileLongGoal : 0;

				if ( fromServer.spriteId != undefined && fromServer.spriteId != guestNPC.spriteId )
					SetSpriteNPC( fromServer.spriteId, guestNPC );

				if ( fromServer.direction != undefined && fromServer.direction != guestNPC.direction && guestNPC.animationState === ANIMATION_STANDING )
					guestNPC.direction = fromServer.direction;

				otherPlayerMasterClock = fromServer.masterClock != undefined ? fromServer.masterClock : undefined; 
			} 
		);
		

		//==you==
		SendMyData
		( 
			{
				xTileLongGoal: playerNPC.xTileLongGoal,
				yTileLongGoal: playerNPC.yTileLongGoal,
				spriteId: playerNPC.spriteId,
				direction: playerNPC.direction,
				masterClock: masterClockMs
			}
		);
	}
}