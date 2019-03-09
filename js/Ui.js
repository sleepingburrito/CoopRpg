"use strict";

let uiBitmapFont = undefined;
let charSprite = SpriteObj();

let uiTextBacking = undefined;
let textBackingSprite = SpriteObj();

let uiContinueIcon = undefined;
let uiContinueIconSprite = SpriteObj();

let uiOpen = false;

//display statues
tmpEnum = 0;
const UI_TEXTBOX_NOT_DISPLAYED = tmpEnum++;
const UI_TEXTBOX_DISPLAYED = tmpEnum++;
const UI_TEXTBOX_WAITING = tmpEnum++;

//textbox themes
tmpEnum = 0;
const UI_THEME_NON = tmpEnum++;
const UI_THEME_1 = tmpEnum++;

//select menu
tmpEnum = 0;
const UI_MENU_NOT_DISPLAYED = tmpEnum++;
const UI_MENU_OPEN = tmpEnum++;


let loadUiStarted = false;
function LoadUi()
{
    //only allow to run once
    if ( loadUiStarted )
        return;
    else
        loadUiStarted = true;

    console.log( "loading ui" );


    //loading tile map
    uiBitmapFont = LoadTileSheet
    (
        UI_BITMAPFONT_FILE,
        UI_BITMAPFONT_WIDTH_PX,
        UI_BITMAPFONT_HEIGHT_PX,
        function()
        {
            charSprite.tileSheet = uiBitmapFont;
        }
    );

    //set font settings
    charSprite.screenSpace = true;
    charSprite.depth = SPRITE_DEPTH_UI_TOP;


    //text backing
    uiTextBacking = LoadTileSheet
    (
        UI_TEXTBACKING_FILE,
        UI_TEXTBACKING_WIDTH,
        UI_TEXTBACKING_HEIGHT,
        function()
        {
            textBackingSprite.tileSheet = uiTextBacking;
        }
    );

    textBackingSprite.screenSpace = true;
    textBackingSprite.depth = SPRITE_DEPTH_UI;
    textBackingSprite.x = UI_TEXTBACKING_X;
    textBackingSprite.y = UI_TEXTBACKING_Y;


    //continue icon
    uiContinueIcon = LoadTileSheet
    (
        UI_CONTINUE_ICON_FILE,
        UI_CONTINUE_WIDTH,
        UI_CONTINUE_HEIGHT,
        function()
        {
            uiContinueIconSprite.tileSheet = uiContinueIcon;
        }
    );

    uiContinueIconSprite.screenSpace = true;
    uiContinueIconSprite.depth = SPRITE_DEPTH_UI_TOP;
    uiContinueIconSprite.x = UI_CONTINUE_X;
    uiContinueIconSprite.y = UI_CONTINUE_Y;
    uiContinueIconSprite.animation = true;
    uiContinueIconSprite.tileLength = UI_CONTINUE_LENGTH;
    uiContinueIconSprite.delay = UI_CONTINUE_DELAY;
}

function LoadUiDone()
{
    return ( loadUiStarted && uiBitmapFont != undefined && uiBitmapFont.loaded && uiTextBacking != undefined && uiTextBacking.loaded && uiContinueIcon != undefined && uiContinueIcon.loaded );
}


function DrawText( str, xPx, yPx )
{
    let offsetX = 0;
    let offsetY = 0;

    for( let i = 0; i < str.length; i++ )
    {
        //new line
        if ( str[i] === "\n" )
        {
            offsetX = 0;
            offsetY += UI_BITMAPFONT_HEIGHT_PX;
            continue;
        }
   
        //bitmap fount lookup
        charSprite.startingTile = Math.min( str.charCodeAt( i ), uiBitmapFont.sheetWidthTiles - 1 );
        charSprite.x = xPx + offsetX;
        charSprite.y = yPx + offsetY;
        AddDrawQueue( charSprite );

        offsetX += UI_BITMAPFONT_WIDTH_PX;
    }
}


//===simple text box===
let textBoxState = UI_TEXTBOX_NOT_DISPLAYED; //read only to know if done
let textBoxString = "";
let textBoxProgressAllText = 0; //where you are in the total text
let textBoxProgress = 0; //where you are in the text box to make one letter at a time
function DrawTextBoxStart( str )
{
    if ( str === undefined )
        return;

    textBoxString = str;
    textBoxState = UI_TEXTBOX_DISPLAYED;
    textBoxProgressAllText = 0;
    textBoxProgress = 0;
    uiOpen = true;
}

function IsTextBoxOpen()
{
    return textBoxState != UI_TEXTBOX_NOT_DISPLAYED;
}

