function Avatar() {
    this.loc = new Point2D(100,100);
    this.angle = PI/-2;
    this.dest = this.loc.clone();
    this.stun = 0;
    //this.baseSpeed = 4;
    this.speeds = {
        'water':.25,
        'path':6,
        'trap':1.5,
        'tee': 6,
        'green': 5,
        'fairway': 4,
        'rough': 3
    };
    this.radius = 16;
    this.shape = new Circ(this.loc,this.radius,makeColor(.2,.9,.9,1));
    
    this.reach = 48;
    this.shapeReach = new Circ(this.loc,this.reach,makeColor(.2,.6,.2,.2));

    this.inRegion = region['course'];
    
    this.sprite = new Sprite({
        'sheetImage':'img/avatar.png',
        'frameCount':8,
        'stoppedFrameIdx':3,
        'frameWidth':56,
        'frameHeight':58,
        'scaling':(this.radius*3)/58
    });
        
    this.distSinceLastFrame = 0;
    this.distPerFrame = (this.sprite.frameHeight/(this.sprite.frameCount-2)) * this.sprite.scaling;
}

Avatar.prototype.teleportTo = function(p) {
    this.loc = p;
    this.dest = p.clone();
    this._updateShapes();
    this.shape.loc = this.loc;
}

Avatar.prototype.headTo = function(p) {
    if (! gameState.ball.isPlaced) {
        p.limitToRect(gameState.holes[gameState.currentHole].tee.shape);
    }

    this.dest = p;
}

Avatar.prototype.doMove = function() {
    //this.loc = this.dest.clone();
    // if loc is colocated with dest, return
    if (this.isAtDest()) {
        this.sprite.curFrame = this.sprite.stoppedFrameIdx;
        this.distSinceLastFrame = 0;
        return;
    }
    // set stepSpeed to baseSpeed times terrain modifier and +/- obstacle modifier (min 1)
    var stepSpeed = this.speeds[gameState.holes[gameState.currentHole].getTerrainAtPoint(this.loc).type]; //this.baseSpeed;
    
    var stepDest = this.dest.clone(); 
    //var stepDistance = this.loc.getDistanceTo(stepDest);
    var travelFraction = stepSpeed / this.loc.getDistanceTo(stepDest)

    // if dest is <= stepSpeed away, set stepDest to dest
    if (travelFraction < 1) {
        // else set stepDest to the point that's on the line from loc to dest and is stepSpeed along
        var deltaX = (stepDest.x - this.loc.x) * travelFraction;
        var deltaY = (stepDest.y - this.loc.y) * travelFraction;
        stepDest = new Point2D(this.loc.x+deltaX,this.loc.y+deltaY);
    }
    // COLLISION LOOP: set stepSegment to loc,stepDest
    // if stepSegment collides with an obstacle, set stepDest to the collision point shifted by radius along a line tangent to the obstacle at the collision point and re-do COLLISION LOOP (fail out to setting step dest to loc)
    this.angle = this.loc.getAngleTo(stepDest) - PI/2;

    this.distSinceLastFrame += this.loc.getDistanceTo(stepDest);
    while (this.distSinceLastFrame >= this.distPerFrame) {
        this.distSinceLastFrame -= this.distPerFrame;
        this.sprite.step();
    }
    
    this.loc = stepDest;
    this._updateShapes();
}

Avatar.prototype._updateShapes = function() {
    this.shape.loc = this.loc;
    this.shapeReach.loc = this.loc;
}


Avatar.prototype.isAtDest = function() {
    return this.loc.isEqualTo(this.dest);
}

Avatar.prototype.draw = function() {
    // if loc is dest or dest is undefined set anim type to STANDING, else to MOVING
    // draw shape / img / sprite at loc
    // advance animation counter
    
    var chargeInReach = false;
    for (var i=0;(i<gameState.charges.length) && (! chargeInReach);++i) {
        chargeInReach = gameState.avatar.shapeReach.containsPt(gameState.charges[i].loc);
    }
    
    if ((carriedCharge !== undefined) || (chargeInReach)) {
        this.shapeReach.drawFill(this.inRegion.ul);
        this.shapeReach.drawOutline(this.inRegion.ul);
    }
    //this.shape.drawFill(this.inRegion.ul);
    //drawTransformedImage(this.spriteSheet,this.loc.x, this.loc.y, this.angle,this.spriteScaling,this.spriteScaling,this.spriteCurFrame*this.spriteFrameWidth,0,this.spriteFrameWidth,this.spriteFrameHeight);
    this.sprite.drawAt(this.loc.x+this.inRegion.ul.x,this.loc.y+this.inRegion.ul.y,this.angle);
}

////--------------//----------------

