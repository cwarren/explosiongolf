function makeDarkerColor(c) {
    // TODO: fix this - cComps is null
    //alert('color is '+c);
    //var cComps = c.toString().match(/\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\.?\d+)/);
    //alert('cComps is '+cComps);
    //if ((cComps === undefined) || (cComps == null)) {
    //    return makeColor(.05,.05,.05,.5);
    //}
    //return makeColor(cComps[1]*.3,cComps[2]*.3,cComps[3]*.3,cComps[4]);
    //console.log('TO DO: implement/fix makeDarkerColor');
    return makeColor(.05,.05,.05,.5);
}

var COLOR_ROUGH =   makeColor(.4,.5,.1);
var COLOR_FAIRWAY = makeColor(.5,.6,.2);
var COLOR_TEE =     makeColor(.5,.7,.3);
var COLOR_GREEN =   makeColor(.6,.8,.3);
var COLOR_FLAG =    makeColor(.2,.3,.6);
var COLOR_SAND =    makeColor(.8,.7,.3);
var COLOR_PATH =    makeColor(.3,.3,.3);
var COLOR_WATER =   makeColor(.6,.8,.9);
var COLOR_TRAP = COLOR_SAND;

var COLOR_FOLIAGE =    makeColor(.2,.4,.1,.7);
var COLOR_TRUNK =    makeColor(.3,.3,.1);

var COLOR_BOUNCE = makeColor(.4,.3,.1,.8);
//var COLOR_BOUNCE = makeColor(0,0,0);

var COLOR_BLACK = makeColor(0,0,0);
var COLOR_GREY2 = makeColor(.2,.2,.2);
var COLOR_GREY5 = makeColor(.5,.5,.5);
var COLOR_WHITE = makeColor(1,1,1);
var COLOR_RED = makeColor(1,0,0);
var COLOR_DARKRED = makeColor(.5,0,0);

var COLOR_SCORE = makeColor(.2,.8,.2);

var COLOR_FUSE = makeColor(.1,.4,.1);

var COLOR_CHARGE = {};
COLOR_CHARGE['ball']    = makeColor(.9,.9,.9);
COLOR_CHARGE['putter']  = makeColor(.7,.6,.6);
COLOR_CHARGE['wedge']   = makeColor(.6,.5,.5);
COLOR_CHARGE['iron']    = makeColor(.5,.4,.4);
COLOR_CHARGE['driver']  = makeColor(.4,.3,.3);
var COLOR_CHARGE_OUTLINE = makeColor(.8,.8,.8,.1);
var COLOR_CHARGE_HIGHLIGHT = makeColor(.1,.9,.2,1);

var COLOR_CTRL_DISABLE = makeColor(0,0,0,.4);
var COLOR_PAUSE = makeColor(.3,.3,.3,.4);

///////////////////////////////////
// a simple x,y point class



var PT_ORIGIN = new Point2D(0,0);


///////////////////////////////////
function Shape() {
    this.type = 'generalShape';
}

Shape.checkIfShapeIntersect = function(s1,s2) {
    var inter;
    if (s1.type == 'rect') {
        if (s2.type == 'rect') {
            inter = Intersection.intersectRectangleRectangle(s2.ul.clone(), s2.br.clone(), s1.ul.clone(), s1.br.clone());
        } else if (s2.type == 'circ') {
            inter = Intersection.intersectCircleRectangle(s2.loc.clone(), s2.radius, s1.ul.clone(), s1.br.clone());
        } else if (s2.type == 'segment') {
            inter = Intersection.intersectLineRectangle(s2.pt1.clone(), s2.pt2.clone(), s1.ul.clone(), s1.br.clone());
        }
    } else if (s1.type == 'circ') {
        if (s2.type == 'rect') {
            inter = Intersection.intersectCircleRectangle(s1.loc.clone(), s1.radius, s2.ul.clone(), s2.br.clone());
        } else if (s2.type == 'circ') {
            inter = Intersection.intersectCircleCircle(s1.loc.clone(), s1.radius, s2.loc.clone(), s2.radius);
        } else if (s2.type == 'segment') {
            inter = Intersection.intersectCircleLine(s1.loc.clone(), s1.radius, s2.pt1.clone(), s2.pt2.clone());
        }    
    } else if (s1.type == 'segment') {
        if (s2.type == 'rect') {
            inter = Intersection.intersectLineRectangle(s1.pt1.clone(), s1.pt2.clone(), s2.ul.clone(), s2.br.clone());
        } else if (s2.type == 'circ') {
            inter = Intersection.intersectCircleLine(s2.loc.clone(), s2.radius, s1.pt1.clone(), s1.pt2.clone());
        } else if (s2.type == 'segment') {
            inter = intersectLineLine(s1.pt1.clone(), s1.pt2.clone(), s2.pt1.clone(), s2.pt2.clone());
        }    
    }
    return inter.doesIntersect();
}