//todo: clean this up
function UpdateTextBox()
{
    if ( textBoxState === UI_TEXTBOX_DISPLAYED )
    {
        let skipText = false;
        if ( keyStateFrame[KEY_ACTION] === KEY_STATE_TAP && textBoxProgress != 0 )
            skipText = true;

        (function()
        {
            do{ //progress the text box one character at a time relative to time
                textBoxProgress += clamp( TruncateDecimal( 60 / displayFps ), 1, 1000 ); //make it somewhat framerate independent

                //cut text out that you will be displaying
                const displayText = textBoxString.slice( textBoxProgressAllText, textBoxProgressAllText + textBoxProgress );

                //stop the text box after seeing two new lines
                let twoLineCount = 0;
                for( let i = 0; i < displayText.length; i++ )
                    if ( displayText[i] === "\n" )
                        if ( ++twoLineCount >= 2 )
                        {
                            textBoxProgress = i + 1;
                            textBoxState = UI_TEXTBOX_WAITING;
                            return;
                        }

                //detech if you run out of text
                if ( textBoxProgressAllText + textBoxProgress > textBoxString.length )
                {
                    textBoxState = UI_TEXTBOX_WAITING;
                    return;
                }
                
            }while( skipText ) //skip text if key press
        })();
    }
    else if ( textBoxState === UI_TEXTBOX_WAITING )
    {
        const textBoxDone = textBoxProgressAllText + textBoxProgress > textBoxString.length;

        if ( !textBoxDone )
            AddDrawQueue( uiContinueIconSprite );

        if ( keyStateFrame[KEY_ACTION] === KEY_STATE_TAP ) //waiting on the user to press next
        {
            if ( textBoxDone ) //end textbox when out of text
            {
                textBoxState = UI_TEXTBOX_NOT_DISPLAYED;
                uiOpen = false;
            }
            else //move onto the next section on text
            {
                textBoxProgressAllText += textBoxProgress;
                textBoxProgress = 0;
                textBoxState = UI_TEXTBOX_DISPLAYED;
            }
        }
    }

     //display text
    if ( textBoxState != UI_TEXTBOX_NOT_DISPLAYED )
    {
        DrawText( textBoxString.slice( textBoxProgressAllText, textBoxProgressAllText + textBoxProgress ), UI_TEXTBOX_TEXT_X, UI_TEXTBOX_TEXT_Y );
        AddDrawQueue( textBackingSprite );
    }

}


//==multi select==
//all internal state for select
let selectUiItems = [];
let selectUiState = UI_MENU_NOT_DISPLAYED;
let selectReturnItem = undefined;
let selectUiLocation = 0;

function AddSelectItem( displayName, returnItem, order = 0 )
{
    selectUiItems.push( { display: displayName, item: returnItem, sort: order } );
}

function ShowSelectMenu()
{
    if ( selectUiItems.length < 1 )
        return;

    selectUiItems.sort( function( a, b ) { return a.sort - b.sort; } );
    selectReturnItem = undefined;
}

function IsSelectOpen()
{
    return selectUiState != UI_MENU_NOT_DISPLAYED;
    selectUiState = UI_MENU_OPEN;
    selectUiLocation = 0;
}

function LastItemSelected()
{
    return selectReturnItem;
}

function UpdateSelectMenu()
{
    if ( selectUiState === UI_MENU_NOT_DISPLAYED )
        return;

    if ( keyStateFrame[KEY_DOWN] === KEY_STATE_TAP )
        selectUiLocation--;

    if ( keyStateFrame[KEY_UP] === KEY_STATE_TAP )
        selectUiLocation++;

    if ( selectUiLocation < 0 )
        selectUiLocation += selectUiItems.length;
    else if ( selectUiLocation >= selectUiItems.length )
        selectUiLocation -= selectUiItems.length;

    let displayStr = TruncateDecimal( masterClockMs / UI_SELECT_MENU_BLINK_RATE ) % 2 === 0 ? ">" : " ";

    //add menu items
    displayStr += selectReturnValue === selectUiItems[ selectUiLocation ].selectReturnItem ? "*" : " ";
    displayStr += selectUiItems[ selectUiLocation ].display;

    if ( selectUiLocation + 1 < selectUiItems.length  )
    {
        displayStr += "\n";
        displayStr += selectReturnValue === selectUiItems[ selectUiLocation + 1 ].selectReturnItem ? "*" : " ";
        displayStr += selectUiItems[ selectUiLocation + 1 ].display;
    }

    DrawText( displayStr, UI_TEXTBOX_TEXT_X, UI_TEXTBOX_TEXT_Y );
    AddDrawQueue( textBackingSprite );
}