function Caddy() {
    this.inRegion = region['caddy'];
    
    var zoneHeight = (this.inRegion.height - 30) / 5;
    var zoneBasis = 15 - zoneHeight/2;
    var zoneCenterX = this.inRegion.width/2;
    var controlSize = this.inRegion.width / 6;

    this.counters = {};
    this.counters['ball']   =  1;
    this.counters['putter'] = 10;
    this.counters['wedge']  = 10;
    this.counters['iron']   = 10;
    this.counters['driver'] = 10;


    this.ctrls = {};
    this.ctrls['ball']   = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight),  controlSize,COLOR_CHARGE['ball']);
    this.ctrls['putter'] = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight+150),Explosion.getMaxRadiusFromPower(Charge.getPowerOfType('putter')),COLOR_CHARGE['putter']);
    this.ctrls['wedge']  = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight+150+150),Explosion.getMaxRadiusFromPower(Charge.getPowerOfType('wedge')),COLOR_CHARGE['wedge']);
    this.ctrls['iron']   = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight+150+150+200),Explosion.getMaxRadiusFromPower(Charge.getPowerOfType('iron')),COLOR_CHARGE['iron']);
    this.ctrls['driver'] = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight+150+150+200+250),Explosion.getMaxRadiusFromPower(Charge.getPowerOfType('driver')),COLOR_CHARGE['driver']);
    
    // this data is no longer used
    this.ctrlsDisable = {};
    this.ctrlsDisable['putter'] = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight*2),controlSize*1.5,COLOR_CTRL_DISABLE);
    this.ctrlsDisable['wedge']  = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight*3),controlSize*1.5,COLOR_CTRL_DISABLE);
    this.ctrlsDisable['iron']   = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight*4),controlSize*1.5,COLOR_CTRL_DISABLE);
    this.ctrlsDisable['driver'] = new Circ(new Point2D(zoneCenterX,zoneBasis+zoneHeight*5),controlSize*1.5,COLOR_CTRL_DISABLE);
    
    this.fontAvailable = "28px Arial";
    this.fontEmpty = "bold 36px Arial";
    
    
    this.ctrlsImg = {};
    this.ctrlsImg['ball']   = ballImage;
    this.ctrlsImg['putter'] = putterImage;
    this.ctrlsImg['wedge']  = wedgeImage;
    this.ctrlsImg['iron']   = ironImage;
    this.ctrlsImg['driver'] = driverImage;
    
}

Caddy.prototype.draw = function() {
    this.drawControl('ball');
    this.drawControl('putter');
    this.drawControl('wedge');
    this.drawControl('iron');
    this.drawControl('driver');
    
}

Caddy.prototype.drawControl = function(ctrlLabel) {
    if (ctrlLabel == 'ball') {
        drawTransformedImage(this.ctrlsImg[ctrlLabel],
                             this.ctrls[ctrlLabel].loc.x+this.inRegion.ul.x,
                             this.ctrls[ctrlLabel].loc.y+this.inRegion.ul.y,
                             0,
                             this.ctrls[ctrlLabel].radius/64,this.ctrls[ctrlLabel].radius/64);
    } else {
        this.ctrls[ctrlLabel].drawFill(this.inRegion.ul);
        drawTransformedImage(this.ctrlsImg[ctrlLabel],
                             this.ctrls[ctrlLabel].loc.x+this.inRegion.ul.x,
                             this.ctrls[ctrlLabel].loc.y+this.inRegion.ul.y,
                             0,
                             this.ctrls[ctrlLabel].radius/128,this.ctrls[ctrlLabel].radius/128);
    }
//    drawTransformedImage(ballImage,this.ctrl.loc.x+this.inRegion.ul.x,this.ctrl.loc.y+this.inRegion.ul.y,0,this.ballImgScaling,this.ballImgScaling);
    
    
    
    var textLoc = this.ctrls[ctrlLabel].getCenter();
    var textPlacementFactor = this.ctrls[ctrlLabel].radius * .75;
    if (ctrlLabel == 'ball') {
        textPlacementFactor = 20;
    }
    textLoc.x += this.inRegion.ul.x;
    textLoc.y += this.inRegion.ul.y - (textPlacementFactor);



    var labelColor = COLOR_BLACK;
    if ((ctrlLabel != 'ball') && (this.counters['ball'] > 0)) {
        //this.ctrlsDisable[ctrlLabel].drawFill(this.inRegion.ul);
        labelColor = COLOR_GREY5;
    }
    
    if (this.counters[ctrlLabel] < 1) {
        fillText("0",textLoc.x,textLoc.y,COLOR_RED,this.fontEmpty,'center','middle');
    } else {
        fillText(this.counters[ctrlLabel] ,textLoc.x,textLoc.y,labelColor,this.fontAvailable,'center','middle');
    }
    fillText(ctrlLabel+((this.counters[ctrlLabel]==1)?'':'s'),textLoc.x,textLoc.y+(textPlacementFactor*2),labelColor,this.fontAvailable,'center','middle');
    
    
}

Caddy.prototype.setContents = function(b,p,w,i,d) {
    this.counters['ball']   = b;
    this.counters['putter'] = p;
    this.counters['wedge']  = w;
    this.counters['iron']   = i;
    this.counters['driver'] = d;
}

Caddy.prototype.provideCharge = function(chargeType) {
    if (this.counters[chargeType] > 0) {
        --this.counters[chargeType];
        var c = new Charge();
        c.setType(chargeType);
        c.timer = 0;
        return c;
    }
    return undefined;
}

Caddy.prototype.receiveCharge = function(charge) {
    ++this.counters[charge.type];
}

//--------------//----------------

function XGBall() {
    this.loc = new Point2D(10,10);
    this.dest = this.loc.clone();
    this.stageOrigin = this.loc.clone();
    this.travelAngle = 0;
    this.speed = 0;
    this.countdownTimerMax = 9000; // 5 minutes
    this.countdownTimer = this.countdownTimerMax;
    
    this.lastPushedByType = '';
    this.stage = 0;
    
    this.isPlaced = false;
    this.isSunk = false;
    this.justMissed = false;

    this.shape = new Circ(this.loc,5,COLOR_CHARGE['ball']);

    this.inRegion = region['course'];
    
    this.drawAngle = 0;
    
    this.RnDmovementTicks = 0;
    this.RnDmoveOrigin = this.loc.clone();
}

