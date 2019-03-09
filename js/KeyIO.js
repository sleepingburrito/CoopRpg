"use strict";

//key stat/mappings
//what keys are used
tmpEnum = 0; 
const KEY_UP = tmpEnum++;
const KEY_LEFT = tmpEnum++;
const KEY_RIGHT = tmpEnum++;
const KEY_DOWN = tmpEnum++;

const KEY_ACTION = tmpEnum++;
const KEY_BACK = tmpEnum++;
const KEY_MENU = tmpEnum++;

const KEY_COUNT_MAX = tmpEnum++;
tmpEnum = 0;

//what state they can be in
const KEY_STATE_UP = tmpEnum++; 
const KEY_STATE_TAP = tmpEnum++;
const KEY_STATE_DOWN = tmpEnum++;
tmpEnum = 0;

//last directional key press
let lastDirectionalKey = [];

//prime key states to read from
let keyStateDown = [];
let keyStateFrame = []; //use this one

for( let i = 0; i < KEY_COUNT_MAX; i++ )
{
	keyStateDown.push( false );
	keyStateFrame.push( KEY_STATE_UP )
}

function UpdateKeyState( event )
{
	const keyStateIsDown = event.type === "keydown" ? true : false;
			
	switch( event.keyCode )
	{
		case KEY_SCANCODE_UP:
		case KEY_SCANCODE_UP_ALT:
		case KEY_SCANCODE_UP_ALT2:
			keyStateDown[KEY_UP] = keyStateIsDown;
			break;

		case KEY_SCANCODE_LEFT:
		case KEY_SCANCODE_LEFT_ALT:
		case KEY_SCANCODE_LEFT_ALT2:
			keyStateDown[KEY_LEFT] = keyStateIsDown;
			break;
		
		case KEY_SCANCODE_RIGTH:
		case KEY_SCANCODE_RIGTH_ALT:
		case KEY_SCANCODE_RIGHT_ALT2:
			keyStateDown[KEY_RIGHT] = keyStateIsDown;
			break;
			
		case KEY_SCANCODE_DOWN:
		case KEY_SCANCODE_DOWN_ALT:
		case KEY_SCANCODE_DOWN_ALT2:
			keyStateDown[KEY_DOWN] = keyStateIsDown;
			break;
			
		case KEY_SCANCODE_ACTION:
		case KEY_SCANCODE_ACTION_ALT:
		case KEY_SCANCODE_ACTION_ALT2:
			keyStateDown[KEY_ACTION] = keyStateIsDown;
			break;
			
		case KEY_SCANCODE_BACK:
		case KEY_SCANCODE_BACK_ALT:
		case KEY_SCANCODE_BACK_ALT2:
			keyStateDown[KEY_BACK] = keyStateIsDown;
			break;
			
		case KEY_SCANCODE_MENU:
		case KEY_SCANCODE_MENU_ALT:
		case KEY_SCANCODE_MENU_ALT2:
			keyStateDown[KEY_MENU] = keyStateIsDown;
			break;
	}
}
document.addEventListener( "keydown", UpdateKeyState );
document.addEventListener( "keyup", UpdateKeyState );

//update the key states once a frame with tap support
//needs to be called each frame for update
function UpdateKeyStateFrame()
{
	//==update key up or down==
	for( let i = 0; i < KEY_COUNT_MAX; i++ )
	{
		if ( keyStateDown[i] )
		{
			if ( keyStateFrame[i] === KEY_STATE_UP )
				keyStateFrame[i] = KEY_STATE_TAP;
			else if ( keyStateFrame[i] === KEY_STATE_TAP )
				keyStateFrame[i] = KEY_STATE_DOWN;
		}
		else
			keyStateFrame[i] = KEY_STATE_UP;
	}

	
	//==update directional lask key press==
	if ( keyStateFrame[KEY_UP] === KEY_STATE_TAP && GetLastDirectionalKey() != KEY_UP )
		lastDirectionalKey.push(KEY_UP);

	if ( keyStateFrame[KEY_DOWN] === KEY_STATE_TAP && GetLastDirectionalKey() != KEY_DOWN )
		lastDirectionalKey.push(KEY_DOWN);

	if ( keyStateFrame[KEY_LEFT] === KEY_STATE_TAP && GetLastDirectionalKey() != KEY_LEFT )
		lastDirectionalKey.push(KEY_LEFT);

	if ( keyStateFrame[KEY_RIGHT] === KEY_STATE_TAP && GetLastDirectionalKey() != KEY_RIGHT )
		lastDirectionalKey.push(KEY_RIGHT);

	//check if the key on top is still behing help down, else remove it
	while( lastDirectionalKey.length > 0 && !keyStateDown[ GetLastDirectionalKey() ] )
		lastDirectionalKey.pop();
}

function GetLastDirectionalKey()
{
	return lastDirectionalKey.length > 0 ? lastDirectionalKey[ lastDirectionalKey.length-1 ] : undefined;
}
