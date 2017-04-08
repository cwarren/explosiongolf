include('Point2D.js');
include('IntersectionLtd.js');

include('shapes_and_colors.js');
include('game_objects.js');
include('screen_objects.js');

defineGame("EXPLOSION GOLF", "Chris Warren");

///////////////////////////////////////////////////////////////
//                                                           //
//                    CONSTANT STATE                         //

var START_TIME = currentTime();

var region = {};
var holeTitleLoc;

var timerUi;

var explosionSprite;
var ballImage;
var putterImage;
var wedgeImage;
var ironImage;
var driverImage;
var flagImage;
var fuseImage;
var fuseBurnSprite;

var treeCrownImg1;
var treeCrownImg2;
var treeCrownImg3;
var treeTrunkImg;

var bushImg1;
var bushImg2;
var bushImg3;

///////////////////////////////////////////////////////////////
//                                                           //
//                     MUTABLE STATE                         //

var lastKeyCode;

var uiMode; // play, pause, setChargeTimer, playerAlert

var isSliding;

var gameState;
var detonator;
var ballControl;

var avatarIsDirected = false;
var chargePickedUp = false;
var carriedCharge;

var metagameControls;
var pauseButton;
var helpButton;

var playerAlert;

var ballControls;

var instructionTexts;
var instructionsCounter;

var roundButtonImage;

var bounceAnimations;

//var TEST;

///////////////////////////////////////////////////////////////
//                                                           //
//                      EVENT RULES                          //