/*
// NOTES ON SHAPES

Shape is conceptually an interface definition, plus a couple of related library functions as class functions. However, Shape isn't actually an interface, because this is javascript and js doesn't 'do' interfaces. Instead it's a conceptual interface, as defined by this comment.

public properties/attributes/fields/etc.
    color: result of makeColor
    type: segment, rect, cicle, polygon
    thickness: the thickness of the lines used when drawing the shape
    
public methods
    clone - create an independent copy of this object
    
    setColor(c) - sets the color attribue of the shape

    getCenter - get a Point2D that is at the center (for some value of 'center') of the shape
    getCenterX - get the x scalar used for the above point
    getCenterY - get the x scalar used for the above point
    
    toString - a human-readabel string representation of this shape, suitable for use in debugging
    
    drawFill(optional_ref_pt) - draw the filled shape on the canvas, offset by the reference point (i.e. the ref point is the upper left of the region in which the shape is drawn)
    drawStroke(optional_ref_pt) - draw an outline of the shape on the canvas, offset by the reference point (i.e. the ref point is the upper left of the region in which the shape is drawn)
    drawOutline(optional_ref_pt) - draw an outline of the shape on the canvas in a darker color, offset by the reference point (i.e. the ref point is the upper left of the region in which the shape is drawn)

    containsPt(p)

compatibility
    Shape implementions are suitable to use in the various intersection methods of IntersectionLtd.js
    
*/


///////////////////////////////////
// a basic line segment class

function Segment(pt1,pt2) { // implements Shape
    this.pt1 = pt1.clone();
    this.pt2 = pt2.clone();
    this.color = pt1.color;
    this.darkerColor = makeDarkerColor(this.color);
    this.type = 'segment';
    this.thickness = 1;
}

Segment.prototype.setColor = function(c) {
    this.color = c;
    this.darkerColor = makeDarkerColor(this.color);
}

Segment.prototype.clone = function () {
    console.log('TO DO: implement Segment.prototype.clone');
}

Segment.prototype.getCenter = function () {
    console.log('TO DO: implement Segment.prototype.getCenter');
}
Segment.prototype.getCenterX = function () {
    console.log('TO DO: implement Segment.prototype.getCenterX');
}
Segment.prototype.getCenterY = function () {
    console.log('TO DO: implement Segment.prototype.getCenterY');
}

Segment.prototype.toString = function () {
    console.log('TO DO: implement Segment.prototype.toString');
}


Segment.prototype.drawFill = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    strokeLine(this.pt1.x+optional_ref_pt.x,this.pt1.y+optional_ref_pt.y,this.pt2.x+optional_ref_pt.x,this.pt2.y+optional_ref_pt.y,this.color,this.thickness);
}
Segment.prototype.drawStroke = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    strokeLine(this.pt1.x+optional_ref_pt.x,this.pt1.y+optional_ref_pt.y,this.pt2.x+optional_ref_pt.x,this.pt2.y+optional_ref_pt.y,this.color,this.thickness);
}
Segment.prototype.drawOutline = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    strokeLine(this.pt1.x+optional_ref_pt.x,this.pt1.y+optional_ref_pt.y,this.pt2.x+optional_ref_pt.x,this.pt2.y+optional_ref_pt.y,this.darkerColor,this.thickness);
}

