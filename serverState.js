//libs
let http = require( 'http' );
let url = require( 'url' );
var fs = require('fs');

//named const
const PORT = 8081;
const NO_CONTENT = "";
const MAX_POST_SIZE = 1000000; //max size in bytes the state can be
const MAX_STATES = 1000; //max number of states the server can hold
const MAX_TIME_MS = 604800000; //states older than can be reused

//error status codes
const ERROR_NON = 200;
const ERROR_BAD_REQUEST = 400;
const ERROR_OVERSIZED_REQUEST = 413;
const ERROR_OUT_OF_MEMERY = 507;

//whos who
const HOST = 0;
const GUEST = 1;

//gloable state
let savedState = [];


//main
console.log( Date() + " server started on port: " + PORT );
http.createServer
(
	function ( request, resolution )
	{
		//return state
		let errorCode = ERROR_NON; //no error to start with
		let sendbackContent = NO_CONTENT;
		
		//url parsing
		const parsedURL = url.parse( request.url, true ).query;
		const stateId = parseInt( parsedURL.stateId );
		const hostOrGuest = parseInt( parsedURL.hostOrGuest );
		const masterClockMs = Date.now();
		
		//non formatted urls get used as web server
		if ( isNaN( stateId ) || isNaN( hostOrGuest ) )
		{
			console.log( Date() + " serving file " + request.url );

			//file host if not valid url
			fs.readFile
			( 
				"." + request.url, 
				function( err, data )
				{
					if (err)
					{
						resolution.writeHead( 404, { 'Content-Type': 'text/html' } );
						resolution.write( "" );
						resolution.end();
					}
					else
					{
						resolution.writeHead( 200, { 'Content-Type': 'text/html' } );
						resolution.write( data );
						resolution.end();
					}
				}
			);
		}
		//load a state if correct url data
		else
		{
			//loading post data
			let postData = NO_CONTENT;
			request.on
			( 
				'data',
				function ( data ) 
				{
					if ( errorCode != ERROR_NON ) //pass old error code if error happen before this point
						return;
					
					if ( data.length > MAX_POST_SIZE )
					{
						console.log
						( 
							Date()
							+ " Error got oversized post, stateId: " 
							+ stateId 
							+ " hostOrGuest: " 
							+ hostOrGuest 
							+ " size: " 
							+ data.length 
						);
						
						errorCode = ERROR_OVERSIZED_REQUEST
					}
					else
						postData = data;
				}
			);
			
			//once you get post data back
			request.on
			( 
				'end',
				function ()
				{			
					//seeing if you can do stuff with parsed data
					if ( errorCode === ERROR_NON )
					{					
						//see if state exists
						let search = savedState.find
						(
							function( searchElement )
							{
									return searchElement.stateId === stateId;
							}
						)
						
						//make a new state if nothing found
						if ( search === undefined )
						{
							let tmpNewState = {};
							let pushNew = true; //if using a old state then dont push a new one
							
							//if your out of memory see if you can reuse and old one
							if ( savedState.length >= MAX_STATES )
							{
								//see if we can reuse exists old state
								tmpNewState = savedState.find 
								(
									function( searchElement )
									{
											return masterClockMs - searchElement.dateLastUpdated > MAX_TIME_MS;
									}
								)
								
								if ( tmpNewState === undefined )
								{
									console.log
									( 
										Date()
										+ " Error out of memery, could not add new item. stateId: " 
										+ stateId
									);
									
									errorCode = ERROR_OUT_OF_MEMERY;
								}
								//log what got replaced
								else
								{
									console.log
									( 
										Date()
										+ " Info: reusing old state, stateId: " 
										+ tmpNewState.stateId
										+ " old dateLastUpdated: "
										+ tmpNewState.dateLastUpdated
									);
									
									pushNew = false;
								}
							}
													
							if ( errorCode === ERROR_NON )
							{
								console.log
								(
									Date()
									+ " Info: making a new state, stateId: "
									+ stateId
									+ " hostOrGuest: "
									+ hostOrGuest
								);
								
								tmpNewState.stateId = stateId;
								tmpNewState.dataHost = "";
								tmpNewState.dataGuest = "";

								if ( hostOrGuest === HOST )
									tmpNewState.dataHost = postData;
								else
									tmpNewState.dataGuest = postData;
								
								tmpNewState.dateLastUpdated = masterClockMs;
								
								if ( pushNew )
									savedState.push( tmpNewState );
								
								console.log( Date() + " Info: savedState length: " + savedState.length + " savedState max: " + MAX_STATES );
							}
						}
						else
						{ 	//working with old states
							if ( postData === undefined || postData.length === 0 || postData === "" )
							{
								if ( hostOrGuest === HOST )
									sendbackContent = search.dataHost;
								else
									sendbackContent = search.dataGuest;
							}
							else //update data
							{
								if ( hostOrGuest === HOST )
									search.dataHost = postData;
								else
									search.dataGuest = postData;

								search.dateLastUpdated = masterClockMs;
							}
						}
					}
					
					//send results back
					if ( errorCode != ERROR_NON ) //dont send any data if not successful
						sendbackContent = NO_CONTENT;
				
					resolution.writeHead( errorCode, { 'Content-Type': 'application/json' } );	
					resolution.end( sendbackContent );
				}
			);
		}
	}
).listen( PORT );