"use strict";
let tmpEnum = 0; //used for setting up emus

//==settings==
const PAGE_TITLE = document.title;
const SCREEN_BACKGROUND_COLOR = 0x000000;

const ONE_SECOND_MS = 1000;

//==screen/map==
const SCREEN_WIDTH_PX = 320;
const SCREEN_WIDTH_HALF_PX = SCREEN_WIDTH_PX / 2;

const SCREEN_HEIGHT_PX = 180;
const SCREEN_HEIGHT_HALF_PX = SCREEN_HEIGHT_PX / 2;

const WATER_BOB_TIME = 500;
const WATER_BOB_OFFSET = 3 / 2;
const WATER_BOB_AMOUNT_PX = 2;


//==urls==
const IMAGE_ROOT = "images/"
const DATA_ROOT = "data/"

//tile sheets files
const MAP_TILESHEET_IMAGE_FILE = IMAGE_ROOT + "MapTiles.png";
const MAP_TILESHEET_DATA_FILE = DATA_ROOT + "MapTileAttributes.json";
const MAP_DATA_FILE = DATA_ROOT + "MapData.json";

//spriteSheet files
const NPC_SPRITESHEET_IMAGE_FILE = IMAGE_ROOT + "NPCSprites.png";

//ui
const UI_FOLDER = IMAGE_ROOT + "/UI/";
const UI_BITMAPFONT_FILE = UI_FOLDER + "Bitmapfont.png";
const UI_TEXTBACKING_FILE = UI_FOLDER + "TextBacking.png"; 
const UI_CONTINUE_ICON_FILE = UI_FOLDER + "ContinueTextIcon.png";

//==keymapping==
const KEY_SCANCODE_UP = 87; //W
const KEY_SCANCODE_UP_ALT = 38; //arrow up
const KEY_SCANCODE_UP_ALT2 = 73; //I

const KEY_SCANCODE_LEFT = 65; //A
const KEY_SCANCODE_LEFT_ALT = 37; //arrow left
const KEY_SCANCODE_LEFT_ALT2 = 74; //J

const KEY_SCANCODE_RIGTH = 68; //D
const KEY_SCANCODE_RIGTH_ALT = 39; //right arrow
const KEY_SCANCODE_RIGHT_ALT2 = 76; //L

const KEY_SCANCODE_DOWN = 83; //S
const KEY_SCANCODE_DOWN_ALT = 40; //down arrow
const KEY_SCANCODE_DOWN_ALT2 = 75; //K

const KEY_SCANCODE_ACTION = 32; //space
const KEY_SCANCODE_ACTION_ALT = 18; //alt
const KEY_SCANCODE_ACTION_ALT2 = 13; //enter

const KEY_SCANCODE_BACK = 8; //Backspace
const KEY_SCANCODE_BACK_ALT = 17; //ctrl
const KEY_SCANCODE_BACK_ALT2 = 46; //delete

const KEY_SCANCODE_MENU = 16; //Shift
const KEY_SCANCODE_MENU_ALT = 77; //M
const KEY_SCANCODE_MENU_ALT2 = 36; //home


//==teleporting tiles==
const NO_TELEPORT = -1;


//==universal directions==
//note the order of these matter for npc sprites
tmpEnum = 0;
const DIREC_DOWN = tmpEnum++;
const DIREC_UP = tmpEnum++;
const DIREC_LEFT = tmpEnum++;
const DIREC_RIGHT = tmpEnum++;
const DIREC_NON = tmpEnum++;
const DIREC_COUNT_MAX = tmpEnum++;
tmpEnum = 0;


//==dynamic world objs==
const NPC_TILES_WIDTH_PX = 16;
const NPC_TILES_HEIGHT_PX = 26;
const NPC_PLAYER_TURN_PAUSE = 140;

//how many sprites per npc
const NPC_SPRITESHEET_WIDTH = 8;
const NPC_SPRITESHEET_HEIGHT = 2; 

//movement speed
const NPC_WALK_ANIMATION_LENGTH = 4;
const NPC_WALK_ANIMATION_DELAY = 180; //also changes walk/run speed
const NPC_WALK_ANIMATION_DELAY_RUN = 100;

//door animation
const NPC_DOOR_ID = 5084; //id from map tile set
const NPC_DOOR_DELAY = 100;
const NPC_DOOR_LENGTH = 4;

//grass animation
const NPC_GRASS_ID = 4977;
const NPC_GRASS_DELAY = 100;
const NPC_GRASS_LENGTH = 3;

//other
const NPC_MAX_DISTANCE_TILES = 150; //telport a npc if it needs to move more than this, also culls their drawing 
const NPC_TELEPORT_PAUSE = 250;

//npc ai
const NPC_WALK_AI_MAX_DISTANCE = 4;
const NPC_WALK_AI_MOVE_FREQUENCY_MIN = 2000;

const NO_BATTLE = -1;
const NO_POKEMON = -1;
const NO_ITEM = -1;


//==ui==
const UI_BITMAPFONT_WIDTH_PX = 6;
const UI_BITMAPFONT_HEIGHT_PX = 13;

const UI_TEXTBOX_TEXT_X = 5;
const UI_TEXTBOX_TEXT_Y = 135;
const UI_TEXTBOX_CHARATER_DELAY = 33;

const UI_TEXTBACKING_WIDTH = 320;
const UI_TEXTBACKING_HEIGHT = 50;
const UI_TEXTBACKING_X = 0;
const UI_TEXTBACKING_Y = SCREEN_HEIGHT_PX - UI_TEXTBACKING_HEIGHT;

const UI_CONTINUE_WIDTH = 12;
const UI_CONTINUE_HEIGHT = 10;
const UI_CONTINUE_X = SCREEN_WIDTH_PX - UI_CONTINUE_WIDTH - 5;
const UI_CONTINUE_Y = SCREEN_HEIGHT_PX - UI_CONTINUE_HEIGHT - 5;
const UI_CONTINUE_LENGTH = 2;
const UI_CONTINUE_DELAY = 500;

const UI_SELECT_MENU_BLINK_RATE = 350;

//==online==
const ONLINE_HOST = 0;
const ONLINE_GUEST = 1;
const ONLINE_NOT_CONNECTED = 2;

const SERVER_PULL_RATE = 200;