XGBall.prototype.getCountdownFraction = function() {
    return this.countdownTimer / this.countdownTimerMax;
}

XGBall.prototype.setLoc = function(p) {
    this.loc = p;
    this.shape.loc = p;
}

XGBall.prototype.recoverToLoc = function(p) {
    this.loc = p;
    this.shape.loc = p;
    this.dest = this.loc.clone();
    this.stageOrigin = this.loc.clone();
    this.travelAngle = 0;
    this.speed = 0;
    this.stage = 0;
}


XGBall.prototype.draw = function() {
    if (this.isPlaced) {
        //this.shape.drawFill(this.inRegion.ul);
        var drawAngle = 0;
        if (this.speed > 0) {
            if (randomReal(0,4) < this.speed) {
                this.drawAngle = randomReal(0,2*PI);
            }
            drawAngle = this.drawAngle;
        }
        drawTransformedImage(ballImage,
                             this.loc.x+this.inRegion.ul.x,
                             this.loc.y+this.inRegion.ul.y,
                             drawAngle,
                             5/64,5/64);
    }
}

XGBall.prototype.pushedBy = function(pushOriginPt,pushPower,pushType) {
    //console.log('ball is pushed from '+pushOriginPt.toString()+' with power '+pushPower);
    if (pushType != 'wedge') {
        var t = gameState.holes[gameState.currentHole].getTerrainAtPoint(this.loc).type;
        if ('trap' == t) {
            if (randomReal(0,1) > .25) {
                pushPower *= .1;
                //console.log('push reduced');
            } 
//            else {
//                console.log('push unaltered');
//            }
        }
//        else {
//            console.log('ball not in trap - in '+t);
//        }
    }
//    else {
//        console.log('pushed by wedge');
//    }

    var pushDistance = pushPower*.75;
    console.log('TODO: check for push by charge in trap - if charge is not wedge, reduce push by 80%');
    var pushAngle = pushOriginPt.getAngleTo(this.loc);
    var offsetPt = Point2D.createFromAngleAndMagnitude(pushAngle,pushDistance);
    if (pushDistance >= this.loc.getDistanceTo(this.dest)) {
        this.stage = 0;
    }
    var speedDelta = pushPower/10;
    if (! this.loc.isEqualTo(this.dest)) {
        var origAngle = this.loc.getAngleTo(this.dest);
        var angleDiff = abs(pushAngle - origAngle);
        speedDelta *= Math.cos(angleDiff);
    }
    this.speed += speedDelta;
    this.dest.shiftBy(offsetPt);

    this.travelAngle = this.loc.getAngleTo(this.dest);
    
    if (this.stage == 0) {
        this.lastPushedByType = pushType;
        this.stageOrigin = this.loc.clone();
        this.stage = 1;
        this.justMissed = false;
        this.RnDmovementTicks = 0;
        this.RnDmoveOrigin = this.loc.clone();
    }
}


