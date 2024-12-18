// Include the robotjs package
var robot = require("robotjs");
// Timeout to wait if system is slow
setTimeout(startOpenBoard, 1000);

//Opening the openboard
//Can learn more about these
//properties from the robotjs site

function startOpenBoard(){
 robot.moveMouseSmooth(98,844);
 robot.mouseClick();
 robot.typeString(" openboard ");
 robot.keyTap("enter");
 
 //Minimize openboard
 robot.moveMouseSmooth(1433,28);
 robot.mouseClick();
 
 //Start sublime text after 1s
 setTimeout(startSublimeText, 1000);
}

function startSublimeText(){
 robot.moveMouseSmooth(98,844);
 robot.mouseClick();
 robot.typeString(" sublime text ");
 robot.keyTap("enter");
 
//Minimize sublime
 robot.moveMouseSmooth(1418,8);
 robot.mouseClick();
 
 //Start chrome after 1s
 setTimeout(startChrome, 1000);
}

function startChrome(){
 robot.moveMouseSmooth(98,844);
 robot.mouseClick();
 robot.typeString(" chrome ");
 robot.keyTap("enter");
 
 //Open whatsapp web
 robot.moveMouseSmooth(506,516);
 robot.mouseClick();
 robot.typeString("whatsapp web");
 robot.keyTap("enter");

 robot.moveMouseSmooth(349,389);
 robot.mouseClick();
 
 //Open a new tab
 robot.keyToggle("control","down");
 robot.keyTap("t");
 robot.keyToggle("control","up");
 
 //Open gfg practice
 robot.moveMouseSmooth(506,516);
 robot.mouseClick();
 robot.typeString("gfg practice");
 robot.keyTap("enter");

 robot.moveMouseSmooth(362,788);
 robot.mouseClick();

 //Open a new tab
 robot.keyToggle("control","down");
 robot.keyTap("t");
 robot.keyToggle("control","up");

 //Minimize chrome
 robot.moveMouseSmooth(1398,23);
 robot.mouseClick();
 
 //Start one note after 1s
 setTimeout(startOneNote, 1000);
}

function startOneNote(){
 robot.moveMouseSmooth(98,844);
 robot.mouseClick();
 robot.typeString(" oneNote ");
 robot.keyTap("enter");
 
 //Minimize one note
 robot.moveMouseSmooth(1443,10);
 robot.mouseClick();
 
 //Start notepad after 1s
 setTimeout(startNotePad, 1000);
}

function startNotePad(){
 robot.moveMouseSmooth(98,844);
 robot.mouseClick();
 robot.typeString(" notepad ");
 robot.keyTap("enter");
 robot.moveMouseSmooth(600,500);
 robot.mouseClick();
 //Type a "Set up done" message
 robot.typeString(" Your System is ready to use, Sir.");
}