Segment.prototype.containsPt = function (p) {
    console.log('TO DO: implement Segment.prototype.containsPt');
}

// end of interface implementation

Segment.prototype.getAngleRadians = function () {
    console.log('TO DO: implement Segment.prototype.getAngleRadians');
}

Segment.prototype.spansPointOverX = function (p) {
    return (((this.pt1.x > p.x) && (this.pt2.x <= pt.x)) || ((this.pt2.x > p.x) && (this.pt1.x <= pt.x)));
}
Segment.prototype.spansPointOverY = function (p) {
    return (((this.pt1.y > p.y) && (this.pt2.y <= pt.y)) || ((this.pt2.y > p.y) && (this.pt1.y <= pt.y)));
}

Segment.prototype.crossesSegment = function (seg) {
    console.log('TO DO: implement Segment.prototype.crossesSegment');
}
Segment.prototype.findCrossingPoint = function (seg) {
    console.log('TO DO: implement Segment.prototype.findCrossingPoint');
}

Segment.prototype.getPointNearestTo = function(otherPt) {
    console.log('TO DO: implement Segment.prototype.getPointNearestTo');
}

//Segment.prototype.draw = function () {
//    strokeLine(this.pt1.x,this.pt1.y,this.pt2.x,this.pt2.y,this.color,1);
//}

///////////////////////////////////
// rects are special cases - not implemented as general polygons

function Rect(pUL,pBR_or_width,height_optional,color_optional) {
    this.ul = pUL;
    if (height_optional===undefined) {
        this.br = pBR_or_width;
        this.width = this.br.x - this.ul.x;
        this.height = this.br.y - this.ul.y;
    } else {
        this.width = pBR_or_width;
        this.height = height_optional;
        this.br = new Point2D(this.ul.x+this.width,this.ul.y+this.height);
    }
    
    this.color = (color_optional!==undefined)?(color_optional):makeColor(1,1,1);
    this.darkerColor = makeDarkerColor(this.color);
    this.thickness = 1;
    this.type = 'rect';
}

Rect.prototype.clone = function() {
    var r = new Rect(this.ul.clone(),this.br.clone());
    r.setColor(this.color);
    r.thickness = this.thickness;
    return r;
}


Rect.prototype.setColor = function(c) {
    this.color = c;
    this.darkerColor = makeDarkerColor(this.color);
}


Rect.prototype.getCenter = function() {
    return new Point2D(this.getCenterX(),this.getCenterY());
}
Rect.prototype.getCenterX = function() {
    return this.ul.x+this.width/2;
}
Rect.prototype.getCenterY = function() {
    return this.ul.y+this.height/2;
}


Rect.prototype.toString = function() {
    return "["+this.ul.toString()+","+this.br.toString()+":"+this.color+"]";
}


Rect.prototype.drawFill = function (relToPt) {
    if (relToPt===undefined) {
        relToPt = PT_ORIGIN;
    }
    fillRectangle(this.ul.x+relToPt.x,this.ul.y+relToPt.y,this.width,this.height,this.color);
}
Rect.prototype.drawOutline = function (relToPt) {
    if (relToPt===undefined) {
        relToPt = PT_ORIGIN;
    }
    strokeRectangle(this.ul.x+relToPt.x,this.ul.y+relToPt.y,this.width,this.height,this.darkerColor,this.thickness);
}
Rect.prototype.drawStroke = function (relToPt) {
    if (relToPt===undefined) {
        relToPt = PT_ORIGIN;
    }
    strokeRectangle(this.ul.x+relToPt.x,this.ul.y+relToPt.y,this.width,this.height,this.thickness);
}

Rect.prototype.containsPt = function(p) {
    return (this.ul.x <= p.x) && (this.br.x > p.x) && (this.ul.y <= p.y) && (this.br.y > p.y);
}