// When setup happens...
function onSetup() {

    lastKeyCode = 0;

    region['course'] = new Rect(new Point2D(0,0),screenWidth*.8,screenHeight*.8,makeColor(.4,.5,.1));
    region['caddy'] = new Rect(new Point2D(screenWidth*.8,0),screenWidth*.2,screenHeight*.8,makeColor(.1,.4,.5));
    region['detonator'] = new Rect(new Point2D(0,screenHeight*.8),screenWidth*.2,screenHeight*.2,makeColor(.8,.5,.4));
    region['ball_control'] = new Rect(new Point2D(screenWidth*.2,screenHeight*.8),screenWidth*.6,screenHeight*.2,makeColor(.5,.4,.1));
    region['game_control'] = new Rect(new Point2D(screenWidth*.8,screenHeight*.8),screenWidth*.2,screenHeight*.2,makeColor(.2,.2,.2));
    
    holeTitleLoc = new Point2D(region['course'].getCenter().x,region['course'].ul.y+38);

    ballImage = loadImage('img/golf_ball.png'); // from http://www.flickr.com/photos/mattbuck007/2657474716/ - CC from flickr user mattbuck4950 - 'Matt Buck'
    putterImage = loadImage('img/firecracker.png'); // from http://www.flickr.com/photos/wiredwitch/2647165962/ - CC from flickr user Carly & Art
    wedgeImage = loadImage('img/grenade.png'); // from http://www.flickr.com/photos/arcticwarrior/8021584206/ - CC from flickr user Joint Base Elmendorf-Richardson
    ironImage = loadImage('img/dynamite.png'); // from http://www.flickr.com/photos/dogsbodyorg/4429344217/ - CC from flickr user dogsbodyorg - 'Dan Benton'
    driverImage = loadImage('img/big_bomb.png'); // from http://www.flickr.com/photos/usnavy/6628022961/ - CC from flickr user Official U.S. Navy Imagery
    
    flagImage = loadImage('img/flag.png');
    
    //fuseImage = loadImage('img/fuse.png'); // from http://www.flickr.com/photos/pgordon/5944446567/ -- CC from flickr user p.Gordon
    
    roundButtonImage = loadImage('img/round_button.png'); // from http://www.flickr.com/photos/usnavy/6628022961/ - CC from flickr user Official U.S. Navy Imagery

    treeCrownImg1 = loadImage('img/tree_crown_1.png');
    treeCrownImg2 = loadImage('img/tree_crown_2.png');
    treeCrownImg3 = loadImage('img/tree_crown_3.png');
    treeTrunkImg = loadImage('img/tree_trunk_2.png');

    bushImg1 = loadImage('img/bush_1.png');
    bushImg2 = loadImage('img/bush_2.png');
    bushImg3 = loadImage('img/bush_3.png');

    gameState = new GameState();

    var w = region['game_control'].width;
    var h = region['game_control'].height;
    pauseButton = new Button({'text':'PAUSE',
                                  'shape':new Rect(new Point2D(w*.15,h*.1),w*.7,h*.15,makeColor(.8,.8,.8)),
                                  'activationCallback': function() { uiMode = 'pause'; },
                                  'deactivationCallback': function() { uiMode = 'play'; }
                                  });
    pauseButton.shape.thickness = 6;
    helpButton = new Button({'text':'HELP',
                              'shape':new Rect(new Point2D(w*.15,h*.75),w*.7,h*.15,makeColor(.8,.8,.8)),
                              'activationCallback': function() { uiMode = 'playerAlert'; instructionsCounter = 0; doInstructions(); this.deactivate(); },
                              'deactivationCallback': function() { }
                              });
    helpButton.shape.thickness = 6;

    metagameControls = [
        pauseButton,
        helpButton
    ];
        
    timerUi = new TimerUi();
    
    explosionSprite = new Sprite({
        'sheetImage':'img/explosion_fade.png',
        'frameCount':16,
        'stoppedFrameIdx':0,
        'frameWidth':64,
        'frameHeight':64,
        'scaling':1
    });
    explosionFade = new Sprite({
        'sheetImage':'img/explosion_fade.png',
        'frameCount':12,
        'stoppedFrameIdx':0,
        'frameWidth':64,
        'frameHeight':64,
        'scaling':1
    });

    fuseBurnSprite = new Sprite({
        'sheetImage':'img/burn_fuse.png', 
        'frameCount':6,
        'stoppedFrameIdx':0,
        'frameWidth':64,
        'frameHeight':64,
        'scaling':.5
    });
    
    instructionTexts = [
        "Instructions follow - press ESC to skip or quit\nthe instructions and go directly to the game",
        "The object of the game is to get the ball into the hole.\nThe ball is moved around the course by placing and then\ndetonating charges. Each press of the BOOM! button\ncounts as 1 stroke, no matter how many charges explode.",
        "The ball is also a bomb, and the time starts ticking on it as\nsoon as you place it. When the ball timer gets to 0 the hole\nends whether you've made it to the flag or not.",
        "The ball and all available charges are carried by the caddy -\nthe section to the upper right. To place the ball or a charge\ndrag it from the caddy and drop it on the course, but\nyou have to drop it somewhere within your reach\n(which is indicated by the circle around your avatar).\nYou can also pick up and move or return to the caddy\ncharges that are within reach.",
        "You start out in the center of the tee area, and cannot move\nout of it until the ball has been placed, and the ball must be\nplaced somewhere in the tee area. Once the ball has\nbeen placed you can move anywhere on the course and\nyou can place charges (again, within your reach).",
        "When you place a charge you can set a delay on it, which is\nhow much time passes from when you press the BOOM! button\nuntil that charge explodes. When you press the BOOM! button\nall the charges that you have placed explode, and you\ncan't place any more until those explosions are finished.",
        "The score for a hole is a combination of the number of strokes\ntaken (the fewer the better), the time remaining on the ball\n(the more the better), the distance from the ball to\nthe flag (the closer the better), the number of\ncharges left with the caddy (the more and bigger the better),\nand bonuses for hitting the flag and making par.",
//        "The score for a hole is a combination of the number of strokes\ntaken (the fewer the better), the time remaining on the ball\n(the more the better), the distance from the ball to\nthe flag (the closer the better), a bonus for hitting the flag,\nand a bonus for making par (the more under the better).",
        "Good luck!"
    ];
    instructionsCounter = 0;

    playerAlert = new PlayerAlert();
    playerAlert.setMessage(
"Welcome to Explosion Golf!\n\nMove the ball to the tee area, then place one or more\ncharges - they must be placed in your reach. When you\npress the detonator all the charges go off, moving\nthe ball if the explosions hit it. Oh yeah, your ball\nis also a bomb with a fuse that starts burning as soon\nthe ball is placed. Good luck!"
,"56px Arial"
    );

    uiMode = 'playerAlert';
    
    isSliding = false;
    
    bounceAnimations = [];
    
//    TEST = new Polygon([new Point2D(100,100),new Point2D(200,150),new Point2D(300,300),new Point2D(200,400),new Point2D(50,250)]);
}


