//make state tool

"use strict";

function MakePrngState( length, prngState )
{
    prngState =
    {
        index : 0,
        randomNumbers: []
    }

    for( let i = 0; i < length; i++ )
        prngState.randomNumbers.push(Math.random());

    return prngState;
}

let prngState = {};
let testp = MakePrngState( 500, prngState );
console.log
( 
	JSON.stringify( testp, 
		function( key, val )
		{
			return val.toFixed ? Number( val.toFixed(3) ) : val;
		}
	)
);