XGBall.prototype.doMove = function() {
    if (this.isPlaced) {
        // do ball movement;

        if (this.loc.isEqualTo(this.dest)) {
            // BOUNCE!    
            if (this.speed == 0) {
                if (this.justMissed) {
                    playerAlert.setMessage("Almost got it!\nThe ball was moving too quickly");
                    uiMode = 'playerAlert';
                    this.justMissed = false;
                }
                return;
            }
            console.log('TO DO: have the bounce at '+this.loc.toString()+' affected by the terrain');

            var speedDeltaFactor;
            var travelAngleFactor;
            var distanceFactor;

            var bounceTerrain = gameState.holes[gameState.currentHole].getTerrainAtPoint(this.loc).type;
            if (bounceTerrain == 'water') {
                console.log('TO DO: check ball speed on water bounce to see if it skips');
                speedDeltaFactor = .01;
                travelAngleFactor = .01;
                distanceFactor = .01;
            } else
            if (bounceTerrain == 'path') {
                speedDeltaFactor = .7;
                travelAngleFactor = .15;
                distanceFactor = 1.1;
            } else
            if (bounceTerrain == 'trap') {
                speedDeltaFactor = .2;
                travelAngleFactor = .1;
                distanceFactor = .2;
            } else
            if (bounceTerrain == 'tee') {
                speedDeltaFactor = .7;
                travelAngleFactor = .01;
                distanceFactor = .7;
            } else
            if (bounceTerrain == 'green') {
                speedDeltaFactor = .7;
                travelAngleFactor = .01;
                distanceFactor = .7;
            } else
            if (bounceTerrain == 'fairway') {
                speedDeltaFactor = .6;
                travelAngleFactor = .05;
                distanceFactor = .6;
            } else
            if (bounceTerrain == 'rough') {
                speedDeltaFactor = .5;
                travelAngleFactor = .2;
                distanceFactor = .5;
            }

            bounceAnimations.push(new BounceAnimation(this.loc));
            this.playBounceSound();
            
            this.speed = this.speed * speedDeltaFactor;
            if (this.lastPushedByType == 'wedge') {
                this.speed = this.speed * .5;
            }
            
            this.travelAngle = this.travelAngle * randomReal(1-travelAngleFactor,1+travelAngleFactor);
            var stageDistance = this.stageOrigin.getDistanceTo(this.loc) * distanceFactor;
            //console.log("RnD: stage distance is "+stageDistance);
            console.log("RnD: speed is "+this.speed);
            
            if ((this.speed < 1) || (stageDistance < 1)) {
                this.speed = 0;
                this.stage = 0;
                this.setLoc(this.dest.clone());
                this.stageOrigin = this.loc.clone();
                this.RnDmovementTicks = 0;
                this.RnDmoveOrigin = this.loc.clone();
                return;
            }

            this.dest.shiftBy(Point2D.createFromAngleAndMagnitude(this.travelAngle,stageDistance));
            this.stageOrigin = this.loc.clone();
            this.lastPushedByType = '';
            this.stage++;
        }
        
        this.RnDmovementTicks++;
        if (this.RnDmovementTicks % 5 == 0) {
            //console.log("RnD: at ticks "+this.RnDmovementTicks+" dist is "+this.RnDmoveOrigin.getDistanceTo(this.loc));
        }

        var stepSpeed = this.speed;
        var stepDest = this.dest.clone(); 
        //var stepDistance = this.loc.getDistanceTo(stepDest);
        var travelFraction = stepSpeed / this.loc.getDistanceTo(stepDest)

        // if dest is <= stepSpeed away, set stepDest to dest
        if (travelFraction < 1) {
            // else set stepDest to the point that's on the line from loc to dest and is stepSpeed along
            var deltaX = (stepDest.x - this.loc.x) * travelFraction;
            var deltaY = (stepDest.y - this.loc.y) * travelFraction;
            stepDest = new Point2D(this.loc.x+deltaX,this.loc.y+deltaY);
        }
        // COLLISION LOOP: set stepSegment to loc,stepDest
        // if stepSegment collides with an obstacle, set stepDest to the collision point shifted by radius along a line tangent to the obstacle at the collision point and re-do COLLISION LOOP (fail out to setting step dest to loc)
        var collisionCheckSteps = floor(stepSpeed / (this.shape.radius * 2)) + 1;
        var checkCirc = this.shape.clone();
        for (var i=0;i<collisionCheckSteps;++i) {
            // if flag collision, do scoring
            if (Shape.checkIfShapeIntersect(checkCirc,gameState.theHole().flag.shape)) {
                if (this.speed > 5) {
                    //console.log('TO DO: implement almost-scoring event');
//playerAlert.setMessage("Almost got it!\nThe ball was moving too quickly");
                    this.justMissed = true;
                } else {
                    this.recoverToLoc(checkCirc.loc.clone());
                    stepDest = this.dest.clone();
                    this.justMissed = false;
                    this.isSunk = true;
                    gameState.score.recordCurrentScore(gameState);
                    var strokesLabel = '  strokes';
                    if (gameState.score.hole[gameState.currentHole].strokes <= gameState.holes[gameState.currentHole].par) {
                        strokesLabel = 'par bonus'
                    }
                    playerAlert.setMessage("SUNK IT!\nYour score for this hole is:\n"+
                        '                           '+strokesLabel+': '+gameState.score.hole[gameState.currentHole].strokes+' ('+gameState.score.hole[gameState.currentHole].strokeBonus+" pts)\n"+
                        '                          distance: '+gameState.score.hole[gameState.currentHole].distToFlag+' ('+gameState.score.hole[gameState.currentHole].distBonus+" pts)\n"+
                        '                    time bonus: '+gameState.score.hole[gameState.currentHole].ballTimeBonus+"\n"+
                        '                    caddy bonus: '+gameState.score.hole[gameState.currentHole].caddyBonus+"\n"+
                        '                   flag bonus: '+gameState.score.hole[gameState.currentHole].flagBonus+"\n"+
                        'TOTAL: '+gameState.score.hole[gameState.currentHole].SCORE,
                        "40px Arial"
                        );
                    uiMode = 'playerAlert';
                }
            }
            // else check for bush collision
            // else check for tree collision
            // else check for structure collision

            checkCirc.loc.x += Math.cos(this.travelAngle) * (this.shape.radius * 2);
            checkCirc.loc.y += Math.sin(this.travelAngle) * (this.shape.radius * 2);
        }

        this.setLoc(stepDest);
    }
}

XGBall.prototype.playBounceSound = function() {
    console.log('hook for bounce sound');
}

XGBall.prototype.tick = function() {
    if (this.isPlaced) {
        this.countdownTimer -= 2.5;
        if (this.countdownTimer <= 0) {
            gameState.score.recordCurrentScore(gameState);
            playerAlert.setMessage("BOOM!\nYour ball blew up!\nYour score for this hole is:\n"+gameState.score.hole[gameState.currentHole].SCORE);
            uiMode = 'playerAlert'
            this.countdownTimer = 0;
        }
    }
}

//--------------//----------------

function BounceAnimation(loc,maxRadius) {
    this.shape = new Circ(loc,1,COLOR_BOUNCE);
    this.maxRadius = (maxRadius === undefined) ? 7 : maxRadius;
    this.inRegion = region['course'];
}

BounceAnimation.prototype.stepAndCheckDone = function() {
    this.shape.radius++;
    return this.shape.radius > this.maxRadius;
}

BounceAnimation.prototype.draw = function() {
    this.shape.drawFill(this.inRegion.ul);
}


//--------------//----------------