// When a key is pushed
function onKeyStart(key) {
    lastKeyCode = key;
    
    if (uiMode == 'pause') {
        pauseButton.activate();
    } else
    if (uiMode == 'playerAlert') {
        if ((instructionsCounter >= instructionTexts.length) || (lastKeyCode == 27)) { // enter or space
            uiMode = 'play';
            instructionsCounter = instructionTexts.length+1;
            lastKeyCode = -1;
        } else {
            doInstructions();
        }
    } else
    if (uiMode == 'setChargeTimer') {
        if ((lastKeyCode == 13) || (lastKeyCode == 32)) {
            timerUi.ctrls['set'].activate(timerUi.ctrls['set'].shape.getCenter(),timerUi);
        }
    } else
    if (uiMode == 'play') {
        if ((lastKeyCode == 80) || (lastKeyCode == 19)) { // p or pause
            pauseButton.activate();
        } else
        if (lastKeyCode == 66) { // b
            if ((! gameState.detonator.isPressed) && (gameState.charges.length > 0)) {
                gameState.detonator.ctrls['boom'].activate(gameState.detonator);
            }
        }
    }
    
}

function doInstructions() {
        if (instructionsCounter < instructionTexts.length) {
            playerAlert.setMessage(instructionTexts[instructionsCounter],"48px Arial");
        }
        instructionsCounter++;
}

function onTouchStart(x,y,id) {
    var touchPt = new Point2D(x,y);

    //console.log('touch at '+touchPt.toString());
    
//    if (TEST.containsPt(touchPt)) {
//        alert('in TEST');
//    }
    
    if (uiMode == 'pause') {
        pauseButton.activate(x,y,id);
    } else 
    if (uiMode == 'playerAlert') {
        if ((instructionsCounter >= instructionTexts.length) || (lastKeyCode == 27)) {
            uiMode = 'play';
        } else {
            doInstructions();
        }
    } else 
    if (uiMode == 'setChargeTimer') {
        var whichControl = getEltNameThatContainsPt(timerUi.ctrls,touchPt,timerUi.shape.ul);
        if (whichControl != 'none') {
            timerUi.ctrls[whichControl].activate(touchPt,timerUi);
        }
        isSliding = (whichControl == 'slider');
    } else {
        var whichRegion = getEltNameThatContainsPt(region,touchPt);
        //console.log('touch start in region '+whichRegion);
        if (whichRegion == 'course') {
            if (uiMode == 'play') {
                // check if touching an existing charge that's within reach
                var whichObj = getEltNameThatContainsPt(gameState.charges,touchPt,region['course'].ul);
                if ((whichObj == 'none') || (gameState.detonator.isPressed)) {
                    //console.log('sending avatar to '+touchPt.toString());
                    gameState.avatar.headTo(touchPt);
                    avatarIsDirected = true;
                } else {
                    //console.log('handing touch on '+whichObj);
                    if (gameState.avatar.shapeReach.containsPt(touchPt)) {
                        chargePickedUp = true;
                        carriedCharge = gameState.charges[whichObj];
                        removeAt(gameState.charges,whichObj*1);
                    } else {
                        console.log('TODO: show info about touched object, or perhaps travel to it (but not over it)');
                    }
                }
            }
        }
        else if (whichRegion == 'caddy') {
            if ((uiMode == 'play') && (! gameState.detonator.isPressed)) {
                var whichControl = getEltNameThatContainsPt(gameState.caddy.ctrls,touchPt,region['caddy'].ul);
                // console.log('touched control is '+whichControl);
                if (whichControl != 'none') {
                    if (gameState.ball.isPlaced || (whichControl == 'ball')) {
                        carriedCharge = gameState.caddy.provideCharge(whichControl);
                        if (carriedCharge !== undefined) {
                            chargePickedUp = true;
                            carriedCharge.setLoc(x,y);
                        }
                    }
                }
            }
        }
        else if (whichRegion == 'game_control') {
            var whichControl = getEltNameThatContainsPt(metagameControls,touchPt,region['game_control'].ul);
            // console.log('touched control is '+whichControl);
            if (whichControl != 'none') {
                metagameControls[whichControl].activate(x,y,id);
            }
        }
        else if (whichRegion == 'detonator') {
            if (uiMode == 'play') {
                if ((! gameState.detonator.isPressed) && (gameState.charges.length > 0)) {
                    var whichControl = getEltNameThatContainsPt(gameState.detonator.ctrls,touchPt,region['detonator'].ul);
                    // console.log('touched control is '+whichControl);
                    if (whichControl != 'none') {
                        gameState.detonator.ctrls[whichControl].activate(gameState.detonator);
                    }
                }
            }
        }
    }
}

