function Button(inits) {
    this.shape = '';
    this.text = 'a button';
    this.img = '';
    this.font = '28px Arial';
    this.fontColor = COLOR_BLACK;
    if (inits !== undefined) {
        this.shape = inits.shape;
        this.text = inits.text;
        this.img = inits.img;
        this.activationCallback = inits.activationCallback;
        this.deactivationCallback = inits.deactivationCallback;
    }
    
    this.inRegion = (inits.inRegion === undefined) ? (region['game_control']) : inits.inRegion;
    this.state = 'up';
    this.shadeShape = this.shape.clone();
    this.shadeShape.setColor(makeColor(0,0,.1,.2));
    this.doTextOutline = false;
    this.center;
    
    this.shape.thickness = 6;
}

Button.prototype.draw = function() {
    // if loc is dest or dest is undefined set anim type to STANDING, else to MOVING
    // draw shape / img / sprite at loc
    // advance animation counter
    this.shape.drawFill(this.inRegion.ul);
    this.center = this.shape.getCenter();
    this.center.shiftBy(this.inRegion.ul);
    if (this.img) {
        drawTransformedImage(this.img, this.center.x,this.center.y);
    } else if (this.text) {
        fillText(this.text,this.center.x,this.center.y,this.fontColor,this.font,'center','middle');
        if (this.doTextOutline) {
            // strokeText(this.text,center.x,center.y,COLOR_WHITE,this.font,'center','middle');
            console.log('DEBUG: possible codeheart error in stroke text? seems to ignore the y anchor...');
        }
    }
    if (this.state == 'down') {
        this.shadeShape.drawFill(this.inRegion.ul);
    }
    this.shape.drawOutline(this.inRegion.ul);
}

Button.prototype.containsPt = function(p) {
    return this.shape.containsPt(p);
}


Button.prototype.activate = function(a,b,c,d) {
    if (this.state == 'up') {
        this.state = 'down';
        this.activationCallback(a,b,c,d);
        //console.log('activated');
    } else {
        this.state = 'up';
        this.deactivationCallback(a,b,c,d);
        //console.log('deactivated');
    }
}

Button.prototype.deactivate = function(a,b,c,d) {
    this.state = 'up';
    this.deactivationCallback(a,b,c,d);
    //console.log('deactivated');
}

////////////////////////////////////////////

function Slider(inits) {
    this.shape = inits.shape;
        
    this.shadeShape = this.shape.clone();
    this.shadeShape.setColor(makeColor(1,1,1,.2));
    this.markerShape = new Rect(new Point2D(this.shadeShape.ul.x-6,this.shadeShape.ul.y-8),12,this.shape.height+16,makeColor(0,0,0,.7));
    this.minVal = inits.minVal;
    this.maxVal = inits.maxVal;
    this.curVal = this.minVal;

    this.inRegion = new Rect(new Point2D(300,300),new Point2D(screenWidth-600,screenHeight-600));
}

Slider.prototype.draw = function() {
    this.shape.drawFill(this.inRegion.ul);
    this.shadeShape.drawFill(this.inRegion.ul);
    this.shape.drawOutline(this.inRegion.ul);
    this.markerShape.drawFill(this.inRegion.ul);
}

Slider.prototype.activate = function(clickPt,tui) {
    //console.log('TO DO: handle slider activation');
    clickPt.x -= this.inRegion.ul.x;
    var valRange = this.maxVal - this.minVal;   

    this.curVal = floor(this.minVal+valRange*((clickPt.x - this.shape.ul.x)/this.shape.width));
    if (this.curVal < this.minVal) {
        this.curVal = this.minVal; 
        this.shadeShape.ul.x = this.shape.ul.x;
        this.shadeShape.width = this.shape.width;
    } else
    if (this.curVal > this.maxVal) {
        this.curVal = this.maxVal;
        this.shadeShape.ul.x = this.shape.br.x;
        this.shadeShape.width = 0;
    } else {
        this.shadeShape.ul.x = clickPt.x;
        this.shadeShape.width = this.shadeShape.br.x - clickPt.x;
    }
    
    tui.setDelay(this.curVal);
    this.setMarker();
}

Slider.prototype.setMarker = function() {
    this.markerShape.ul.x = this.shadeShape.ul.x-6;
}

Slider.prototype.setVal = function(v) {
    console.log("DEBUG THIS: Slider.setVal is not working");
    //this.curVal = v;
    //
    //this.shadeShape.ul.x = this.shape.ul.x + ((v/(this.maxVal-this.minVal)) * this.shape.width);
    //this.shadeShape.width = 100; //this.shape.br.x - this.shadeShape.ul.x;
}


Slider.prototype.containsPt = function(p) {
    return this.shape.containsPt(p);
}


////////////////////////////////////////////

