include('Point2D.js');
include('IntersectionLtd.js');

include('shapes_and_colors.js');
include('screen_objects.js');

defineGame("XG - Level Builder", "Chris Warren");

///////////////////////////////////////////////////////////////
//                                                           //
//                    CONSTANT STATE                         //

var START_TIME = currentTime();

var region = {};

var flagImage;

///////////////////////////////////////////////////////////////
//                                                           //
//                     MUTABLE STATE                         //

var lastKeyCode;

var terrainControls;
var btnFairway;
var btnTee;
var btnGreen;
var btnTrap;
var btnPath;
var btnWater;

var closerControls;
var btnClose;
var lastButton;

var obstacleControls;
var btnBush;

var metagameControls;
var dumpButton;

var isDrawing;
var drawingType;
var drawnShape;

var fairwayShapes;
var teeShape;
var greenShape;
var trapShapes;
var pathShapes;
var waterShapes;

var bushShapes;
var treeShapes;
var structureShapes;

///////////////////////////////////////////////////////////////
//                                                           //
//                      EVENT RULES                          //

// When setup happens...
function onSetup() {

    lastKeyCode = 0;

    region['course'] = new Rect(new Point2D(0,0),screenWidth*.8,screenHeight*.8,makeColor(.4,.5,.1));
    region['terrain_control'] = new Rect(new Point2D(screenWidth*.8,0),screenWidth*.2,screenHeight*.8,makeColor(.1,.4,.5));
    region['closer'] = new Rect(new Point2D(0,screenHeight*.8),screenWidth*.2,screenHeight*.2,makeColor(.8,.5,.4));
    region['obstacle_control'] = new Rect(new Point2D(screenWidth*.2,screenHeight*.8),screenWidth*.6,screenHeight*.2,makeColor(.5,.4,.1));
    region['game_control'] = new Rect(new Point2D(screenWidth*.8,screenHeight*.8),screenWidth*.2,screenHeight*.2,makeColor(.2,.2,.2));
    
    
    flagImage = loadImage('img/flag.png');

    //--------

    var w = region['terrain_control'].width;
    var h = region['terrain_control'].height;
    var btop = 64;
    btnFairway = new Button({'text':'fairway',
                                  'shape':new Rect(new Point2D(w*.15,btop),w*.7,48,makeColor(.8,.8,.8)),
                                  'activationCallback': function() {
                                        if (isDrawing) {
                                           btnClose.activate(); 
                                        }
                                        isDrawing = true;
                                        drawingType='fairway';
                                        lastButton = btnFairway;
                                   },
                                  'deactivationCallback': function() { btnClose.activate(); },
                                  'inRegion':region['terrain_control']
                                  });

    btop += 48 + 48;
    btnTee = new Button({'text':'tee',
                                  'shape':new Rect(new Point2D(w*.15,btop),w*.7,48,makeColor(.8,.8,.8)),
                                  'activationCallback': function() {
                                        if (isDrawing) {
                                           btnClose.activate(); 
                                        }
                                        isDrawing = true;
                                        drawingType='tee';
                                        if (teeShape != '') {
                                            teeShape = '';
                                        }
                                        lastButton = btnTee;
                                   },
                                  'deactivationCallback': function() { btnClose.activate(); },
                                  'inRegion':region['terrain_control']
                                  });

    btop += 48 + 48;
    btnGreen = new Button({'text':'green',
                                  'shape':new Rect(new Point2D(w*.15,btop),w*.7,48,makeColor(.8,.8,.8)),
                                  'activationCallback': function() {
                                        if (isDrawing) {
                                           btnClose.activate(); 
                                        }
                                        isDrawing = true;
                                        drawingType='green';
                                        if (greenShape != '') {
                                            greenShape = '';
                                        }
                                        lastButton = btnGreen;
                                   },
                                  'deactivationCallback': function() { btnClose.activate(); },
                                  'inRegion':region['terrain_control']
                                  });

    btop += 48 + 48;
    btnTrap = new Button({'text':'trap',
                                  'shape':new Rect(new Point2D(w*.15,btop),w*.7,48,makeColor(.8,.8,.8)),
                                  'activationCallback': function() {
                                        if (isDrawing) {
                                           btnClose.activate(); 
                                        }
                                        isDrawing = true;
                                        drawingType='trap';
                                        lastButton = btnTrap;
                                   },
                                  'deactivationCallback': function() { btnClose.activate();  },
                                  'inRegion':region['terrain_control']
                                  });

    btop += 48 + 48;
    btnPath = new Button({'text':'path',
                                  'shape':new Rect(new Point2D(w*.15,btop),w*.7,48,makeColor(.8,.8,.8)),
                                  'activationCallback': function() {
                                        if (isDrawing) {
                                           btnClose.activate(); 
                                        }
                                        isDrawing = true;
                                        drawingType='path';
                                        lastButton = btnPath;
                                   },
                                  'deactivationCallback': function() { btnClose.activate();},
                                  'inRegion':region['terrain_control']
                                  });

    btop += 48 + 48;
    btnWater = new Button({'text':'water',
                                  'shape':new Rect(new Point2D(w*.15,btop),w*.7,48,makeColor(.8,.8,.8)),
                                  'activationCallback': function() {
                                        if (isDrawing) {
                                           btnClose.activate(); 
                                        }
                                        isDrawing = true;
                                        drawingType='water';
                                        lastButton = btnWater;
                                   },
                                  'deactivationCallback': function() { btnClose.activate(); },
                                  'inRegion':region['terrain_control']
                                  });


    terrainControls = [
        btnFairway,
        btnTee,
        btnGreen,
        btnTrap,
        btnPath,
        btnWater
    ];

    //--------

    w = region['closer'].width;
    h = region['closer'].height;

    btnClose = new Button({'text':'close',
                                  'shape':new Rect(new Point2D(w*.15,h*.1),w*.7,48,makeColor(.8,.8,.8)),
                                  'activationCallback': function() { 
                                        console.log('implement close');
                                        if (lastButton != '') {
                                            lastButton.state = 'up';
                                            lastButton = '';
                                        }
                                        if (isDrawing && (drawnShape != '')) {
                                            if (drawingType == 'fairway') {
//                                                btnFairway.state = 'up';
                                                if (drawnShape.vertices.length > 2) {
                                                    fairwayShapes.push(drawnShape);
                                                }
                                            }
                                            else if (drawingType == 'tee') {
//                                                btnTee.state = 'up';
                                                if (drawnShape.vertices.length == 4) {
                                                    teeShape = drawnShape;
                                                }
                                            }
                                            else if (drawingType == 'green') {
//                                                btnGreen.state = 'up';
                                                greenShape = drawnShape;
                                            }
                                            else if (drawingType == 'trap') {
//                                                btnTrap.state = 'up';
                                                if (drawnShape.vertices.length > 2) {
                                                    trapShapes.push(drawnShape);
                                                }
                                            }
                                            else if (drawingType == 'path') {
//                                                btnPath.state = 'up';
                                                if (drawnShape.vertices.length > 2) {
                                                    pathShapes.push(drawnShape);
                                                }
                                            }
                                            else if (drawingType == 'water') {
//                                                btnWater.state = 'up';
                                                if (drawnShape.vertices.length > 2) {
                                                    waterShapes.push(drawnShape);
                                                }
                                            }
                                            else if (drawingType == 'bush') {
//                                                btnBush.state = 'up';
                                                if (drawnShape != '') {
                                                    bushShapes.push(drawnShape);
                                                }
                                            }
                                            else if (drawingType == 'tree') {
//                                                btnTree.state = 'up';
                                                if (drawnShape != '') {
                                                    treeShapes.push(drawnShape);
                                                }
                                            }
                                        }
                                        isDrawing = false;
                                        drawingType = '';
                                        drawnShape = '';
                                        this.deactivate();
                                   },
                                  'deactivationCallback': function() { },
                                  'inRegion':region['closer']
                                  });
    //dumpButton.shape.thickness = 6;


    closerControls = [
        btnClose
    ];
    
    lastButton = '';

    //--------

    w = region['obstacle_control'].width;
    h = region['obstacle_control'].height;

    btop = 32;

    btnBush = new Button({'text':'bush',
                          'shape':new Rect(new Point2D(w*.15,btop),w*.7,48,makeColor(.8,.8,.8)),
                          'activationCallback': function() {
                                        btnTree.deactivate();
                                        isDrawing = true;
                                        drawingType='bush';
                                        drawnShape = '';
                                        lastButton = btnBush;
                          },
                          'deactivationCallback': function() {
                                        isDrawing = false;
                                        drawingType = '';
                                        drawnShape = '';
                          },
                          'inRegion':region['obstacle_control']
                          });

     btop += 48 + 12;
     btnTree = new Button({'text':'tree',
                          'shape':new Rect(new Point2D(w*.15,btop),w*.7,48,makeColor(.8,.8,.8)),
                          'activationCallback': function() {
                                        btnBush.deactivate();
                                        isDrawing = true;
                                        drawingType='tree';
                                        drawnShape = '';
                                        lastButton = btnTree;
                          },
                          'deactivationCallback': function() {
                                        isDrawing = false;
                                        drawingType = '';
                                        drawnShape = '';
                          },
                          'inRegion':region['obstacle_control']
                          });

    obstacleControls = [
        btnBush,
        btnTree
    ];

    //--------
    
    w = region['game_control'].width;
    h = region['game_control'].height;
    dumpButton = new Button({'text':'dump',
                                  'shape':new Rect(new Point2D(w*.15,h*.1),w*.7,48,makeColor(.8,.8,.8)),
                                  'activationCallback': function() {
                                        console.log('implement dump');
                                        for (var i=0;i<fairwayShapes.length;++i) {
                                            console.log('fairway['+i+']:'+fairwayShapes[i].toString());
                                        }
                                        console.log('tee:'+teeShape.toString());
                                        console.log('green:'+greenShape.toString());
                                        for (var i=0;i<trapShapes.length;++i) {
                                            console.log('trap['+i+']:'+trapShapes[i].toString());
                                        }
                                        for (var i=0;i<pathShapes.length;++i) {
                                            console.log('path['+i+']:'+pathShapes[i].toString());
                                        }
                                        for (var i=0;i<waterShapes.length;++i) {
                                            console.log('water['+i+']:'+waterShapes[i].toString());
                                        }
                                        for (var i=0;i<bushShapes.length;++i) {
                                            console.log('bush['+i+']:'+bushShapes[i].toString());
                                        }
                                        for (var i=0;i<treeShapes.length;++i) {
                                            console.log('tree['+i+']:'+treeShapes[i].toString());
                                        }
                                        this.deactivate();
                                  },
                                  'deactivationCallback': function() { }
                                  });
    //dumpButton.shape.thickness = 6;


    metagameControls = [
        dumpButton
    ];

    //--------
    
    fairwayShapes = [];
    teeShape = '';
    greenShape = '';
    trapShapes = [];
    pathShapes = [];
    waterShapes = [];

    bushShapes = [];
    treeShapes = [];
    structureShapes = [];

    isDrawing = false;
    drawingType='';
    drawnShape='';
}