function onTouchMove(x,y,id) {
    if ((uiMode == 'setChargeTimer') && isSliding) {
        timerUi.ctrls['slider'].activate(new Point2D(x,y),timerUi);
    }
    else if (uiMode == 'play') {
        if (avatarIsDirected) {
            var movePt = new Point2D(x*1,y*1);
            movePt.limitToRect(region['course']);
            //if (! gameState.ball.isPlaced) {
            //    movePt.limitToRect(gameState.holes[gameState.currentHole].tee);
            //}
            gameState.avatar.headTo(movePt);
        }
        else if (chargePickedUp) {
            //var movePt = new Point2D(x,y);
            carriedCharge.setLoc(x,y);
        }
    }
}

function onTouchEnd(x,y,id) {
    if (avatarIsDirected) {
        avatarIsDirected = false;
    }
    else if (chargePickedUp) {
        chargePickedUp = false;
        var endPt = new Point2D(x,y);
        if (gameState.avatar.shapeReach.containsPt(endPt) && ((carriedCharge.type != 'ball') || (gameState.holes[gameState.currentHole].tee.containsPt(endPt))) ) {
            gameState.emplaceCharge(carriedCharge);
            if (carriedCharge.type != 'ball') {
                uiMode = 'setChargeTimer';
                timerUi.targetCharge = carriedCharge;
            }
        } else {
            gameState.caddy.receiveCharge(carriedCharge);
        }
        carriedCharge = undefined;
    }
    isSliding = false;
}

// Called 30 times or more per second
function onTick() {

    if (uiMode == 'play') {
        advanceGameState();
    }
    
    drawCourseRegion();
    drawCaddyRegion();
    drawDetonatorRegion();
    drawBallRegion();
    drawControlsRegion();
    if (chargePickedUp && (carriedCharge !== undefined)) {
        carriedCharge.draw();
    }
    
    if (uiMode == 'setChargeTimer') {
        drawTimerUi();
    }
    
    if (uiMode == 'pause') {
        drawPauseState();
    }
    
    if (uiMode == 'playerAlert') {
        drawPlayerAlertState();
    }

//    TEST.drawStroke();
}


///////////////////////////////////////////////////////////////
//                                                           //
//                      HELPER RULES                         //

function advanceGameState() {
    if (gameState.ball.isSunk || ((gameState.ball.countdownTimer <= 0) && (gameState.explosions.length < 1)) ) {
        gameState.goToNextHole();
    } else {
        if (gameState.detonator.isPressed) {
            // handle detontations
            for (var i=0;i<gameState.charges.length;++i) {
                gameState.charges[i].timer--;
                if (gameState.charges[i].timer < 0) {
                    gameState.explosions.push(new Explosion(gameState.charges[i]));
                    removeAt(gameState.charges,i);
                    i--;
                }
            }
            if (gameState.charges.length <= 0) {
                gameState.detonator.ctrls['boom'].deactivate(gameState.detonator);
            }
        }

        // handle explosions
        for (var i=0;i<gameState.explosions.length;++i) {
            if (gameState.explosions[i].isDone) {
                removeAt(gameState.explosions,i);
                i--;
            } else {
                gameState.explosions[i].step();
                //console.log('TODO: check here for applying push to ball');
                if (gameState.explosions[i].shape.containsPt(gameState.ball.loc)) {
                    gameState.ball.pushedBy(gameState.explosions[i].loc,gameState.explosions[i].getCurrentForce(),gameState.explosions[i].sourceType);
                }
            }
        }

        // handle bounce animations
        for (var i=0;i<bounceAnimations.length;++i) {
            if (bounceAnimations[i].stepAndCheckDone()) {
                removeAt(bounceAnimations,i);
                i--;
            }
        }

        gameState.avatar.doMove();

        if (gameState.ball.countdownTimer > 0) {
            gameState.ball.doMove();
            if (! region['course'].containsPt(gameState.ball.loc)) {
                if (gameState.explosions.length <= 0) {
                    var recoverLoc = gameState.ball.loc.clone();
                    recoverLoc.limitToRect(region['course'],30);
                    gameState.ball.recoverToLoc(recoverLoc);

                    gameState.score.hole[gameState.currentHole].strokes += 3;
                    playerAlert.setMessage("Ball out of bounds\n3 strokes");
                    uiMode = 'playerAlert';
                }
            }
        } else {
            if (gameState.explosions.length < 1) {
                    gameState.score.recordCurrentScore(gameState);
                    var strokesLabel = '  strokes';
                    
                    playerAlert.setMessage("BOOM!\nYour ball blew up!\nYour score for this hole is:\n"+
                        '                           '+strokesLabel+': '+gameState.score.hole[gameState.currentHole].strokes+' ('+gameState.score.hole[gameState.currentHole].strokeBonus+" pts)\n"+
                        '                          distance to flag: '+gameState.score.hole[gameState.currentHole].distToFlag+' ('+gameState.score.hole[gameState.currentHole].distBonus+" pts)\n"+
                        '                    time bonus: '+gameState.score.hole[gameState.currentHole].ballTimeBonus+"\n"+
                        '                    caddy bonus: '+gameState.score.hole[gameState.currentHole].caddyBonus+"\n"+
                        '                   flag bonus: '+gameState.score.hole[gameState.currentHole].flagBonus+"\n"+
                        'TOTAL: '+gameState.score.hole[gameState.currentHole].SCORE,
                        "40px Arial"
                        );
                    uiMode = 'playerAlert';
//                playerAlert.setMessage("BOOM!\nYour ball blew up!\nYour score for this hole is:\n"+gameState.score.hole[gameState.currentHole].SCORE);
//                uiMode = 'playerAlert'
            }
        }        
        
        gameState.score.recordCurrentScore(gameState);

        gameState.ball.tick();
        fuseBurnSprite.randomStep();
        gameState.ballControl.burnFuse();
    }
}