// end of interface implementation

Rect.prototype.drawClear = function (relToPt) {
    if (relToPt===undefined) {
        relToPt = PT_ORIGIN;
    }
    clearRectangle(this.ul.x+relToPt.x,this.ul.y+relToPt.y,this.width,this.height);
}




///////////////////////////////////
// circs are special cases - not implemented as general polygons

var PI = 3.1415926;

function Circ(pCenter,radius,color_optional) {
    this.loc = pCenter;
    this.radius = radius;    
    this.color = (color_optional!==undefined)?(color_optional):makeColor(1,1,1);
    this.darkerColor = makeDarkerColor(this.color);
    this.thickness = 1;
    this.type = 'circ';
}

Circ.prototype.clone = function() {
    var c = new Circ(this.loc.clone(),this.radius,this.color);
    c.thickness = this.thickness;
    return c;
}

Circ.prototype.setColor = function(c) {
    this.color = c;
    this.darkerColor = makeDarkerColor(this.color);
}

Circ.prototype.getCenter = function() {
    return this.loc.clone();
}
Circ.prototype.getCenterX = function() {
    return this.loc.x;
}
Circ.prototype.getCenterY = function() {
    return this.loc.y;
}

Circ.prototype.toString = function() {
    return '(circ <'+this.loc.toString()+'>#'+this.radius+' '+this.color+')';
}


Circ.prototype.drawFill = function (relToPt) {
    if (relToPt===undefined) {
        relToPt = PT_ORIGIN;
    }
    fillCircle(this.loc.x+relToPt.x,this.loc.y+relToPt.y,this.radius,this.color);
}
Circ.prototype.drawStroke = function (relToPt) {
    if (relToPt===undefined) {
        relToPt = PT_ORIGIN;
    }
    strokeCircle(this.loc.x+relToPt.x,this.loc.y+relToPt.y,this.radius,this.color,this.thickness);
}
Circ.prototype.drawOutline = function (relToPt) {
    if (relToPt===undefined) {
        relToPt = PT_ORIGIN;
    }
    strokeCircle(this.loc.x+relToPt.x,this.loc.y+relToPt.y,this.radius,this.darkerColor,this.thickness);
}


Circ.prototype.containsPt = function(p) {
    return this.loc.getDistanceTo(p) < this.radius;
}

///////////////////////////////////
// a polygon - defined by a series of vertices (Point2D objects), each connected to the next and the last in the series connected to the first

function Polygon(points_ar,color_optional) {
    
    this.vertices = [];
    //this.edges = [];
    this.splineControls = [];
    var i;
    for (i=0;i<points_ar.length;i++) {
        this.vertices.push(points_ar[i].clone());
        //if (i>0) {
        //    this.edges.push(new Segment(points_ar[i-1],points_ar[i]));
        //}
        this.splineControls.push(points_ar[i].x);
        this.splineControls.push(points_ar[i].y);
    }
    //if (i>0) {
    //    this.edges.push(new Segment(points_ar[i-1],points_ar[0]));
    //}
    
    this.color = (color_optional!==undefined)?(color_optional):makeColor(1,1,1);
    this.darkerColor = makeDarkerColor(this.color);
    this.thickness = 1;
    this.type = 'polygon';

}

Polygon.prototype.setColor = function(c) {
    this.color = c;
    this.darkerColor = makeDarkerColor(this.color);
}

Polygon.prototype.clone = function () {
    return new Polygon(this.vertices,this.color);
}

Polygon.prototype.getCenter = function () {
    return new Point2D(this.getCenterX(),this.getCenterY());
}
Polygon.prototype.getCenterX = function () {
    var sum = 0;
    for (var i=0;i<this.vertices.length;i++) {
        sum += this.vertices[i].x;
    }
    return sum/this.vertices.length;    
}
Polygon.prototype.getCenterY = function () {
    var sum = 0;
    for (var i=0;i<this.vertices.length;i++) {
        sum += this.vertices[i].y;
    }
    return sum/this.vertices.length;    
}