// When a key is pushed
function onKeyStart(key) {
    lastKeyCode = key;
}

function onTouchStart(x,y,id) {
    var touchPt = new Point2D(x,y);
    
    var whichRegion = getEltNameThatContainsPt(region,touchPt);
    if (whichRegion == 'course') {
        if (isDrawing) {
            if (drawingType == 'fairway') {
                if (drawnShape == '') {
                    drawnShape = new Polygon([touchPt],COLOR_FAIRWAY);
                }
                else {
                    drawnShape.addVertex(touchPt);
                }
            }
            else if (drawingType == 'tee') {
                if (drawnShape == '') {
                    drawnShape = new Polygon([touchPt],COLOR_TEE);
                } 
                else {
                    if (drawnShape.vertices.length < 4) {
                        drawnShape.addVertex(touchPt);
                    }
                }
            }
            else if (drawingType == 'green') {
                if (drawnShape == '') {
                    drawnShape = new Polygon([touchPt],COLOR_GREEN);
                } 
                else {
                    drawnShape.addVertex(touchPt);
                }
            }
            else if (drawingType == 'trap') {
                if (drawnShape == '') {
                    drawnShape = new Polygon([touchPt],COLOR_SAND);
                } 
                else {
                    drawnShape.addVertex(touchPt);
                }
            }
            else if (drawingType == 'path') {
                if (drawnShape == '') {
                    drawnShape = new Polygon([touchPt],COLOR_PATH);
                } 
                else {
                    drawnShape.addVertex(touchPt);
                }
            }
            else if (drawingType == 'water') {
                if (drawnShape == '') {
                    drawnShape = new Polygon([touchPt],COLOR_WATER);
                } 
                else {
                    drawnShape.addVertex(touchPt);
                }
            }
            else if (drawingType == 'bush') {
                if (drawnShape == '') {
                    drawnShape = new Circ(touchPt,12,COLOR_FOLIAGE);
                } 
                else {
                    drawnShape.radius = floor(touchPt.getDistanceTo(drawnShape.loc));
                }
            }
            else if (drawingType == 'tree') {
                if (drawnShape == '') {
                    drawnShape = new Circ(touchPt,12,COLOR_FOLIAGE);
                } 
                else {
                    drawnShape.radius = floor(touchPt.getDistanceTo(drawnShape.loc));
                }
            }

        }
    }
    else if (whichRegion == 'terrain_control') {
        var whichControl = getEltNameThatContainsPt(terrainControls,touchPt,region['terrain_control'].ul);
        // console.log('touched control is '+whichControl);
        if (whichControl != 'none') {
            terrainControls[whichControl].activate(x,y,id);
        }
    }
    else if (whichRegion == 'game_control') {
        var whichControl = getEltNameThatContainsPt(metagameControls,touchPt,region['game_control'].ul);
        // console.log('touched control is '+whichControl);
        if (whichControl != 'none') {
            metagameControls[whichControl].activate(x,y,id);
        }
    }
    else if (whichRegion == 'closer') {
        var whichControl = getEltNameThatContainsPt(closerControls,touchPt,region['closer'].ul);
        // console.log('touched control is '+whichControl);
        if (whichControl != 'none') {
            closerControls[whichControl].activate(x,y,id);
        }
    }
    else if (whichRegion == 'obstacle_control') {
        var whichControl = getEltNameThatContainsPt(obstacleControls,touchPt,region['obstacle_control'].ul);
        // console.log('touched control is '+whichControl);
        if (whichControl != 'none') {
            obstacleControls[whichControl].activate(x,y,id);
        }
    }
    
    

}