function TargetFlag(x,y) {
    this.shape = new Rect(new Point2D(x,y),14,8,COLOR_FLAG);
    //this.drawShape = this.shape.clone();
    //this.drawShape.ul.shiftBy(-2,-2);
    //this.drawShape.br.shiftBy(2,2);
    //this.drawShape.width += 4;
    //this.drawShape.height += 4;
    this.inRegion = region['course'];
    this.loc = this.shape.getCenter().clone();
    this.drawLoc = this.loc.clone().shiftedBy(this.inRegion.ul);
    this.drawLoc.shiftBy(-16,-36);
    this.img = flagImage;
}


TargetFlag.prototype.draw = function() {
    //this.drawShape.drawFill(this.inRegion.ul);
    drawImage(this.img, this.drawLoc.x, this.drawLoc.y, 32, 48);
}


//--------------//----------------

function Charge() {
    this.loc = new Point2D(100,100);
    this.type = 'driver';
    this.timer = 0;
    this.power = {};
    this.power['ball'] = Charge.getPowerOfType('ball');
    this.power['putter'] = Charge.getPowerOfType('putter');
    this.power['wedge'] = Charge.getPowerOfType('wedge');
    this.power['iron'] = Charge.getPowerOfType('iron');
    this.power['driver'] = Charge.getPowerOfType('driver');

    this.img = {};
    this.img['ball']   = ballImage;
    this.img['putter'] = putterImage;
    this.img['wedge']  = wedgeImage;
    this.img['iron']   = ironImage;
    this.img['driver'] = driverImage;

    this.shape = new Circ(this.loc,7,COLOR_CHARGE[this.type]);
    this.highlightShape = new Circ(this.loc,8,COLOR_CHARGE_HIGHLIGHT);
    this.outlineShape = new Circ(this.loc,Explosion.getMaxRadiusFromPower(Charge.getPowerOfType(this.type)),COLOR_CHARGE_OUTLINE);
    
    this.inRegion = 'none';
}

Charge.getPowerOfType = function(t) {
    if (t=='putter') { return 20; }
    if (t=='wedge') { return 32; }
    if (t=='iron') { return 67; }
    if (t=='driver') { return 110; }
    return 1000;
}

Charge.prototype.setType = function(t) {
    this.type = t;
    this.shape.setColor(COLOR_CHARGE[t]);
    this.setOutline();
}

Charge.prototype.setOutline = function() {
    this.outlineShape = new Circ(this.loc,Explosion.getMaxRadiusFromPower(Charge.getPowerOfType(this.type)),COLOR_CHARGE_OUTLINE);
}

Charge.prototype.setLoc = function(pt_or_x,optional_y) {
    var y = optional_y;
    var x = pt_or_x;
    if (optional_y === undefined) {
        x = pt_or_x.x;
        y = pt_or_x.y;
    }
    this.loc.x = x;
    this.loc.y = y;
    this.shape.x = x;
    this.shape.y = y;
    this.highlightShape.x = x;
    this.highlightShape.y = y;
    this.outlineShape.x = x;
    this.outlineShape.y = y;
}

Charge.prototype.containsPt = function(p) {
    return this.shape.containsPt(p);
}


Charge.prototype.drawHighlightIfIn = function(elt) {
    if (elt.containsPt(this.loc)) {
        this.highlightShape.drawFill(this.inRegion.ul);
    }
}

Charge.prototype.draw = function() {
    //fillCircle(this.loc.x,this.loc.y,4,COLOR_CHARGE[this.type]);
    if (this.inRegion == 'none') {
        //this.shape.drawFill();
        drawTransformedImage(this.img[this.type],
                             this.loc.x,
                             this.loc.y,
                             0,
                             7/64,7/64);

/*
        drawTransformedImage(this.ctrlsImg[ctrlLabel],
                             this.ctrls[ctrlLabel].loc.x+this.inRegion.ul.x,
                             this.ctrls[ctrlLabel].loc.y+this.inRegion.ul.y,
                             0,
                             this.ctrls[ctrlLabel].radius/64,this.ctrls[ctrlLabel].radius/64);
*/
        if (this.type != 'ball') {
            this.outlineShape.drawFill();
        }
    } else {
        //this.shape.drawFill(this.inRegion.ul);
        drawTransformedImage(this.img[this.type],
                             this.loc.x+this.inRegion.ul.x,
                             this.loc.y+this.inRegion.ul.y,
                             0,
                             7/64,7/64);
        if (this.type != 'ball') {
            this.outlineShape.drawFill(this.inRegion.ul);
        }
    }
}


//--------------//----------------

function Explosion(explodable) {
    this.loc = explodable.loc.clone();
    this.sourceType = explodable.type;
    this.initPower = explodable.power[explodable.type];
    this.maxRadius = Explosion.getMaxRadiusFromPower(this.initPower);
    this.curRadius = 1;
    this.shape = '';
    this.stageCounter = 0;
    this.adminCounter = 0;
    this.isDone = false;
    
    this.inRegion = region['course'];
    
    this.sprite = explosionSprite.cloneLight();
}

Explosion.getMaxRadiusFromPower = function(power) {
    return 12 * Math.pow(power,.5);
}

Explosion.prototype.getCurrentForce = function() {
    return Math.pow((this.maxRadius-this.curRadius),.5)/Math.pow(this.maxRadius,.5) * this.initPower;
}


Explosion.prototype.step = function() {
    var radSpan = this.maxRadius - this.curRadius;
    this.curRadius += floor(radSpan * .3) + 1;
    if (this.curRadius > this.maxRadius) {
        this.curRadius = this.maxRadius;
        this.isDone = true;
    }
    this.setShape();
    this.sprite.step();
}