function TimerUi() {
    this.shape = new Rect(new Point2D(300,300),new Point2D(screenWidth-600,screenHeight-600));
    this.shape.setColor(makeColor(.3,.4,.6,.85));
    this.shape.thickness = 32;
    this.maxDelay = 120; // 4 seconds
    var w = this.shape.width;
    var h = this.shape.height;
    this.targetCharge = '';
    this.ctrls = {
                    'set': new Button({
                        'text':'Set Delay of 0.00 seconds',
                        'shape':new Rect(new Point2D(w*.25,h*.65),w*.5,h*.15,makeColor(.8,.8,.8)),
                        'activationCallback': function(pt,tui) {
                            uiMode = 'play'; 
                            this.text = 'Set Delay of 0.00 seconds';
                            this.state = 'up';
                            tui.ctrls['slider'].curVal = 0;
                            tui.ctrls['slider'].shadeShape.ul.x = tui.ctrls['slider'].shape.ul.x;
                            tui.ctrls['slider'].shadeShape.width = tui.ctrls['slider'].shape.width;
                            tui.ctrls['slider'].setMarker();
                            },
                        'deactivationCallback': function() { }
                    }),
                   'slider': new Slider({
                        'shape':new Rect(new Point2D(w*.1,h*.2),w*.8,h*.35,makeColor(.1,.1,.6)),
                        'minVal': 0,
                        'maxVal': this.maxDelay
                   })
                };
    this.ctrls['set'].inRegion = this.shape;
    this.ctrls['slider'].inRegion = this.shape;
}

TimerUi.prototype.draw = function() {
    this.shape.drawFill();
    this.ctrls['set'].draw();
    this.ctrls['slider'].draw();
    this.shape.drawOutline();
}

TimerUi.prototype.setDelay = function(d) {
    this.targetCharge.timer = d;
    this.ctrls['set'].text = 'Set Delay of '+(d/30).toFixed(2)+' seconds';
}

////////////////////////////////////////////

function PlayerAlert() {
    this.shape = new Rect(new Point2D(200,200),new Point2D(screenWidth-200,screenHeight-200));
    this.shape.setColor(makeColor(.4,.4,.5,.9));
    this.shape.thickness = 48;
    this.alertMsg = ['a message'];
    this.baseFont = '72px Arial';
    this.curFont = this.baseFont;
}

PlayerAlert.prototype.setMessage = function(msg,optionalFont) {
    this.alertMsg = [];
    // if message is array, copy it in
    // else if message is a string, split it by newlines
    this.alertMsg = msg.split("\n");
    if (optionalFont === undefined) {
        this.curFont = this.baseFont;
    } else {
        this.curFont = optionalFont;
    }
}

PlayerAlert.prototype.draw = function() {
    this.shape.drawFill();
    this.shape.drawOutline();
    var msgHeight = 76 * this.alertMsg.length;
    var msgY = screenHeight/2 - msgHeight/2;
    var curMsgY = msgY;
    for (var i=0;i<this.alertMsg.length;++i) {
        fillText(this.alertMsg[i],screenWidth/2,curMsgY,COLOR_BLACK,this.curFont,'center','middle')    
        curMsgY += 76;
    }
    fillText('(touch anywhere or press any key)',screenWidth/2,this.shape.br.y-120,COLOR_GREY2,'36px Arial','center','middle')
}

////////////////////////////////////////////

function Sprite(inits) {
    this.sheetImageFileName = inits.sheetImage;
    if (this.sheetImageFileName != '') {
        this.sheetImage = loadImage(this.sheetImageFileName);
    }
    this.frameCount = inits.frameCount;
    this.stoppedFrameIdx = inits.stoppedFrameIdx;
    this.frameWidth = inits.frameWidth;
    this.frameHeight = inits.frameHeight;
    this.scaling = inits.scaling;
    
    this.curFrame = this.stoppedFrameIdx;
}

// NOTE: clone-lights share an common image object for the sheet image, but are otherwise independent
Sprite.prototype.cloneLight = function() {
    var s = new Sprite({
        'sheetImage':'',
        'frameCount':this.frameCount,
        'stoppedFrameIdx':this.stoppedFrameIdx,
        'frameWidth':this.frameWidth,
        'frameHeight':this.frameHeight,
        'scaling':this.scaling
    });
    s.sheetImageFileName = this.sheetImageFileName;
    s.sheetImage = this.sheetImage;
    return s;
}

Sprite.prototype.step = function() {
    this.curFrame = (this.curFrame + 1) % this.frameCount;
    //console.log('sprite step');
}
Sprite.prototype.randomStep = function() {
//    this.curFrame = (this.curFrame + 1) % this.frameCount;
    this.curFrame = (this.curFrame + randomInteger(1,this.frameCount-1)) % this.frameCount;
    //console.log('sprite step');
}

Sprite.prototype.drawAt = function(x,y,angle) {
    drawTransformedImage(this.sheetImage, x, y, angle, this.scaling, this.scaling, this.curFrame*this.frameWidth, 0, this.frameWidth, this.frameHeight);
}