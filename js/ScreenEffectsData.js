"use strict";

//effects
tmpEnum = 0;
const SCREEN_EFFECT_NON = tmpEnum++;
const SCREEN_EFFECT_BLACK_FADE = tmpEnum++;


let screenEffect = SCREEN_EFFECT_NON;
let effectsTimer = 0;
function StartScreenEffect( screenEffectEnum )
{
	if ( screenEffect === SCREEN_EFFECT_NON )
		screenEffect = screenEffectEnum;

	switch( screenEffectEnum )
	{
		case SCREEN_EFFECT_BLACK_FADE:
			effectsTimer = StartTimer( 300 );
		break;
	}
}

function DrawScreenEffect()
{
    if ( screenEffect === SCREEN_EFFECT_NON )
        return;

    switch( screenEffect )
	{
		case SCREEN_EFFECT_BLACK_FADE:
			screen.fillStyle = SCREEN_BACKGROUND_COLOR;

			screen.globalAlpha = TimerAmountDonePercent( effectsTimer, 300 )
			if ( screen.globalAlpha > .66 )
				screen.globalAlpha = 1;
			else if ( screen.globalAlpha > .33 )
				screen.globalAlpha = .66

			screen.fillRect( 0, 0, SCREEN_WIDTH_PX, SCREEN_HEIGHT_PX );

			screen.globalAlpha = 1;
		break;
	}

	if ( TimerPassed( effectsTimer )  )
		screenEffect = SCREEN_EFFECT_NON;
}