Explosion.prototype.setShape = function() {
    this.shape = new Circ(this.loc,this.curRadius,makeColor(.8,.4,0,.5));
}

Explosion.prototype.draw = function() {
    //this.shape.drawFill(this.inRegion.ul);
    this.sprite.scaling = (this.curRadius*2)/this.sprite.frameWidth * 1.5;
    this.sprite.drawAt(this.loc.x+this.inRegion.ul.x,this.loc.y+this.inRegion.ul.y,randomReal(0,2*PI));
}

//--------------//----------------

function ScoreCard() {
    this.hole = [];
}

ScoreCard.prototype.startNewHole = function(idx) {
    this.hole[idx] = 
        {
        'strokes':0,
        'strokeBonus':0,
        'distToFlag':0,
        'distBonus': 0,
        'flagBonus':0,
        'ballTimeBonus':0,
        'caddyBonus':0,
        'specialBonus': 0,
        'SCORE': 0
        };
}

ScoreCard.prototype.recordCurrentScore = function(gs) {
    var idx = gs.currentHole;
    var h = gs.theHole();
    if (this.hole[idx] === undefined) {
        this.startNewHole(idx);
    }

    this.hole[idx].flagBonus = 0;

    if (gs.ball.isSunk) {
        this.hole[idx].flagBonus = h.par * 700;
        this.hole[idx].distToFlag = 0;
    } else {
        this.hole[idx].distToFlag = floor(gs.ball.loc.getDistanceTo(h.flag.loc));
    }
    this.hole[idx].distBonus = floor(((h.tee.shape.getCenter().getDistanceTo(h.flag.loc) - this.hole[idx].distToFlag) * 3)/2);
    
    this.hole[idx].ballTimeBonus = floor(((gs.ball.countdownTimer/1000) * (gs.ball.countdownTimer/1000) * (gs.ball.countdownTimer/1000) * (gs.ball.countdownTimer/1000))/2);

    if (this.hole[idx].strokes > 0) {
        this.hole[idx].strokeBonus = h.par - this.hole[idx].strokes;
        if (this.hole[idx].strokeBonus < 0) {
            this.hole[idx].strokeBonus *= 150; 
        } else {
            this.hole[idx].strokeBonus += 5;
            this.hole[idx].strokeBonus = this.hole[idx].strokeBonus * this.hole[idx].strokeBonus * this.hole[idx].strokeBonus;
            this.hole[idx].strokeBonus *= 15;
        }
    }

    this.hole[idx].caddyBonus = 0
        + (gs.caddy.counters.putter * gs.caddy.counters.putter * 7)
        + (gs.caddy.counters.wedge * gs.caddy.counters.wedge * 11)
        + (gs.caddy.counters.iron * gs.caddy.counters.iron * 18)
        + (gs.caddy.counters.driver * gs.caddy.counters.driver * 28);

    this.hole[idx].SCORE = floor(this.hole[idx].strokeBonus + this.hole[idx].distBonus + this.hole[idx].flagBonus + this.hole[idx].ballTimeBonus + this.hole[idx].caddyBonus + this.hole[idx].specialBonus);
}

ScoreCard.prototype.runningTotal = function() {
    var tot = 0;
    for (var i=0;i<this.hole.length;++i) {
        tot += this.hole[i].SCORE;
    }
    return tot;
}

ScoreCard.prototype.drawForHole = function(idx,pt,font,c) {
    if (gameState.ball.isPlaced) {
        fillText('HOLE SCORE: '+this.hole[idx].SCORE,pt.x,pt.y,c,font,'center','middle');
        fillText('STROKES: '+this.hole[idx].strokes,pt.x,pt.y+40,c,font,'center','middle');
        
    }
}

//--------------//----------------

function XGHole(w,h) {
    this.title = 'Practice Hole';
    this.roughs = [new Terrain({'type':'rough','shape': new Rect(region['course'].ul,region['course'].width,region['course'].height,COLOR_ROUGH)})];
    //this.rough = new Rough({'shape': new Rect(0,0,w,h,COLOR_ROUGH)});
    // this.fairway = new Rect(new Point2D(w*.1,h*.1),w*.8,h*.8,COLOR_FAIRWAY);
    this.fairways = [new Terrain({'type':'fairway', 'shape': new Rect(new Point2D(w*.1,h*.1),w*.8,h*.8,COLOR_FAIRWAY)})];
    this.traps = [new Terrain({'type':'trap', 'shape': new Rect(new Point2D(w*.5,h*.5-90),90,180,COLOR_SAND)})];
    this.paths = [];
    this.waters = [];
    
//    this.tee = new Rect(new Point2D(w*.1+180,h*.5-60),120,120,COLOR_TEE);
//    this.green = new Rect(new Point2D(w*.9-300,h*.5-90),180,180,COLOR_GREEN);

    this.tee = new Terrain({'type':'tee', 'shape': new Rect(new Point2D(w*.1+180,h*.5-60),120,120,COLOR_TEE)});
    this.green = new Terrain({'type':'green', 'shape': new Rect(new Point2D(w*.9-300,h*.5-90),180,180,COLOR_GREEN)});

    
    this.flag = new TargetFlag(w*.9-200,h*.5-40);
    this.bushes = [];
    this.structures = [];
    this.trees = [];
    
    this.par = 3;
    
    this.inRegion = region['course'];
    
    this.startingCaddyVals = {'putter':8,'wedge':3,'iron':4,'driver':3};

    this.terrainHierarchy = ['waters', 'paths', 'traps', 'tee', 'green', 'fairways', 'roughs'];
}

