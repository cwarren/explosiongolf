function Avatar() {
    this.type='avatar';
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
    this.speedMods = {
        'none': 1,
        'bush':.5,
        'tree':1,
        'tree_trunk':0,
        'structure':0
    };
    this.radius = 16;
    this.shape = new Circ(this.loc,this.radius*.75,makeColor(.2,.9,.9,1));
    
    this.reach = 48;
    this.shapeReach = new Circ(this.loc,this.reach,makeColor(.2,.6,.2,.2));

    this.inRegion = region['course'];
    
    this.sprite = new Sprite({
        'sheetImage':'img/avatar.png',
        'frameCount':8,
        'stoppedFrameIdx':0,
        'frameWidth':56,
        'frameHeight':58,
        'scaling':(this.radius*3)/58
    });
        
    this.distSinceLastFrame = 0;
    this.distPerFrame = (this.sprite.frameHeight/(this.sprite.frameCount)) * this.sprite.scaling;
}

Avatar.prototype.teleportTo = function(p) {
    this.loc = p;
    this.dest = p.clone();
    this._updateShapes();
    this.shape.loc = this.loc;
}

Avatar.prototype.headTo = function(p) {
    if (! gameState.ball.isPlaced) {
        p.limitToPolygon(gameState.holes[gameState.currentHole].tee.shape);
    }

    this.dest = p;
    //console.log('  avtar heading to '+this.dest.toString());
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
    var stepSpeed = this.speeds[gameState.holes[gameState.currentHole].getTerrainAtPoint(this.loc).type];
    var obstacle = gameState.holes[gameState.currentHole].getObstacle(this);
    var obstacleSpeedMod = this.speedMods[obstacle.type]; 
    stepSpeed *= obstacleSpeedMod;
    
    if (stepSpeed <= 0) { // back up and stop
        this.teleportTo(this.loc.shiftedBy(Point2D.createFromAngleAndMagnitude(this.angle+PI,4)));
        return;
    }
    
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
    this.exploded = false;
    
    this.type = 'ball';
    this.power = {};
    this.power['ball'] = 1000;
    
    this.lastPushedByType = '';
    this.stage = 0;
    
    this.isPlaced = false;
    this.movementBegun = false;
    this.isSunk = false;
    this.justMissed = false;

    this.shape = new Circ(this.loc,5,COLOR_CHARGE['ball']);

    this.inRegion = region['course'];
    
    this.drawAngle = 0;
    
    this.RnDmovementTicks = 0;
    this.RnDmoveOrigin = this.loc.clone();
    
    this.countdownInterval = 1.5;
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
    if (this.isPlaced && (this.countdownTimer > 0)) {
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
    this.movementBegun = true;
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

    var pushTerrain = gameState.holes[gameState.currentHole].getTerrainAtPoint(this.loc).type;

    if (pushTerrain == 'trap') {
        // traps reduce power of non-wedge pushes    
        if (pushType != 'wedge') {
            if (randomReal(0,1) < .3) {
                pushPower *= .65;
            }
            else {
                pushPower *= .35;
            }
        }
    }
    else if (pushTerrain == 'water') {
        if (pushType == 'wedge') {
            pushPower *= .5;
        } else {
            pushPower *= .15;
        }
    }

    var pushDistance = pushPower*.75;
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


XGBall.prototype.checkForDeflect = function(obstacle) {

    var randnum = randomReal(0,1);

    if (obstacle.type == 'bush') {
        if (randnum < .15) {
            this.playDeflectSound();
            var speedDeltaFactor = .85;
            var travelAngleFactor = .125;
            var distanceFactor = .85;

            this.speed = this.speed * speedDeltaFactor;
            this.travelAngle = this.travelAngle * randomReal(1-travelAngleFactor,1+travelAngleFactor);
            var stageDistance = this.dest.getDistanceTo(this.loc) * distanceFactor;

            if ((this.speed < 1) || (stageDistance < 1)) {
                this.doStop();
                return;
            }

            console.log('bush: stage distance to '+stageDistance);
            console.log('bush: this.travelAngle to '+this.travelAngle);

            this.dest = this.loc.shiftedBy(Point2D.createFromAngleAndMagnitude(this.travelAngle,stageDistance));
            this.stage++;
            this.stageOrigin = this.loc.clone();
            this.lastPushedByType = '';
        
        }
    }
    else if (obstacle.type == 'tree') {
        var randnum = randomReal(0,1);

        if (randnum < .05) {
            this.playDeflectSound();
            var speedDeltaFactor = .8;
            var travelAngleFactor = .8;
            var distanceFactor = .8;

            this.speed = this.speed * speedDeltaFactor;
            this.travelAngle = this.travelAngle * randomReal(1-travelAngleFactor,1+travelAngleFactor);
            var stageDistance = this.dest.getDistanceTo(this.loc) * distanceFactor;

            if ((this.speed < 1) || (stageDistance < 1)) {
                this.doStop();
                return;
            }

            console.log('tree: stage distance to '+stageDistance);
            console.log('tree: this.travelAngle to '+this.travelAngle);

            this.dest = this.loc.shiftedBy(Point2D.createFromAngleAndMagnitude(this.travelAngle,stageDistance));
            this.stage++;
            this.stageOrigin = this.loc.clone();
            this.lastPushedByType = '';

        }

    }
    else if (obstacle.type == 'tree_trunk') {
        this.playDeflectSound();
        var speedDeltaFactor = .95;
        var distanceFactor = .95;

        this.speed = this.speed * speedDeltaFactor;
        this.travelAngle = obstacle.shape.loc.getAngleTo(this.loc) * randomReal(.9,1.1);
        var stageDistance = this.dest.getDistanceTo(this.loc) * distanceFactor;

        if ((this.speed < 1) || (stageDistance < 1)) {
            this.doStop();
            return;
        }

        console.log('trunk: stage distance to '+stageDistance);
        console.log('trunk: this.travelAngle to '+this.travelAngle);

        this.loc = obstacle.shape.loc.shiftedBy(Point2D.createFromAngleAndMagnitude(this.travelAngle,this.shape.radius+this.shape.radius+2));
        this.dest = this.loc.shiftedBy(Point2D.createFromAngleAndMagnitude(this.travelAngle,stageDistance));
        
        
        this.stage++;
        this.stageOrigin = this.loc.clone();
        this.lastPushedByType = '';
    } 
    else if (obstacle.type == 'structure') {
//        speedDeltaFactor = .2;
//        travelAngleFactor = .1;
//        distanceFactor = .2;
        console.log('TO DO: handle deflection from structures');
    } 
}


XGBall.prototype.doStop = function() {
    this.speed = 0;
    this.stage = 0;
    this.setLoc(this.dest.clone());
    this.stageOrigin = this.loc.clone();
    this.RnDmovementTicks = 0;
    this.RnDmoveOrigin = this.loc.clone();
    this.lastPushedByType = '';
}

XGBall.prototype.getCurrentHeight = function() {
    if (this.loc.eq(this.dest)) {
        return 0;
    }
    
    var arcDist = this.stageOrigin.getDistanceTo(this.dest) / 2;
    var srcDist = this.loc.getDistanceTo(this.stageOrigin);
    var destDist = this.loc.getDistanceTo(this.dest);
    
    var relDist = Math.min(srcDist,destDist);

    var heightFactor = Math.pow(relDist/arcDist,.5);

    var apex = arcDist*.3;
    if (this.lastPushedByType == 'putter') {
        apex = arcDist*.1;
    }
    else if (this.lastPushedByType == 'wedge') {
        apex = arcDist*2;
    }
    else if (this.lastPushedByType == 'iron') {
        apex = arcDist*.25;
    }
    else if (this.lastPushedByType == 'driver') {
        apex = arcDist*.55;
    }
    
    return heightFactor * apex;
    
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
            //console.log('TO DO: have the bounce at '+this.loc.toString()+' affected by the terrain');

            if (this.stage == 1) {
                console.log("RnD: stage 1 distance is "+this.stageOrigin.getDistanceTo(this.loc));
                console.log("RnD: stage 1 speed is "+this.speed);
            }
            
            var speedDeltaFactor;
            var travelAngleFactor;
            var distanceFactor;

            var bounceTerrain = gameState.holes[gameState.currentHole].getTerrainAtPoint(this.loc).type;
            if (bounceTerrain == 'water') {
                console.log('TO DO: check ball speed on water bounce to see if it skips');
                speedDeltaFactor = .04;
                travelAngleFactor = .001;
                distanceFactor = .04;
            } else
            if (bounceTerrain == 'path') {
                speedDeltaFactor = .7;
                travelAngleFactor = .04;
                distanceFactor = 1.1;
            } else
            if (bounceTerrain == 'trap') {
                speedDeltaFactor = .2;
                travelAngleFactor = .02;
                distanceFactor = .2;
            } else
            if (bounceTerrain == 'tee') {
                speedDeltaFactor = .7;
                travelAngleFactor = .0001;
                distanceFactor = .7;
            } else
            if (bounceTerrain == 'green') {
                speedDeltaFactor = .7;
                travelAngleFactor = .0001;
                distanceFactor = .7;
            } else
            if (bounceTerrain == 'fairway') {
                speedDeltaFactor = .6;
                travelAngleFactor = .005;
                distanceFactor = .6;
            } else
            if (bounceTerrain == 'rough') {
                speedDeltaFactor = .5;
                travelAngleFactor = .08;
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
            
            this.lastPushedByType = '';
            this.stage++;

            console.log("RnD: stage "+this.stage+" distance is "+stageDistance);
            console.log("RnD: stage "+this.stage+" speed is "+this.speed);
            
            if ((this.speed < 1) || (stageDistance < 1)) {
                this.doStop();
                return;
            }

            this.dest.shiftBy(Point2D.createFromAngleAndMagnitude(this.travelAngle,stageDistance));
            this.stageOrigin = this.loc.clone();
        }
        
        this.RnDmovementTicks++;
        if (this.RnDmovementTicks % 6 == 0) {
            //console.log("RnD: at ticks "+this.RnDmovementTicks+" dist is "+this.RnDmoveOrigin.getDistanceTo(this.loc));
        }

        var stepSpeed = this.speed;
        var stepDest = this.dest.clone(); 
        //var stepDistance = this.loc.getDistanceTo(stepDest);
        var travelFraction = stepSpeed / this.loc.getDistanceTo(stepDest);

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
                        '                          distance to flag: '+gameState.score.hole[gameState.currentHole].distToFlag+' ('+gameState.score.hole[gameState.currentHole].distBonus+" pts)\n"+
                        '                    time bonus: '+gameState.score.hole[gameState.currentHole].ballTimeBonus+"\n"+
                        '                    caddy bonus: '+gameState.score.hole[gameState.currentHole].caddyBonus+"\n"+
                        '                   flag bonus: '+gameState.score.hole[gameState.currentHole].flagBonus+"\n"+
                        'TOTAL: '+gameState.score.hole[gameState.currentHole].SCORE,
                        "40px Arial"
                        );
                    uiMode = 'playerAlert';
                    this.setLoc(stepDest);
                    this.doStop();
                    return;
                }
            } else {
                // else check for bush collision
                // else check for tree collision
                // else check for structure collision
                var obstacle = gameState.holes[gameState.currentHole].getObstacle(this);
                //console.log('deflecting from '+obstacle.type);
                if (obstacle.type != 'none') {
                    if (this.checkForDeflect(obstacle)) {
                        return;
                    }
                }
            }

            checkCirc.loc.x += Math.cos(this.travelAngle) * (this.shape.radius * 2);
            checkCirc.loc.y += Math.sin(this.travelAngle) * (this.shape.radius * 2);
        }

        if (this.speed < 1) {
            this.dest = this.loc.clone();
            this.doStop();
            return;
        }

        this.setLoc(stepDest);

        //console.log("RnD: at ticks "+this.RnDmovementTicks+" height is "+this.getCurrentHeight()+" for distance "+this.loc.getDistanceTo(this.stageOrigin));
    }
}