function onTouchMove(x,y,id) {
    var touchPt = new Point2D(x,y);
    
    var whichRegion = getEltNameThatContainsPt(region,touchPt);
    if ((whichRegion == 'course') && (isDrawing) && ((drawingType == 'bush') || (drawingType == 'tree')) && (drawnShape != '')) {
        drawnShape.radius = floor(touchPt.getDistanceTo(drawnShape.loc));
    }
}

function onTouchEnd(x,y,id) {
    if ((isDrawing) && (drawingType == 'bush') && (drawnShape != '')) {
        bushShapes.push(drawnShape);
        drawnShape = '';
    }
    else if ((isDrawing) && (drawingType == 'tree') && (drawnShape != '')) {
        treeShapes.push(drawnShape);
        drawnShape = '';
    }

}

// Called 30 times or more per second
function onTick() {    
    drawCourseRegion();
    drawTerrainControlRegion();
    drawCloserRegion();
    drawObstacleControlRegion();
    drawControlsRegion();
}


///////////////////////////////////////////////////////////////
//                                                           //
//                      HELPER RULES                         //

function drawCourseRegion() {
    region['course'].drawFill();  

    for (var i=0;i<fairwayShapes.length;++i) {
        //fairwayShapes[i].drawFill(region['course'].ul);
        fairwayShapes[i].drawFillSpline(region['course'].ul);
        fairwayShapes[i].drawOutline(region['course'].ul);
    }
    if ((isDrawing) && (drawingType == 'fairway') && (drawnShape != '')) {
        drawnShape.drawFillSpline(region['course'].ul);
        drawnShape.drawOutline(region['course'].ul);
    }

    if (teeShape != '') {
        teeShape.drawFill(region['course'].ul);
        teeShape.drawOutline(region['course'].ul);
        var tc = teeShape.getCenter();
        fillCircle(tc.x,tc.y,16,COLOR_DARKRED);
    }
    if ((isDrawing) && (drawingType == 'tee') && (drawnShape != '')) {
        drawnShape.drawFill(region['course'].ul);
        drawnShape.drawOutline(region['course'].ul);
        var tc = drawnShape.getCenter();
        fillCircle(tc.x,tc.y,16,COLOR_DARKRED);
    }

    if (greenShape != '') {
        greenShape.drawFillSpline(region['course'].ul);
        greenShape.drawOutline(region['course'].ul);
    }
    if ((isDrawing) && (drawingType == 'green') && (drawnShape != '')) {
        drawnShape.drawFillSpline(region['course'].ul);
        drawnShape.drawOutline(region['course'].ul);
    }
    
    for (var i=0;i<trapShapes.length;++i) {
        //trapShapes[i].draw(region['course'].ul);
        trapShapes[i].drawFillSpline(region['course'].ul);
        trapShapes[i].drawOutline(region['course'].ul);
    }
    if ((isDrawing) && (drawingType == 'trap') && (drawnShape != '')) {
        drawnShape.drawFillSpline(region['course'].ul);
        drawnShape.drawOutline(region['course'].ul);
    }

    for (var i=0;i<pathShapes.length;++i) {
        //pathShapes[i].draw(region['course'].ul);
        pathShapes[i].drawFillSpline(region['course'].ul);
        pathShapes[i].drawOutline(region['course'].ul);
    }
    if ((isDrawing) && (drawingType == 'path') && (drawnShape != '')) {
        drawnShape.drawFillSpline(region['course'].ul);
        drawnShape.drawOutline(region['course'].ul);
    }

    for (var i=0;i<waterShapes.length;++i) {
        //waterShapes[i].draw(region['course'].ul);
        waterShapes[i].drawFillSpline(region['course'].ul);
        waterShapes[i].drawOutline(region['course'].ul);
    }
    if ((isDrawing) && (drawingType == 'water') && (drawnShape != '')) {
        drawnShape.drawFillSpline(region['course'].ul);
        drawnShape.drawOutline(region['course'].ul);
    }


    for (var i=0;i<bushShapes.length;++i) {
        bushShapes[i].drawFill(region['course'].ul);
    }
    if ((isDrawing) && (drawingType == 'bush') && (drawnShape != '')) {
        drawnShape.drawFill(region['course'].ul);
    }

    for (var i=0;i<treeShapes.length;++i) {
        var trunk = new Circ(treeShapes[i].loc,treeShapes[i].radius*.15,COLOR_TRUNK);
        trunk.drawFill(region['course'].ul);
        treeShapes[i].drawFill(region['course'].ul);
        treeShapes[i].drawOutline(region['course'].ul);
    }
    if ((isDrawing) && (drawingType == 'tree') && (drawnShape != '')) {
        var trunk = new Circ(drawnShape.loc,drawnShape.radius*.15,COLOR_TRUNK);
        trunk.drawFill(region['course'].ul);
        drawnShape.drawFill(region['course'].ul);
        drawnShape.drawOutline(region['course'].ul);
    }


    region['course'].drawOutline();
}
function drawCloserRegion() {
    region['closer'].drawFill();

    for (var i=0;i<closerControls.length;++i) {
        closerControls[i].draw();
    }

    region['closer'].drawOutline();
}
function drawTerrainControlRegion() {
    region['terrain_control'].drawFill();

    for (var i=0;i<terrainControls.length;++i) {
        terrainControls[i].draw();
    }

    region['terrain_control'].drawOutline();
}
function drawObstacleControlRegion() {
    region['obstacle_control'].drawFill();

    for (var i=0;i<obstacleControls.length;++i) {
        obstacleControls[i].draw();
    }

    region['obstacle_control'].drawOutline();
}
function drawControlsRegion() {
    region['game_control'].drawFill();
    
    for (var i=0;i<metagameControls.length;++i) {
        metagameControls[i].draw();
    }
    
    region['game_control'].drawOutline();
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