Polygon.prototype.toString = function () {
    var str = '(polygon <';
    for (var i=0;i<this.vertices.length;i++) {
        str += ((i>0)?(';'):(''))+this.vertices[i].toString();
    }
    str += '> '+this.color+')';
    return str;
}


Polygon.prototype.drawFill = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    if (this.vertices.length > 1) {
        var ctx = this._getContextWithPath(optional_ref_pt.x,optional_ref_pt.y);
        ctx.lineJoin = "round";
        ctx.fillStyle = this.color;
        ctx.fill();
    } else
    if (this.vertices.length == 1) {
        fillCircle(this.vertices[0].x+optional_ref_pt.x,this.vertices[0].y+optional_ref_pt.y,4,COLOR_RED)
    }
}
Polygon.prototype.drawStroke = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    if (this.vertices.length > 1) {
        var ctx = this._getContextWithPath(optional_ref_pt.x,optional_ref_pt.y);
        ctx.lineJoin = "round";
        ctx.strokeStyle = this.color;
        ctx.stroke();
    } else
    if (this.vertices.length == 1) {
        fillCircle(this.vertices[0].x+optional_ref_pt.x,this.vertices[0].y+optional_ref_pt.y,4,COLOR_RED)
    }
}
Polygon.prototype.drawOutline = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    if (this.vertices.length > 1) {
        var ctx = this._getContextWithPath(optional_ref_pt.x,optional_ref_pt.y);
        ctx.lineJoin = "round";
        ctx.strokeStyle = this.darkerColor;
        ctx.stroke();
    } else
    if (this.vertices.length == 1) {
        fillCircle(this.vertices[0].x+optional_ref_pt.x,this.vertices[0].y+optional_ref_pt.y,4,COLOR_RED)
    }
}

Polygon.prototype._getContextWithPath = function(offsetX,offsetY) {
    var canvas  = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    
    context.beginPath();
    if (this.vertices.length > 0) {
        context.moveTo(this.vertices[0].x+offsetX,this.vertices[0].y+offsetY);
        var i;
        for (i=1;i<this.vertices.length;i++) {
            context.lineTo(this.vertices[i].x+offsetX,this.vertices[i].y+offsetY);
        }
        context.lineTo(this.vertices[0].x+offsetX,this.vertices[0].y+offsetY);
    }
    context.closePath();

    context.lineWidth = this.thickness;
    
    return context;
}

Polygon.prototype.addVertex = function(p) {
    this.vertices.push(p);
    this.splineControls.push(p.x);
    this.splineControls.push(p.y);
}

Polygon.prototype.drawFillSpline = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    //console.log('drawing filled spline');
    fillSpline(this.getAdjustedSplineControlPoints(optional_ref_pt.x,optional_ref_pt.y),this.color,true);    
}
Polygon.prototype.drawStrokeSpline = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    strokeSpline(this.getAdjustedSplineControlPoints(optional_ref_pt.x,optional_ref_pt.y),this.color,this.thickness,true);    
}
Polygon.prototype.drawOutlineSpline = function (optional_ref_pt) {
    if (optional_ref_pt === undefined) {
        optional_ref_pt = PT_ORIGIN;
    }
    strokeSpline(this.getAdjustedSplineControlPoints(optional_ref_pt.x,optional_ref_pt.y),this.darkerColor,this.thickness,true);    
}

Polygon.prototype.getAdjustedSplineControlPoints = function (refx,refy) {
    var splineCtrls = this.splineControls.slice(0);
    for (var i=1;i<splineCtrls.length;i+=2) {
        splineCtrls[i-1] += refx;
        splineCtrls[i] += refy;
    }
    return splineCtrls;
}

Polygon.prototype.containsPt = function (p) {
    var inter = Intersection.intersectLinePolygon(p,new Point2D(0,p.y),this.vertices);
    return ((inter.points.length % 2) == 1);
}