XGBall.prototype.playBounceSound = function() {
    console.log('hook for bounce sound');
}

XGBall.prototype.playDeflectSound = function() {
    console.log('hook for deflect sound');
}

XGBall.prototype.tick = function() {
    if ((this.movementBegun)  && (! this.exploded)) {
        this.countdownTimer -= this.countdownInterval;
        if (this.countdownTimer <= 0) {
            gameState.score.recordCurrentScore(gameState);
            gameState.explosions.push(new Explosion(this));
            
            this.countdownTimer = 0;
            this.exploded = true;
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

    this.launchAngle = {};
    this.launchAngle['putter'] = .1;
    this.launchAngle['wedge']  = PI/3;
    this.launchAngle['iron']   = PI/12;
    this.launchAngle['driver'] = PI/4;
    
    this.chronobarIntervals = [6,12,18,24,30,36,42,48,54];
    this.chronobars = [];
    
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

Charge.getChronobarValsOf = function(t) {
    if (t=='putter') { return {'6':20,'12':56,'18':83,'24':101,'30':113}; }
    if (t=='wedge')  { return {'6':32,'12':91,'18':112,'24':133,'30':146,'36':159,'42':172,'48':178,'54':184}; }
    if (t=='iron')   { return {'6':67,'12':178,'18':257,'24':303,'30':337,'36':361,'42':378,'48':388,'54':396}; }
    if (t=='driver') { return {'6':110,'12':265,'18':383,'24':451,'30':502,'36':538,'42':563,'48':578,'54':589}; }
    return {};
}

Charge.getChronobarLabelFor= function(i) {
    if (i==6)  { return '0.2s'; }
    if (i==12) { return '0.4s'; }
    if (i==18) { return '0.6s'; }
    if (i==24) { return '0.8s'; }
    if (i==30) { return '1.0s'; }
    if (i==36) { return '1.2s'; }
    if (i==42) { return '1.4s'; }
    if (i==48) { return '1.6s'; }
    if (i==54) { return '1.8s'; }
}

Charge.prototype.setType = function(t) {
    this.type = t;
    if (t=='putter') {
        this.chronobarIntervals = [6,12,18,24,30];
    } else {
        this.chronobarIntervals = [6,12,18,24,30,36,42,48,54];
    }
    this.shape.setColor(COLOR_CHARGE[t]);
    this.setOutline();
    this.setChronobars();
}

Charge.prototype.setOutline = function() {
    this.outlineShape = new Circ(this.loc,Explosion.getMaxRadiusFromPower(Charge.getPowerOfType(this.type)),COLOR_CHARGE_OUTLINE);
}

Charge.prototype.setChronobars = function() {
    if (this.type == 'ball') { return; }
    var vals = Charge.getChronobarValsOf(this.type);
//console.log(vals);
    this.chronobars = [];
    for (var i=0;i<this.chronobarIntervals.length;i++) {
        this.chronobars.push(new Circ(this.loc,vals[this.chronobarIntervals[i]],COLOR_GREY5));
    }
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
    for (var i=0;i<this.chronobars.length;i++) {
        this.chronobars[i].loc.x = x;
        this.chronobars[i].loc.y = y;
    }
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
            for (var i=0;i<this.chronobarIntervals.length;i++) {
                this.chronobars[i].drawStroke(this.inRegion.ul,5);
                fillText(Charge.getChronobarLabelFor(this.chronobarIntervals[i]),this.chronobars[i].loc.x+this.chronobars[i].radius,this.chronobars[i].loc.y+(12*((i%2)*2 - 1)),COLOR_BLACK,"14px Arial",'center','middle');
            }
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

    this.hole[idx].strokeBonus = 0;
    if ((this.hole[idx].strokes > 0)) {
    
        this.hole[idx].strokeBonus = h.par - this.hole[idx].strokes;

        if (this.hole[idx].strokeBonus < 0) {
            this.hole[idx].strokeBonus *= 150; 
        } else {
            if (! gs.ball.isSunk) {
                this.hole[idx].strokeBonus = this.hole[idx].strokes * -150;
            } else {
                this.hole[idx].strokeBonus += 5;
                this.hole[idx].strokeBonus = this.hole[idx].strokeBonus * this.hole[idx].strokeBonus * this.hole[idx].strokeBonus;
                this.hole[idx].strokeBonus *= 15;
            }
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

function XGHole(defStructure) {
    var w = region['course'].width;
    var h = region['course'].height;
    
    this.roughs = [new Terrain({'type':'rough','shape': new Rect(region['course'].ul,w,h,COLOR_ROUGH)})];

    this.fairways = [];
    this.tee = '';
    this.green = '';
    this.traps = [];
    this.paths = [];
    this.waters = [];

    this.bushes = [];
    this.structures = [];
    this.trees = [];

    if (defStructure === undefined) {
        this.title = 'Practice Hole';
        //this.rough = new Rough({'shape': new Rect(0,0,w,h,COLOR_ROUGH)});
        // this.fairway = new Rect(new Point2D(w*.1,h*.1),w*.8,h*.8,COLOR_FAIRWAY);
        this.fairways = [new Terrain({'type':'fairway', 'shape': new Rect(new Point2D(w*.1,h*.1),w*.8,h*.8,COLOR_FAIRWAY)})];
        this.tee = new Terrain({'type':'tee', 'shape': new Rect(new Point2D(w*.1+180,h*.5-60),120,120,COLOR_TEE)});
        this.green = new Terrain({'type':'green', 'shape': new Rect(new Point2D(w*.9-300,h*.5-90),180,180,COLOR_GREEN)});
        this.traps = [new Terrain({'type':'trap', 'shape': new Rect(new Point2D(w*.5,h*.5-90),90,180,COLOR_SAND)})];
        this.paths = [];
        this.waters = [];

    //    this.tee = new Rect(new Point2D(w*.1+180,h*.5-60),120,120,COLOR_TEE);
    //    this.green = new Rect(new Point2D(w*.9-300,h*.5-90),180,180,COLOR_GREEN);

        this.flag = new TargetFlag(w*.9-200,h*.5-40);
        this.bushes = [];
        this.structures = [];
        this.trees = [];

        this.par = 3;
        this.startingCaddyVals = {'putter':8,'wedge':3,'iron':4,'driver':3};
    } else {
        var defKeys = Object.keys(defStructure);
        for (var iKey=0;iKey<defKeys.length;++iKey) {
            var defKey = defKeys[iKey];
            if (defKey == 'title') {
                this.title = defStructure[defKey];
            }
            else if (defKey == 'par') {
                this.par = defStructure[defKey];
            }
            else if (defKey == 'flag') {
                var xy = defStructure[defKey].split(',');
                this.flag = new TargetFlag(xy[0]*1,xy[1]*1);
            }
            else if (defKey == 'startingCaddyVals') {
                this.startingCaddyVals = {'putter':defStructure[defKey]['putter'],
                                          'wedge':defStructure[defKey]['wedge'],
                                          'iron':defStructure[defKey]['iron'],
                                          'driver':defStructure[defKey]['driver']
                                          };
            }
            else if (defKey == 'fairways') {
                this.fairways = [];
                for (var i=0;i<defStructure[defKey].length;++i) {
                    this.fairways.push(new Terrain({'type':'fairway', 'shape': Polygon.createFromString(defStructure[defKey][i])}));
                }
            }
            else if (defKey == 'tee') {
                this.tee = new Terrain({'type':'tee', 'shape': Polygon.createFromString(defStructure[defKey])});
            }
            else if (defKey == 'green') {
                this.green = new Terrain({'type':'green', 'shape': Polygon.createFromString(defStructure[defKey])});
            }
            else if (defKey == 'traps') {
                this.traps = [];
                for (var i=0;i<defStructure[defKey].length;++i) {
                    this.traps.push(new Terrain({'type':'trap', 'shape': Polygon.createFromString(defStructure[defKey][i])}));
                }
            }
            else if (defKey == 'paths') {
                this.paths = [];
                for (var i=0;i<defStructure[defKey].length;++i) {
                    this.paths.push(new Terrain({'type':'path', 'shape': Polygon.createFromString(defStructure[defKey][i])}));
                }
            }
            else if (defKey == 'waters') {
                this.waters = [];
                for (var i=0;i<defStructure[defKey].length;++i) {
                    this.waters.push(new Terrain({'type':'water', 'shape': Polygon.createFromString(defStructure[defKey][i])}));
                }
            }
            else if (defKey == 'bushes') {
                this.bushes = [];
                for (var i=0;i<defStructure[defKey].length;++i) {
                    this.bushes.push(new Obstacle({'type':'bush', 'lowerHeight':0,'upperHeight':11,'shape': Circ.createFromString(defStructure[defKey][i])}));
                }
            }
            else if (defKey == 'trees') {
                this.trees = [];
                for (var i=0;i<defStructure[defKey].length;++i) {
                    this.trees.push(new Obstacle({'type':'tree', 'lowerHeight':17.5,'upperHeight':63,'shape': Circ.createFromString(defStructure[defKey][i])}));
                }
            }

            // TEMPORARY
            console.log('TODO: implement structure obstacles in hole definition/creation');

        }


    }
    this.inRegion = region['course'];
    

    this.terrainHierarchy = ['paths', 'waters', 'traps', 'tee', 'green', 'fairways', 'roughs'];
    this.obstacleHierarchy = ['tree_trunk', 'structures', 'bushes', 'tree_foliage'];
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

XGHole.prototype.getObstacle = function(obj_or_p) {
    if (obj_or_p.type == 'point') {

        var p = obj_or_p;
        for (var i=0;i<this.obstacleHierarchy.length;++i) {
            if (this.obstacleHierarchy[i] == 'tree_trunk') {
                for (var j=0;j<this.trees.length;++j) {
                    if (this.trees[j].trunk.containsPt(p)) { return this.trees[j].trunk; };
                }
            } 
            else if (this.obstacleHierarchy[i] == 'tree_foliage') {
                for (var j=0;j<this.trees.length;++j) {
                    if (this.trees[j].containsPt(p)) { return this.trees[j]; };
                }
            }
            else {
                for (var j=0;j<this[this.terrainHierarchy[i]].length;++j) {
                    //console.log("checking point in terrain "+this[this.terrainHierarchy[i]][j].toString());
                    if (this[this.terrainHierarchy[i]][j].containsPt(p)) { return this[this.terrainHierarchy[i]][j]; };
                }
            }
        }
    
    } else {
        var obj = obj_or_p;
        var h = 1;
        if (obj.getCurrentHeight !== undefined) {
            h=obj.getCurrentHeight();
        }
        for (var i=0;i<this.obstacleHierarchy.length;++i) {
            if (this.obstacleHierarchy[i] == 'tree_trunk') {
                for (var j=0;j<this.trees.length;++j) {
                    if ((h >= this.trees[j].trunk.lowerHeight) && (h <= this.trees[j].trunk.upperHeight) && (Shape.checkIfShapeIntersect(obj.shape,this.trees[j].trunk.shape))) {
                        return this.trees[j].trunk;
                    };
                }
            } 
            else if (this.obstacleHierarchy[i] == 'tree_foliage') {
                for (var j=0;j<this.trees.length;++j) {
                    if ((h >= this.trees[j].lowerHeight) && (h <= this.trees[j].upperHeight) && (Shape.checkIfShapeIntersect(obj.shape,this.trees[j].shape))) {
                        return this.trees[j];
                    };
                }
            }
            else {
                for (var j=0;j<this[this.obstacleHierarchy[i]].length;++j) {
                    //console.log('checking intersect of '+obj.type+' against '+this[this.obstacleHierarchy[i]][j].shape.toString());
                    if ((h >= this[this.obstacleHierarchy[i]][j].lowerHeight) && (h <= this[this.obstacleHierarchy[i]][j].upperHeight) && (Shape.checkIfShapeIntersect(obj.shape,this[this.obstacleHierarchy[i]][j].shape))) {
                        return this[this.obstacleHierarchy[i]][j];
                    };
                }
            }
        }

    }
    
    return {'type':'none'};
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

    for (var i=0;i<this.waters.length;++i) {
        this.waters[i].draw(); //drawFill(this.inRegion.ul);
    }

    for (var i=0;i<this.paths.length;++i) {
        this.paths[i].draw(); //drawFill(this.inRegion.ul);
    }

}

XGHole.prototype.drawLowObjects = function() {
    // flag
    // bushes
    this.flag.draw(); 
    
    for (var i=0;i<this.bushes.length;++i) {
        this.bushes[i].draw();
    }
}

XGHole.prototype.drawHighObjects = function() {
    // structures
    // trees
    for (var i=0;i<this.structures.length;++i) {
        this.structures[i].draw();
    }
    for (var i=0;i<this.trees.length;++i) {
        this.trees[i].draw();
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
    fillText((this.ball.countdownTimer / (30*this.ball.countdownInterval)).toFixed(2)+' seconds left until the ball explodes',
             this.timerTextLoc.x,this.timerTextLoc.y,((this.ball.isPlaced)?(COLOR_BLACK):(COLOR_GREY5)),'40px Arial','center','middle');

    if (this.ball.movementBegun) {
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
    //console.log('drawing terrain '+this.type+' with basis '+this.inRegion.ul.toString());
    if ((this.type == 'fairway') || (this.type == 'green') || (this.type == 'trap') || (this.type == 'path') || (this.type == 'water')) {
        this.shape.drawFillSpline(this.inRegion.ul);
    }
    else {
        this.shape.drawFill(this.inRegion.ul);
    }
}

//--------------//----------------

function Obstacle(inits) {
    
    if (inits === undefined) {
        inits = {
            'type': 'rough',
            'shape': new Circ(region['course'].getCenter(),region['course'].height*.1,COLOR_FOLIAGE),
            'inRegion': region['course'],
            'lowerHeight': 0,
            'upperHeight': 99999,
        };
    }

    this.inRegion = (inits.inRegion === undefined) ? region['course'] : inits.inRegion;

    this.type = inits.type;;
    this.shape = inits.shape;
    
    this.lowerHeight = inits.lowerHeight;
    this.upperHeight = inits.upperHeight;

    if (this.type == 'tree') {
        this.crownType = randomInteger(1,3);
        this.crownAngle = randomReal(0,2*PI);
        this.trunk = new Obstacle({'type':'tree_trunk','lowerHeight':0,'upperHeight':75,'shape':new Circ(this.shape.loc,this.shape.radius*.2,COLOR_TRUNK)});
    } 
    else if (this.type == 'tree_trunk') {
        this.trunkAngle = randomReal(0,2*PI);
    }
    else if (this.type == 'bush') {
        this.foliageType = randomInteger(1,3);
        this.foliageAngle = randomReal(0,2*PI);
    }

}

Obstacle.prototype.containsPt = function(p) {
    return this.shape.containsPt(p);
}

Obstacle.prototype.toString = function() {
    return this.type+"-"+this.shape.toString();
}


Obstacle.prototype.draw = function() {
    //console.log('drawing obstacle '+this.type+' with basis '+this.inRegion.ul.toString());
    if (this.type == 'tree') {
        this.trunk.draw();
        if (this.crownType == 1) {
            drawTransformedImage(treeCrownImg1,
                                 this.shape.loc.x+this.inRegion.ul.x,this.shape.loc.y+this.inRegion.ul.y,
                                 this.crownAngle,
                                 this.shape.radius/56,this.shape.radius/56);
        }
        else if (this.crownType == 2) {
            drawTransformedImage(treeCrownImg2,
                                 this.shape.loc.x+this.inRegion.ul.x,this.shape.loc.y+this.inRegion.ul.y,
                                 this.crownAngle,
                                 this.shape.radius/56,this.shape.radius/56);
        }
        else { // if (this.crownType == 3)
            drawTransformedImage(treeCrownImg3,
                                 this.shape.loc.x+this.inRegion.ul.x,this.shape.loc.y+this.inRegion.ul.y,
                                 this.crownAngle,
                                 this.shape.radius/56,this.shape.radius/56);
        }
    } 
    else if (this.type == 'tree_trunk') {
        drawTransformedImage(treeTrunkImg,
                             this.shape.loc.x+this.inRegion.ul.x,this.shape.loc.y+this.inRegion.ul.y,
                             this.trunkAngle,
                             this.shape.radius/64,this.shape.radius/64);
    }
    else if (this.type == 'bush') {
        if (this.foliageType == 1) {
            drawTransformedImage(bushImg1,
                                 this.shape.loc.x+this.inRegion.ul.x,this.shape.loc.y+this.inRegion.ul.y,
                                 this.foliageAngle,
                                 this.shape.radius/28,this.shape.radius/28);
        }
        else if (this.foliageType == 2) {
            drawTransformedImage(bushImg2,
                                 this.shape.loc.x+this.inRegion.ul.x,this.shape.loc.y+this.inRegion.ul.y,
                                 this.foliageAngle,
                                 this.shape.radius/28,this.shape.radius/28);
        }
        else { // if (this.foliageType == 3)
            drawTransformedImage(bushImg3,
                                 this.shape.loc.x+this.inRegion.ul.x,this.shape.loc.y+this.inRegion.ul.y,
                                 this.foliageAngle,
                                 this.shape.radius/28,this.shape.radius/28);
        }
    }
    else {
        this.shape.drawFill(this.inRegion.ul);
    }
}

//--------------//----------------
//--------------//----------------

function GameState() {
    this._initialize();
}

GameState.prototype._initialize = function() {
    this.score = new ScoreCard();
    this.holes = [new XGHole(h0), new XGHole(h1),new XGHole(h2), new XGHole(h3)]; // of XGHole objects
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
    this.ball = new XGBall();
    this.ballControl = new BallControl(this.ball);
    this.caddy.setContents(1,curHole.startingCaddyVals['putter']
                            ,curHole.startingCaddyVals['wedge']
                            ,curHole.startingCaddyVals['iron']
                            ,curHole.startingCaddyVals['driver']);    
    this.avatar.teleportTo(curHole.tee.shape.getCenter());

    this.ball.isPlaced = false;
    this.ball.isSunk = false;
    this.ball.movementBegun = false;
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
// HOLE DEFINITIONS
//--------------//----------------
//--------------//----------------
//--------------//----------------

var hTest = {
'title':'Testing Hole',
'par':3,
'startingCaddyVals': {'putter':4,'wedge':3,'iron':2,'driver':1},
'fairways':['(polygon <71,131;778,917;1457,721;423,195> rgba(128, 153, 51, 1))'],
'tee':'(polygon <91,224;153,161;208,216;141,270> rgba(128, 179, 77, 1))',
'green':'(polygon <1221,492;1167,685;1354,570;1253,488> rgba(153, 204, 77, 1))',
'flag':'1290,600',
'traps':[],
'paths':[],
'waters':[]
};


var h0 = {
'title':'Pollywog',
'par':4,
'startingCaddyVals': {'putter':5,'wedge':3,'iron':3,'driver':1},
'fairways':['(polygon <71,131;54,163;56,199;58,250;60,310;85,371;107,427;133,467;208,514;264,582;292,703;326,762;401,790;477,826;540,836;608,846;667,874;733,905;778,917;868,941;967,949;1034,947;1106,939;1253,955;1314,943;1370,923;1398,886;1441,824;1455,758;1457,721;1471,631;1447,574;1428,528;1406,465;1328,427;1225,429;1148,425;1084,419;1025,375;989,355;923,330;824,290;725,278;663,290;602,282;546,246;475,214;423,195;373,169;292,141;210,131;153,121;123,117;79,123> rgba(128, 153, 51, 1))'],
'tee':'(polygon <91,224;153,161;208,216;141,270> rgba(128, 179, 77, 1))',
'green':'(polygon <1221,492;1203,492;1185,498;1162,508;1140,518;1114,530;1108,554;1112,586;1112,616;1120,639;1140,665;1167,685;1199,695;1245,701;1283,695;1310,681;1342,661;1360,625;1360,600;1354,570;1338,540;1326,514;1308,500;1271,488;1253,488> rgba(153, 204, 77, 1))',
'flag':'1290,600',
'traps':['(polygon <762,375;802,385;840,395;893,407;927,421;961,441;981,467;985,504;965,514;915,512;878,502;842,471;818,447;790,425;760,409;751,391;756,377> rgba(204, 179, 77, 1))',
         '(polygon <780,552;792,566;810,584;828,594;866,610;893,614;917,621;945,621;949,600;943,570;919,554;882,538;840,536;816,532;786,532;780,532> rgba(204, 179, 77, 1))',
         '(polygon <357,619;340,627;328,645;320,667;326,693;353,731;379,743;425,737;451,705;443,657;431,629;407,612;373,608> rgba(204, 179, 77, 1))'],
'paths':['(polygon <54,262;48,274;56,290;81,306;101,316;133,332;145,345;151,363;159,383;159,405;157,421;155,433;149,447;159,459;179,471;201,477;232,477;256,484;264,504;262,534;258,558;252,582;254,610;256,631;268,661;274,693;278,735;302,772;320,794;365,834;403,850;427,862;490,886;530,899;564,903;629,913;655,921;671,923;713,923;749,933;808,941;850,947;888,955;919,963;961,969;1015,963;1050,955;1088,959;1134,963;1177,971;1219,977;1261,983;1320,975;1362,965;1398,949;1412,937;1430,913;1434,890;1438,846;1449,818;1471,788;1471,756;1471,727;1459,721;1438,731;1436,745;1436,768;1424,800;1414,826;1406,858;1400,878;1394,897;1370,913;1348,921;1314,925;1279,927;1253,929;1227,933;1173,931;1138,929;1104,919;1078,915;1052,915;1021,917;997,923;973,931;939,929;905,925;872,915;838,911;808,905;782,899;753,890;725,884;697,884;669,880;649,874;623,868;592,866;560,858;522,844;500,836;482,836;429,826;403,816;381,804;363,788;349,776;336,762;322,743;312,725;300,697;298,665;288,641;288,623;274,594;266,582;276,544;278,530;288,516;292,502;294,484;288,469;270,463;242,457;228,455;212,449;193,443;189,441;185,425;181,411;175,391;177,371;177,353;171,330;159,314;143,302;129,292;113,284;93,278;85,274;71,264;64,258;64,258> rgba(77, 77, 77, 1))'],
'waters':['(polygon <36,304;48,310;71,314;93,320;115,330;149,363;155,397;153,419;143,443;161,471;199,486;228,488;254,514;256,554;246,584;230,606;177,637;139,645;101,627;87,590;81,554;97,524;85,502;62,477;48,445;68,415;81,395;62,371;38,345;30,322;28,308> rgba(153, 204, 230, 1))'],
'bushes':['(circ <492,561>#20 rgba(51, 102, 26, 0.7))',
          '(circ <471,592>#17 rgba(51, 102, 26, 0.7))',
          '(circ <516,541>#16 rgba(51, 102, 26, 0.7))',
          '(circ <514,573>#14 rgba(51, 102, 26, 0.7))',
          '(circ <545,568>#19 rgba(51, 102, 26, 0.7))'],
'trees':['(circ <147,796>#67 rgba(51, 102, 26, 0.7))',
'(circ <203,854>#76 rgba(51, 102, 26, 0.7))',
'(circ <109,888>#90 rgba(51, 102, 26, 0.7))',
'(circ <330,903>#77 rgba(51, 102, 26, 0.7))',
'(circ <1136,997>#104 rgba(51, 102, 26, 0.7))',
'(circ <1237,862>#109 rgba(51, 102, 26, 0.7))',
'(circ <1017,901>#80 rgba(51, 102, 26, 0.7))',
'(circ <1086,872>#74 rgba(51, 102, 26, 0.7))',
'(circ <1326,40>#133 rgba(51, 102, 26, 0.7))',
'(circ <1392,201>#61 rgba(51, 102, 26, 0.7))',
'(circ <1457,131>#104 rgba(51, 102, 26, 0.7))',
'(circ <1432,252>#77 rgba(51, 102, 26, 0.7))',
'(circ <286,34>#132 rgba(51, 102, 26, 0.7))',
'(circ <411,68>#122 rgba(51, 102, 26, 0.7))',
'(circ <328,101>#51 rgba(51, 102, 26, 0.7))',
'(circ <786,212>#142 rgba(51, 102, 26, 0.7))',
'(circ <52,407>#89 rgba(51, 102, 26, 0.7))',
'(circ <77,633>#74 rgba(51, 102, 26, 0.7))',
'(circ <596,943>#115 rgba(51, 102, 26, 0.7))',
'(circ <1434,941>#104 rgba(51, 102, 26, 0.7))',
'(circ <1459,669>#115 rgba(51, 102, 26, 0.7))',
'(circ <1495,838>#46 rgba(51, 102, 26, 0.7))',
'(circ <1511,905>#72 rgba(51, 102, 26, 0.7))',
'(circ <1511,999>#65 rgba(51, 102, 26, 0.7))',
'(circ <1050,42>#105 rgba(51, 102, 26, 0.7))',
'(circ <933,268>#83 rgba(51, 102, 26, 0.7))']
};

var h1 = {
'title':'The Red Book',
'par':6,
'startingCaddyVals': {'putter':5,'wedge':4,'iron':4,'driver':2},
'fairways':['(polygon <107,153;129,57;179,35;269,21;440,24;643,78;775,172;1035,191;1248,182;1364,282;1425,426;1393,600;1448,774;1420,923;1258,991;1095,976;780,974;556,992;408,875;276,795;116,819;66,564;170,506;337,460;526,541;624,682;790,717;1065,721;1133,606;1064,478;861,487;669,471;534,342;354,247;216,291;145,232> rgba(128, 153, 51, 1))'],
'tee':'(polygon <235,158;251,57;166,46;143,137> rgba(128, 179, 77, 1))',
'green':'(polygon <237,751;204,722;178,637;211,599;291,595;362,618;356,695;341,760> rgba(153, 204, 77, 1))',
'flag':'260,675',
'traps':['(polygon <445,518;440,550;457,575;494,591;520,611;547,609;530,549;487,520> rgba(204, 179, 77, 1))',
         '(polygon <1011,462;1009,492;1052,521;1078,540;1111,540;1138,534;1130,485;1076,455;1033,447> rgba(204, 179, 77, 1))',
         '(polygon <1247,271;1258,372;1315,436;1366,418;1302,340> rgba(204, 179, 77, 1))',
         '(polygon <772,946;737,897;751,859;793,845;842,856;873,885;884,915> rgba(204, 179, 77, 1))'],
'paths':['(polygon <172,17;237,6;297,6;402,7;473,13;563,18;634,18;695,11;734,12;786,34;845,46;907,58;963,65;1041,68;1091,66;1146,67;1233,84;1287,105;1347,136;1405,180;1442,232;1476,311;1478,360;1488,413;1489,464;1498,525;1498,570;1501,613;1497,670;1484,723;1492,781;1496,809;1484,873;1465,945;1452,960;1435,978;1420,995;1380,1011;1337,1020;1199,1009;1108,1007;1033,1005;957,1005;887,1003;789,1013;708,1009;669,996;611,996;576,995;504,989;448,984;414,970;362,960;309,945;264,924;227,905;202,867;193,847;183,819;182,799;188,783;217,774;242,779;255,793;256,814;257,839;263,861;274,873;291,888;314,904;346,926;367,932;418,946;442,951;467,956;487,957;520,958;540,959;579,960;608,956;631,958;663,960;681,963;700,965;720,971;747,974;795,974;821,972;867,973;941,967;969,964;986,957;1032,956;1070,959;1103,961;1130,959;1170,963;1201,964;1233,965;1261,967;1297,970;1320,974;1352,970;1383,958;1394,941;1407,917;1419,907;1433,877;1440,851;1436,825;1427,801;1422,770;1420,749;1420,731;1426,710;1442,662;1442,650;1444,628;1450,608;1445,564;1442,537;1432,497;1427,472;1426,459;1432,428;1431,400;1429,367;1424,337;1405,306;1399,285;1393,267;1379,238;1360,208;1351,196;1332,177;1299,158;1271,147;1213,143;1182,142;1148,140;1111,134;1077,118;1058,112;1022,112;983,119;933,122;869,114;848,107;802,88;772,78;746,71;705,65;663,66;641,61;600,63;566,64;521,65;459,58;415,50;383,42;328,32;289,29;268,31;237,35;223,41;217,44;191,41> rgba(77, 77, 77, 1))'],
'waters':['(polygon <214,289;210,310;215,353;230,370;258,385;303,393;341,395;374,403;426,412;465,429;497,455;532,466;573,440;583,408;578,375;550,337;520,315;486,294;439,273;390,256;365,254;326,251;280,251;252,261;231,276> rgba(153, 204, 230, 1))',
          '(polygon <573,580;570,600;583,632;600,658;618,683;642,692;672,701;707,707;739,707;761,707;809,700;821,683;825,661;819,621;808,597;786,570;750,543;716,532;684,518;638,506;606,508;588,520;570,532> rgba(153, 204, 230, 1))',
          '(polygon <534,453;554,461;564,481;572,495;577,505;583,527;582,538;586,549;612,550;618,543;613,520;604,499;589,474;572,459;563,439;559,420;552,409;537,421> rgba(153, 204, 230, 1))',
          '(polygon <211,334;202,342;170,354;133,357;117,357;90,354;60,370;52,394;52,419;46,453;46,480;54,507;58,525;41,545;84,531;110,520;134,519;153,506;156,474;165,453;183,441;204,434;222,422;234,407;221,388;217,370;223,357;227,355> rgba(153, 204, 230, 1))',
          '(polygon <825,665;838,671;858,674;879,675;900,677;926,670;952,638;957,619;958,595;960,573;971,549;989,531;1019,523;1057,537;1081,560;1098,596;1103,632;1100,662;1062,691;1022,703;990,709;957,715;927,718;887,721;856,705;828,703;792,704;782,703> rgba(153, 204, 230, 1))'],
'bushes':['(circ <632,70>#17 rgba(51, 102, 26, 0.7))',
'(circ <645,87>#21 rgba(51, 102, 26, 0.7))',
'(circ <671,105>#14 rgba(51, 102, 26, 0.7))',
'(circ <701,119>#34 rgba(51, 102, 26, 0.7))',
'(circ <636,433>#26 rgba(51, 102, 26, 0.7))',
'(circ <619,461>#13 rgba(51, 102, 26, 0.7))',
'(circ <29,436>#16 rgba(51, 102, 26, 0.7))',
'(circ <211,291>#23 rgba(51, 102, 26, 0.7))',
'(circ <177,329>#16 rgba(51, 102, 26, 0.7))',
'(circ <139,346>#15 rgba(51, 102, 26, 0.7))',
'(circ <88,228>#23 rgba(51, 102, 26, 0.7))',
'(circ <54,215>#30 rgba(51, 102, 26, 0.7))',
'(circ <106,190>#7 rgba(51, 102, 26, 0.7))',
'(circ <134,243>#24 rgba(51, 102, 26, 0.7))',
'(circ <140,186>#18 rgba(51, 102, 26, 0.7))',
'(circ <106,87>#16 rgba(51, 102, 26, 0.7))',
'(circ <171,24>#5 rgba(51, 102, 26, 0.7))',
'(circ <597,71>#8 rgba(51, 102, 26, 0.7))',
'(circ <565,72>#13 rgba(51, 102, 26, 0.7))',
'(circ <932,188>#22 rgba(51, 102, 26, 0.7))',
'(circ <864,190>#21 rgba(51, 102, 26, 0.7))',
'(circ <904,201>#12 rgba(51, 102, 26, 0.7))',
'(circ <917,123>#24 rgba(51, 102, 26, 0.7))',
'(circ <879,112>#14 rgba(51, 102, 26, 0.7))',
'(circ <774,172>#6 rgba(51, 102, 26, 0.7))',
'(circ <1092,40>#17 rgba(51, 102, 26, 0.7))',
'(circ <1105,140>#36 rgba(51, 102, 26, 0.7))',
'(circ <1235,59>#27 rgba(51, 102, 26, 0.7))',
'(circ <1233,155>#17 rgba(51, 102, 26, 0.7))',
'(circ <1279,162>#22 rgba(51, 102, 26, 0.7))',
'(circ <1337,191>#21 rgba(51, 102, 26, 0.7))',
'(circ <1304,185>#18 rgba(51, 102, 26, 0.7))',
'(circ <1337,236>#12 rgba(51, 102, 26, 0.7))',
'(circ <1360,269>#32 rgba(51, 102, 26, 0.7))',
'(circ <383,901>#23 rgba(51, 102, 26, 0.7))',
'(circ <426,920>#9 rgba(51, 102, 26, 0.7))',
'(circ <411,884>#23 rgba(51, 102, 26, 0.7))',
'(circ <432,900>#19 rgba(51, 102, 26, 0.7))',
'(circ <413,932>#9 rgba(51, 102, 26, 0.7))',
'(circ <337,967>#38 rgba(51, 102, 26, 0.7))',
'(circ <392,995>#29 rgba(51, 102, 26, 0.7))',
'(circ <451,1004>#10 rgba(51, 102, 26, 0.7))',
'(circ <477,1002>#21 rgba(51, 102, 26, 0.7))',
'(circ <429,996>#9 rgba(51, 102, 26, 0.7))',
'(circ <533,1007>#3 rgba(51, 102, 26, 0.7))',
'(circ <228,993>#14 rgba(51, 102, 26, 0.7))',
'(circ <307,1012>#8 rgba(51, 102, 26, 0.7))',
'(circ <236,923>#11 rgba(51, 102, 26, 0.7))',
'(circ <20,986>#29 rgba(51, 102, 26, 0.7))',
'(circ <29,788>#55 rgba(51, 102, 26, 0.7))',
'(circ <34,591>#22 rgba(51, 102, 26, 0.7))',
'(circ <72,541>#24 rgba(51, 102, 26, 0.7))',
'(circ <134,520>#19 rgba(51, 102, 26, 0.7))',
'(circ <241,251>#22 rgba(51, 102, 26, 0.7))',
'(circ <290,243>#14 rgba(51, 102, 26, 0.7))',
'(circ <323,250>#12 rgba(51, 102, 26, 0.7))',
'(circ <353,248>#13 rgba(51, 102, 26, 0.7))',
'(circ <378,254>#5 rgba(51, 102, 26, 0.7))',
'(circ <268,248>#7 rgba(51, 102, 26, 0.7))',
'(circ <172,282>#17 rgba(51, 102, 26, 0.7))',
'(circ <558,565>#23 rgba(51, 102, 26, 0.7))',
'(circ <855,710>#6 rgba(51, 102, 26, 0.7))',
'(circ <1028,512>#15 rgba(51, 102, 26, 0.7))',
'(circ <1101,665>#37 rgba(51, 102, 26, 0.7))',
'(circ <1114,649>#27 rgba(51, 102, 26, 0.7))',
'(circ <980,717>#17 rgba(51, 102, 26, 0.7))',
'(circ <1360,960>#29 rgba(51, 102, 26, 0.7))',
'(circ <1433,848>#12 rgba(51, 102, 26, 0.7))',
'(circ <1414,866>#22 rgba(51, 102, 26, 0.7))',
'(circ <947,1010>#7 rgba(51, 102, 26, 0.7))',
'(circ <982,1010>#16 rgba(51, 102, 26, 0.7))',
'(circ <856,950>#7 rgba(51, 102, 26, 0.7))',
'(circ <868,931>#20 rgba(51, 102, 26, 0.7))',
'(circ <886,954>#12 rgba(51, 102, 26, 0.7))',
'(circ <866,959>#5 rgba(51, 102, 26, 0.7))',
'(circ <840,941>#15 rgba(51, 102, 26, 0.7))',
'(circ <809,945>#11 rgba(51, 102, 26, 0.7))',
'(circ <445,499>#14 rgba(51, 102, 26, 0.7))',
'(circ <425,508>#13 rgba(51, 102, 26, 0.7))',
'(circ <420,478>#7 rgba(51, 102, 26, 0.7))',
'(circ <442,446>#15 rgba(51, 102, 26, 0.7))',
'(circ <419,448>#7 rgba(51, 102, 26, 0.7))',
'(circ <1313,229>#16 rgba(51, 102, 26, 0.7))',
'(circ <1313,260>#24 rgba(51, 102, 26, 0.7))',
'(circ <1327,287>#11 rgba(51, 102, 26, 0.7))',
'(circ <1358,307>#13 rgba(51, 102, 26, 0.7))',
'(circ <1384,304>#21 rgba(51, 102, 26, 0.7))',
'(circ <1373,327>#10 rgba(51, 102, 26, 0.7))',
'(circ <1346,324>#11 rgba(51, 102, 26, 0.7))',
'(circ <1321,316>#7 rgba(51, 102, 26, 0.7))'],
'trees':['(circ <258,408>#12 rgba(51, 102, 26, 0.7))',
'(circ <290,432>#63 rgba(51, 102, 26, 0.7))',
'(circ <390,439>#93 rgba(51, 102, 26, 0.7))',
'(circ <494,485>#40 rgba(51, 102, 26, 0.7))',
'(circ <546,471>#24 rgba(51, 102, 26, 0.7))',
'(circ <667,490>#47 rgba(51, 102, 26, 0.7))',
'(circ <729,87>#79 rgba(51, 102, 26, 0.7))',
'(circ <815,139>#56 rgba(51, 102, 26, 0.7))',
'(circ <762,140>#38 rgba(51, 102, 26, 0.7))',
'(circ <145,289>#96 rgba(51, 102, 26, 0.7))',
'(circ <63,304>#68 rgba(51, 102, 26, 0.7))',
'(circ <32,341>#40 rgba(51, 102, 26, 0.7))',
'(circ <8,386>#28 rgba(51, 102, 26, 0.7))',
'(circ <35,360>#29 rgba(51, 102, 26, 0.7))',
'(circ <61,335>#24 rgba(51, 102, 26, 0.7))',
'(circ <34,284>#107 rgba(51, 102, 26, 0.7))',
'(circ <44,129>#71 rgba(51, 102, 26, 0.7))',
'(circ <72,22>#69 rgba(51, 102, 26, 0.7))',
'(circ <144,26>#26 rgba(51, 102, 26, 0.7))',
'(circ <114,65>#26 rgba(51, 102, 26, 0.7))',
'(circ <91,168>#65 rgba(51, 102, 26, 0.7))',
'(circ <179,454>#73 rgba(51, 102, 26, 0.7))',
'(circ <219,365>#56 rgba(51, 102, 26, 0.7))',
'(circ <38,403>#40 rgba(51, 102, 26, 0.7))',
'(circ <285,406>#10 rgba(51, 102, 26, 0.7))',
'(circ <354,409>#39 rgba(51, 102, 26, 0.7))',
'(circ <44,523>#69 rgba(51, 102, 26, 0.7))',
'(circ <107,895>#112 rgba(51, 102, 26, 0.7))',
'(circ <177,952>#57 rgba(51, 102, 26, 0.7))',
'(circ <268,963>#42 rgba(51, 102, 26, 0.7))',
'(circ <332,845>#63 rgba(51, 102, 26, 0.7))',
'(circ <60,689>#82 rgba(51, 102, 26, 0.7))',
'(circ <114,761>#46 rgba(51, 102, 26, 0.7))',
'(circ <877,571>#136 rgba(51, 102, 26, 0.7))',
'(circ <742,503>#46 rgba(51, 102, 26, 0.7))',
'(circ <978,475>#57 rgba(51, 102, 26, 0.7))',
'(circ <866,517>#23 rgba(51, 102, 26, 0.7))',
'(circ <844,639>#53 rgba(51, 102, 26, 0.7))',
'(circ <551,513>#43 rgba(51, 102, 26, 0.7))',
'(circ <593,432>#43 rgba(51, 102, 26, 0.7))',
'(circ <1337,81>#89 rgba(51, 102, 26, 0.7))',
'(circ <1463,118>#50 rgba(51, 102, 26, 0.7))',
'(circ <1422,162>#68 rgba(51, 102, 26, 0.7))',
'(circ <1016,138>#88 rgba(51, 102, 26, 0.7))',
'(circ <895,162>#36 rgba(51, 102, 26, 0.7))',
'(circ <1473,959>#104 rgba(51, 102, 26, 0.7))',
'(circ <1423,588>#91 rgba(51, 102, 26, 0.7))',
'(circ <1433,516>#37 rgba(51, 102, 26, 0.7))',
'(circ <1035,708>#56 rgba(51, 102, 26, 0.7))',
'(circ <1111,573>#57 rgba(51, 102, 26, 0.7))',
'(circ <612,500>#72 rgba(51, 102, 26, 0.7))']
};


var h2 = {
'title':'The Spike',
'par':4,
'startingCaddyVals': {'putter':3,'wedge':2,'iron':2,'driver':1},
'fairways': ['(polygon <82,831;287,444;503,137;827,117;1140,87;1396,96;1463,350;1429,596;1131,460;581,672;230,895> rgba(128, 153, 51, 1))'],
'tee':'(polygon <158,756;252,815;212,869;121,833> rgba(128, 179, 77, 1))',
'green':'(polygon <1246,428;1269,343;1413,365;1410,467;1345,507> rgba(153, 204, 77, 1))',
'flag':'1261,450',
'traps':['(polygon <500,307;508,178;673,156;708,249;645,289;896,446;713,297> rgba(204, 179, 77, 1))',
         '(polygon <980,415;1025,308;1141,359> rgba(204, 179, 77, 1))'],
'paths':['(polygon <237,870;333,807;359,748;429,673;463,631;517,641;597,607;657,575;730,563;821,539;892,511;972,475;1052,459;1124,448;1178,452;1233,455;1228,427;1129,431;1065,439;988,456;901,481;783,525;702,545;622,572;550,601;489,609;439,617;391,659;372,696;332,748;303,767;256,821;241,840> rgba(77, 77, 77, 1))'],
'waters':['(polygon <456,751;544,636;849,533;1067,461;1217,484;1215,663> rgba(153, 204, 230, 1))'],
'bushes':['(circ <1374,570>#45 rgba(51, 102, 26, 0.7))',
    '(circ <1215,492>#35 rgba(51, 102, 26, 0.7))',
    '(circ <473,670>#41 rgba(51, 102, 26, 0.7))',
    '(circ <380,788>#43 rgba(51, 102, 26, 0.7))',
    '(circ <428,852>#42 rgba(51, 102, 26, 0.7))',
    '(circ <506,820>#29 rgba(51, 102, 26, 0.7))',
    '(circ <533,770>#39 rgba(51, 102, 26, 0.7))',
    '(circ <347,862>#15 rgba(51, 102, 26, 0.7))',
    '(circ <843,774>#45 rgba(51, 102, 26, 0.7))',
    '(circ <884,885>#96 rgba(51, 102, 26, 0.7))',
    '(circ <840,996>#27 rgba(51, 102, 26, 0.7))',
    '(circ <352,903>#94 rgba(51, 102, 26, 0.7))',
    '(circ <440,939>#23 rgba(51, 102, 26, 0.7))',
    '(circ <667,276>#32 rgba(51, 102, 26, 0.7))'],
'trees':['(circ <448,760>#83 rgba(51, 102, 26, 0.7))',
    '(circ <267,160>#138 rgba(51, 102, 26, 0.7))',
    '(circ <1280,580>#81 rgba(51, 102, 26, 0.7))',
    '(circ <1375,783>#191 rgba(51, 102, 26, 0.7))',
    '(circ <658,889>#198 rgba(51, 102, 26, 0.7))',
    '(circ <706,274>#75 rgba(51, 102, 26, 0.7))',
    '(circ <1113,891>#292 rgba(51, 102, 26, 0.7))']
};


var h3 = {
'title':'Ring-shaped',
'par':7,
'startingCaddyVals': {'putter':6,'wedge':5,'iron':3,'driver':3},
'fairways': ['(polygon <147,653;360,896;706,958;1061,949;1396,878;1483,629;1505,359;1461,160;1228,19;700,7;420,28;257,199;292,423;452,461;629,344;713,287;868,265;1088,297;1170,364;1188,478;1141,580;1036,653;833,702;649,717;489,696;447,629;332,594> rgba(128, 153, 51, 1))'],
'tee':'(polygon <313,390;417,453;475,385;378,316> rgba(128, 179, 77, 1))',
'green':'(polygon <319,858;232,798;203,717;279,680;389,692;403,823> rgba(153, 204, 77, 1))',
'flag':'340,725',
'traps':['(polygon <536,889;525,833;632,806;732,857;728,934;627,951> rgba(204, 179, 77, 1))',
    '(polygon <838,256;683,267;644,207;827,167;1023,180;1062,277> rgba(204, 179, 77, 1))'],
'paths':['(polygon <257,351;232,258;256,169;301,100;356,44;443,5;498,1;591,4;668,0;780,4;879,1;985,4;1065,2;1143,2;1220,8;1287,27;1349,49;1387,73;1412,98;1452,139;1490,197;1509,267;1515,376;1521,444;1523,570;1512,635;1505,712;1483,794;1457,851;1432,885;1399,910;1350,940;1291,958;1222,972;1157,977;1097,983;1054,988;988,992;934,997;846,1001;789,1001;712,998;644,999;582,994;501,991;450,985;404,971;348,953;316,933;307,891;340,881;370,891;399,900;437,911;479,922;537,928;604,941;648,945;680,953;729,953;788,955;847,951;896,947;930,946;964,940;1030,939;1073,939;1158,929;1234,909;1291,887;1333,863;1380,837;1421,794;1440,742;1454,673;1460,597;1465,526;1458,460;1446,373;1441,321;1445,260;1429,190;1383,141;1325,102;1275,71;1216,53;1141,45;1074,41;1013,41;952,45;887,45;825,45;763,39;685,46;608,63;548,59;480,52;433,56;392,79;347,120;311,167;283,231;286,265;288,299;281,327> rgba(77, 77, 77, 1))'],
'waters':['(polygon <715,407;627,454;680,548;623,595;738,648;839,556;914,601;969,486;1087,494;1025,363;922,402;806,309> rgba(153, 204, 230, 1))',
    '(polygon <894,590;932,672;917,776;980,864;966,946;1031,1020;1069,1018;1029,974;1036,889;986,809;990,748;964,672;947,597;924,563> rgba(153, 204, 230, 1))',
    '(polygon <645,484;606,512;529,568;403,542;320,546;223,571;128,538;66,459;12,472;2,415;78,404;120,433;188,473;204,510;261,486;339,456;397,455;450,479;488,497;571,493;596,433;652,442> rgba(153, 204, 230, 1))'],
'bushes':['(circ <314,955>#61 rgba(51, 102, 26, 0.7))',
    '(circ <84,834>#34 rgba(51, 102, 26, 0.7))',
    '(circ <55,751>#23 rgba(51, 102, 26, 0.7))',
    '(circ <1191,991>#56 rgba(51, 102, 26, 0.7))',
    '(circ <824,585>#36 rgba(51, 102, 26, 0.7))',
    '(circ <881,594>#38 rgba(51, 102, 26, 0.7))',
    '(circ <773,638>#29 rgba(51, 102, 26, 0.7))',
    '(circ <794,661>#30 rgba(51, 102, 26, 0.7))',
    '(circ <824,679>#28 rgba(51, 102, 26, 0.7))',
    '(circ <865,678>#26 rgba(51, 102, 26, 0.7))',
    '(circ <889,658>#28 rgba(51, 102, 26, 0.7))',
    '(circ <1080,520>#29 rgba(51, 102, 26, 0.7))',
    '(circ <994,653>#17 rgba(51, 102, 26, 0.7))',
    '(circ <1118,1000>#16 rgba(51, 102, 26, 0.7))',
    '(circ <1487,809>#42 rgba(51, 102, 26, 0.7))',
    '(circ <1186,990>#12 rgba(51, 102, 26, 0.7))',
    '(circ <293,27>#33 rgba(51, 102, 26, 0.7))',
    '(circ <219,197>#22 rgba(51, 102, 26, 0.7))',
    '(circ <198,280>#28 rgba(51, 102, 26, 0.7))',
    '(circ <217,316>#25 rgba(51, 102, 26, 0.7))',
    '(circ <348,20>#29 rgba(51, 102, 26, 0.7))',
    '(circ <107,251>#17 rgba(51, 102, 26, 0.7))',
    '(circ <219,604>#11 rgba(51, 102, 26, 0.7))',
    '(circ <158,563>#21 rgba(51, 102, 26, 0.7))',
    '(circ <155,433>#25 rgba(51, 102, 26, 0.7))',
    '(circ <542,452>#32 rgba(51, 102, 26, 0.7))',
    '(circ <687,371>#40 rgba(51, 102, 26, 0.7))',
    '(circ <753,294>#14 rgba(51, 102, 26, 0.7))',
    '(circ <819,284>#25 rgba(51, 102, 26, 0.7))',
    '(circ <653,689>#30 rgba(51, 102, 26, 0.7))',
    '(circ <469,641>#35 rgba(51, 102, 26, 0.7))',
    '(circ <529,691>#39 rgba(51, 102, 26, 0.7))',
    '(circ <149,708>#36 rgba(51, 102, 26, 0.7))',
    '(circ <217,799>#18 rgba(51, 102, 26, 0.7))',
    '(circ <302,876>#19 rgba(51, 102, 26, 0.7))',
    '(circ <367,978>#20 rgba(51, 102, 26, 0.7))',
    '(circ <397,996>#20 rgba(51, 102, 26, 0.7))',
    '(circ <425,1006>#32 rgba(51, 102, 26, 0.7))',
    '(circ <82,953>#15 rgba(51, 102, 26, 0.7))',
    '(circ <65,875>#57 rgba(51, 102, 26, 0.7))'],
'trees':['(circ <300,465>#45 rgba(51, 102, 26, 0.7))',
    '(circ <244,486>#29 rgba(51, 102, 26, 0.7))',
    '(circ <328,552>#58 rgba(51, 102, 26, 0.7))',
    '(circ <404,559>#31 rgba(51, 102, 26, 0.7))',
    '(circ <473,482>#50 rgba(51, 102, 26, 0.7))',
    '(circ <447,570>#48 rgba(51, 102, 26, 0.7))',
    '(circ <398,595>#46 rgba(51, 102, 26, 0.7))',
    '(circ <247,567>#44 rgba(51, 102, 26, 0.7))',
    '(circ <191,587>#28 rgba(51, 102, 26, 0.7))',
    '(circ <294,576>#50 rgba(51, 102, 26, 0.7))',
    '(circ <371,543>#48 rgba(51, 102, 26, 0.7))',
    '(circ <340,450>#24 rgba(51, 102, 26, 0.7))',
    '(circ <225,427>#55 rgba(51, 102, 26, 0.7))',
    '(circ <188,482>#25 rgba(51, 102, 26, 0.7))',
    '(circ <123,351>#71 rgba(51, 102, 26, 0.7))',
    '(circ <181,98>#97 rgba(51, 102, 26, 0.7))',
    '(circ <175,232>#43 rgba(51, 102, 26, 0.7))',
    '(circ <593,601>#94 rgba(51, 102, 26, 0.7))',
    '(circ <640,513>#41 rgba(51, 102, 26, 0.7))',
    '(circ <680,303>#55 rgba(51, 102, 26, 0.7))',
    '(circ <665,60>#63 rgba(51, 102, 26, 0.7))',
    '(circ <498,65>#26 rgba(51, 102, 26, 0.7))',
    '(circ <561,66>#34 rgba(51, 102, 26, 0.7))',
    '(circ <1094,322>#172 rgba(51, 102, 26, 0.7))',
    '(circ <972,506>#84 rgba(51, 102, 26, 0.7))',
    '(circ <201,914>#99 rgba(51, 102, 26, 0.7))',
    '(circ <146,777>#54 rgba(51, 102, 26, 0.7))',
    '(circ <72,631>#101 rgba(51, 102, 26, 0.7))',
    '(circ <1314,972>#87 rgba(51, 102, 26, 0.7))',
    '(circ <1452,897>#70 rgba(51, 102, 26, 0.7))',
    '(circ <1419,983>#24 rgba(51, 102, 26, 0.7))',
    '(circ <1496,996>#41 rgba(51, 102, 26, 0.7))',
    '(circ <1467,78>#147 rgba(51, 102, 26, 0.7))',
    '(circ <1323,26>#76 rgba(51, 102, 26, 0.7))',
    '(circ <26,972>#82 rgba(51, 102, 26, 0.7))',
    '(circ <51,168>#58 rgba(51, 102, 26, 0.7))',
    '(circ <1517,228>#29 rgba(51, 102, 26, 0.7))']
};