function drawCourseRegion() {
    region['course'].drawFill();  
    gameState.holes[gameState.currentHole].drawTerrain();
    for (var i=0;i<gameState.charges.length;++i) {
        gameState.charges[i].drawHighlightIfIn(gameState.avatar.shapeReach);
        gameState.charges[i].draw();
    }
    
    for (var i=0;i<bounceAnimations.length;++i) {
        bounceAnimations[i].draw();
    }

    gameState.ball.draw();
    
    gameState.holes[gameState.currentHole].drawLowObjects();
    gameState.avatar.draw();
    gameState.holes[gameState.currentHole].drawHighObjects();

    if (uiMode == 'play') {
        for (var i=0;i<gameState.explosions.length;++i) {
            gameState.explosions[i].draw();
        }
    }
    
    fillText('"'+gameState.holes[gameState.currentHole].title+'" (par '+gameState.holes[gameState.currentHole].par+')',holeTitleLoc.x,holeTitleLoc.y,COLOR_BLACK,'bold 48px Arial','center','middle');
    
    region['course'].drawOutline();
}
function drawDetonatorRegion() {
    region['detonator'].drawFill();
    gameState.detonator.draw();
    region['detonator'].drawOutline();
}
function drawCaddyRegion() {
    region['caddy'].drawFill();
    gameState.caddy.draw();
    region['caddy'].drawOutline();
}
function drawBallRegion() {
    region['ball_control'].drawFill();
    gameState.ballControl.draw();
    region['ball_control'].drawOutline();
}
function drawControlsRegion() {
    region['game_control'].drawFill();
    
    for (var i=0;i<metagameControls.length;++i) {
        metagameControls[i].draw();
    }
    
    gameState.score.drawForHole(gameState.currentHole,region['game_control'].getCenter().shiftedBy(0,-20),'28px Arial',COLOR_SCORE);
    
    region['game_control'].drawOutline();
}


function drawTimerUi() {
    timerUi.draw();
}

function drawPauseState() {
    fillRectangle(100,100,screenWidth-200,screenHeight-200,COLOR_PAUSE);
    fillText('PAUSED',screenWidth/2,screenHeight/2,COLOR_BLACK,'144px Arial','center','middle');
}

function drawPlayerAlertState() {
    playerAlert.draw();
}

function getEltNameThatContainsPt(eltHash,p,refPt) {
    if (refPt === undefined) {
        refPt = PT_ORIGIN;
    }
    var refP = new Point2D(p.x-refPt.x,p.y-refPt.y);
    var hashKeys = Object.keys(eltHash);
    for (var i=0;i<hashKeys.length;++i) {
        if (eltHash[hashKeys[i]].containsPt(refP)) {
            return hashKeys[i];
        }
    }
    return 'none';
}