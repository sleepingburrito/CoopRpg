"use strict";

console.log( "Start processing/downloading assets" );
let downLoading = true;

//loading graphics
SetUpCanvas( "screen" );

//fps counter


function main()
{	
	//loading screen
	if ( downLoading ) //if processing/downloading assets
	{
		let doneLoading = true;

		//map data
		LoadMapData();
		if ( !LoadMapDataDone() )
			doneLoading = false;

		//npc sprite sheet, map data needs to be done for this to start
		LoadWorldNpcs();
		if ( !LoadWorldNpcsDone() )
			doneLoading = false;
	
		//download UI, is indpendnt
		LoadUi();
		if ( !LoadUiDone() )
			doneLoading = false;

		//done
		if ( doneLoading )
		{
			console.log( "Done processing/downloading assets" );
			downLoading = false;
		}
	
	}
	//==run main game logic after download==
	else
	{	
		//==main logic==
		UpdateMasterClock();
		UpdateFpsCounter();
		UpdateKeyStateFrame();
		UpdateWorldNpcs();
		UpdateOnline();

		//==drawing==
		DrawMap();
		DrawNpcs();
		UpdateTextBox();
		DrawText( displayFps.toString(), 5, 5 );

		//need to happen last in drawing
		DrawSpriteQueue();
		DrawScreenEffect();

		//SpinWait( 66 );
	}

	//main loop request
	window.requestAnimationFrame( main );
}
main();