// returns only the most relevant terrain at the point, according to the terrainHierarchy, with earlier defined terrains within a type getting priority (though that shouldn't matter)
XGHole.prototype.getTerrainAtPoint = function(p) {
    for (var i=0;i<this.terrainHierarchy.length;++i) {
        if (this.terrainHierarchy[i] == 'tee') {
            if (this.tee.containsPt(p)) { return this.tee; };
        } else
        if (this.terrainHierarchy[i] == 'green') {
            if (this.green.containsPt(p)) { return this.green; };
        } else
        {
            for (var j=0;j<this[this.terrainHierarchy[i]].length;++j) {
                //console.log("checking point in terrain "+this[this.terrainHierarchy[i]][j].toString());
                if (this[this.terrainHierarchy[i]][j].containsPt(p)) { return this[this.terrainHierarchy[i]][j]; };
            }
        }
    }

    console.log('unexpectedly found no terrain at point '+p.toString());
    return this.roughs[0]; // should never hit this as roughs should always contain a hole-spanning shape
}

XGHole.prototype.drawTerrain = function() {
    // rough
    // fairway
    // tee
    // green
    // traps
    for (var i=0;i<this.roughs.length;i++) {
        this.roughs[i].draw(); //drawFill(this.inRegion.ul);
    }
    for (var i=0;i<this.fairways.length;i++) {
        this.fairways[i].draw(); //drawFill(this.inRegion.ul);
    }
    //this.fairway.drawFill(this.inRegion.ul);
    this.tee.draw(); //drawFill(this.inRegion.ul);
    this.green.draw(); //drawFill(this.inRegion.ul);
    for (var i=0;i<this.traps.length;++i) {
        this.traps[i].draw(); //drawFill(this.inRegion.ul);
    }
}

XGHole.prototype.drawObjects = function() {
    // flag
    // bushes
    // structures
    // trees

    this.flag.draw(); 
    
    for (var i=0;i<this.bushes.length;++i) {
        this.bushes[i].drawFill(this.inRegion.ul);
    }
    for (var i=0;i<this.structures.length;++i) {
        this.structures[i].drawFill(this.inRegion.ul);
    }
    for (var i=0;i<this.trees.length;++i) {
        this.trees[i].drawFill(this.inRegion.ul);
    }
}

//--------------//----------------

function Detonator() {
    this.inRegion = region['detonator'];
    this.ctrls = {'boom':
                    new Button({'text':'BOOM!',
                                'shape':new Circ(new Point2D(this.inRegion.width/2,this.inRegion.height/2),this.inRegion.height/3,makeColor(.9,.1,.1)),
                                'activationCallback': function(det) { 
                                    det.isPressed = true; 
                                    this.fontColor = COLOR_GREY5;
                                    this.doTextOutline = true;
                                    gameState.score.hole[gameState.currentHole].strokes++;
                                 },
                                'deactivationCallback': function(det) {
                                    det.isPressed = false;
                                    this.fontColor = COLOR_BLACK;
                                    this.doTextOutline = false;
                                 }
                               })    
                };
    this.ctrls['boom'].inRegion = this.inRegion;
    this.ctrls['boom'].font = 'bold 36px Arial';
    this.shadeOutShape = new Circ(new Point2D(this.inRegion.width/2,this.inRegion.height/2),this.inRegion.height/3,makeColor(.8,.8,.8,.5))
//    new Circ(new Point2D(this.inRegion.width/2,this.inRegion.height/2),this.inRegion.height/4,COLOR_RED);
    //this.textLoc = this.ctrl.getCenter();
    //this.textLoc.x += this.inRegion.ul.x;
    //this.textLoc.y += this.inRegion.ul.y;
    this.isPressed = false;
}

Detonator.prototype.draw = function() {
    //this.ctrl.drawFill(this.inRegion.ul);
    this.ctrls['boom'].draw();
    drawTransformedImage(roundButtonImage,
                         this.shadeOutShape.loc.x+this.inRegion.ul.x,
                         this.shadeOutShape.loc.y+this.inRegion.ul.y,
                         0,
                         this.shadeOutShape.radius/128,
                         this.shadeOutShape.radius/128);
    // fillText("BOOM!",this.textLoc.x,this.textLoc.y,COLOR_BLACK,"bold 36px Arial",'center','middle');
    if ((gameState.explosions.length > 0) || (gameState.charges.length == 0)) {
        this.shadeOutShape.drawFill(this.inRegion.ul);
        if ((gameState.charges.length == 0) && (gameState.ball.isPlaced)) {
            fillText('place some charges!',this.shadeOutShape.loc.x+this.inRegion.ul.x,this.shadeOutShape.loc.y+30+this.inRegion.ul.y,COLOR_DARKRED,'bold 28px Arial','center','middle');
        }
    }
}

//--------------//----------------

function BallControl(b) {
    this.ball = b;
    this.inRegion = region['ball_control'];
    
    this.ctrl = new Circ(new Point2D(15+this.inRegion.height/2,this.inRegion.height/2),this.inRegion.height/4,COLOR_WHITE);    
    this.ballImgScaling = this.ctrl.radius/64;
    this.fuseHeight = 8;
    this.fuseLength = this.inRegion.width - this.inRegion.height/2 - this.ctrl.loc.x;
    
    this.fuse = new Rect(new Point2D(this.ctrl.loc.x+this.ctrl.radius-3,this.inRegion.height/2-this.fuseHeight/2),this.fuseLength,this.fuseHeight,COLOR_FUSE);
    this.burntFuse = new Rect(new Point2D(this.fuse.x+this.fuseLength,this.inRegion.height/2-this.fuseHeight/2),0,this.fuseHeight,makeColor(.4,.4,.4));

    this.hintTextLoc = new Point2D(this.fuse.getCenter().x+this.inRegion.ul.x,this.fuse.br.y-50+this.inRegion.ul.y);
    this.timerTextLoc = new Point2D(this.fuse.getCenter().x+this.inRegion.ul.x,this.fuse.br.y+40+this.inRegion.ul.y);

    this.burnFuse();
}

BallControl.prototype.burnFuse = function() {
    var burnSize = this.fuseLength * (1-this.ball.getCountdownFraction());
    this.burntFuse.ul.x = this.fuse.br.x - burnSize;
    this.burntFuse.width = burnSize;
}

BallControl.prototype.draw = function() {
    this.fuse.drawFill(this.inRegion.ul);
    this.burntFuse.drawFill(this.inRegion.ul);
    //this.ctrl.drawFill(this.inRegion.ul);
    drawTransformedImage(ballImage,this.ctrl.loc.x+this.inRegion.ul.x,this.ctrl.loc.y+this.inRegion.ul.y,0,this.ballImgScaling,this.ballImgScaling);
    if (! this.ball.isPlaced) {
        fillText('Place the ball in the tee area',this.hintTextLoc.x,this.hintTextLoc.y,COLOR_RED,'bold 40px Arial','center','middle');
    }
    fillText((this.ball.countdownTimer / 30).toFixed(2)+' seconds left until the ball explodes',
             this.timerTextLoc.x,this.timerTextLoc.y,((this.ball.isPlaced)?(COLOR_BLACK):(COLOR_GREY5)),'40px Arial','center','middle');

    if (this.ball.isPlaced) {
        fuseBurnSprite.drawAt(this.burntFuse.ul.x+this.inRegion.ul.x,this.burntFuse.ul.y+4+this.inRegion.ul.y,randomReal(-.05,.05));
    }
}

//--------------//----------------

function Terrain(inits) {
    
    if (inits === undefined) {
        inits = {
            'type': 'rough',
            'shape': new Rect(region['course'].ul,region['course'].width,region['course'].height,COLOR_ROUGH),
            'inRegion': region['course']
        };
    }

    this.inRegion = (inits.inRegion === undefined) ? region['course'] : inits.inRegion;

    this.type = inits.type;;
    this.shape = inits.shape;
}

Terrain.prototype.containsPt = function(p) {
    return this.shape.containsPt(p);
}

Terrain.prototype.toString = function() {
    return this.type+"-"+this.shape.toString();
}


Terrain.prototype.draw = function() {
    this.shape.drawFill(this.inRegion.ul);
}

//--------------//----------------
//--------------//----------------

function GameState() {
    this._initialize();
}

GameState.prototype._initialize = function() {
    this.score = new ScoreCard();
    this.holes = [new XGHole(region['course'].width,region['course'].height)]; // of XGHole objects
    this.currentHole = 0;
    this.avatar = new Avatar();
    this.ball = new XGBall();
    this.caddy = new Caddy();
    this.charges = [];
    this.explosions = [];
    this.detonator = new Detonator();
    this.ballControl = new BallControl(this.ball);
    
    if (this.currentHole !== undefined) {
        this.startHole(this.currentHole);
    }
}

GameState.prototype.startHole = function(holeIdx) {
    this.currentHole = holeIdx; console.log('TODO: check holeIdx range');
    this.score.startNewHole(holeIdx);
    var curHole = this.holes[this.currentHole];
    this.caddy.setContents(1,curHole.startingCaddyVals['putter']
                            ,curHole.startingCaddyVals['wedge']
                            ,curHole.startingCaddyVals['iron']
                            ,curHole.startingCaddyVals['driver']);    
    this.avatar.teleportTo(curHole.tee.shape.getCenter());

    this.ball.isPlaced = false;
    this.ball.isSunk = false;
}

GameState.prototype.goToNextHole = function() {
    if (this.currentHole < (this.holes.length-1)) {
        this.startHole(this.currentHole+1);    
    } else {
        playerAlert.setMessage("GAME OVER\n\nYour final score is "+this.score.runningTotal());
        uiMode = 'playerAlert';
        this._initialize();
    }
}

// a bit of sugar to make getting the current hole object easier
GameState.prototype.theHole = function() {
    return this.holes[this.currentHole];
}

GameState.prototype.emplaceCharge = function(c) {
    if (c.type == 'ball') {
        this.ball.setLoc(c.loc.clone());
        this.ball.dest = c.loc.clone();
        this.ball.isPlaced = true;
    } else {
        c.inRegion = region['course'];
        this.charges.push(c);
    }
}

//--------------//----------------
//--------------//----------------
//--------------//----------------
// OBJECTS THAT ARE NOT A PART OF THE GAME STATE ARE BELOW (though they may depend on the game state)
//--------------//----------------
//--------------//----------------
//--------------//----------------

