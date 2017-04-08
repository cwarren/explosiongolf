/*****
*
*   Intersection.js
*
*   copyright 2002-2003, Kevin Lindsey
*
*****/

/*****************************************

NOTE: modified by Chris Warren 2012 to remove a bunch of code that's not used in this application

added to the intersect class:

    Intersection.prototype.doesIntersect


NOTE: added (at the end) various point-to-shape checks:

    Intersection.intersectPointPoint
    Intersection.intersectPointLine
    Intersection.intersectPointCircle
    Intersection.intersectPointRect


*****************************************/

/*****
*
*   constructor
*
*****/
function Intersection(status) {
    if ( arguments.length > 0 ) {
        this.init(status);
    }
}


/*****
*
*   init
*
*****/
Intersection.prototype.init = function(status) {
    this.status = status;
    this.points = new Array();
};


/*****
*
*   appendPoint
*
*****/
Intersection.prototype.appendPoint = function(point) {
    this.points.push(point);
};


/*****
*
*   appendPoints
*
*****/
Intersection.prototype.appendPoints = function(points) {
    this.points = this.points.concat(points);
};


/*****
*
*   toString
*
*****/
Intersection.prototype.toString = function() {
    var r = this.status;
    for (var i=0;i<this.points.length;i++) {
        r = r+' ('+this.points[i].toString()+')';
    }
    return r;
};


/*****
*
*   doesIntersect  : CSW - a quick and dirty check for a simply true/false on the intersections status
*
*****/
Intersection.prototype.doesIntersect = function() {
    return (this.status == 'Intersection') || (this.status == 'Inside') || (this.status == 'Tangent') || (this.status == 'Coincident');
};


/*****
*
*   class methods
*
*****/


/*****
*
*   intersectCircleCircle
*
*****/
Intersection.intersectCircleCircle = function(c1, r1, c2, r2) {
    var result;
    
    // Determine minimum and maximum radii where circles can intersect
    var r_max = r1 + r2;
    var r_min = Math.abs(r1 - r2);
    
    // Determine actual distance between circle circles
    var c_dist = c1.distanceFrom( c2 );

    if ( c_dist > r_max ) {
        result = new Intersection("Outside");
    } else if ( c_dist < r_min ) {
        result = new Intersection("Inside");
    } else {
        result = new Intersection("Intersection");

        var a = (r1*r1 - r2*r2 + c_dist*c_dist) / ( 2*c_dist );
        var h = Math.sqrt(r1*r1 - a*a);
        var p = c1.lerp(c2, a/c_dist);
        var b = h / c_dist;

        result.points.push(
            new Point2D(
                p.x - b * (c2.y - c1.y),
                p.y + b * (c2.x - c1.x)
            )
        );
        result.points.push(
            new Point2D(
                p.x + b * (c2.y - c1.y),
                p.y - b * (c2.x - c1.x)
            )
        );
    }

    return result;
};


/*****
*
*   intersectCircleEllipse
*
*****/
Intersection.intersectCircleEllipse = function(cc, r, ec, rx, ry) {
    return Intersection.intersectEllipseEllipse(cc, r, r, ec, rx, ry);
};


/*****
*
*   intersectCircleLine
*
*****/
Intersection.intersectCircleLine = function(c, r, a1, a2) {
    //console.log('checking if circle '+c.toString()+':'+r+' intersects line '+a1.toString()+'-'+a2.toString());
    var result;
    var a  = (a2.x - a1.x) * (a2.x - a1.x) +
             (a2.y - a1.y) * (a2.y - a1.y);
    var b  = 2 * ( (a2.x - a1.x) * (a1.x - c.x) +
                   (a2.y - a1.y) * (a1.y - c.y)   );
    var cc = c.x*c.x + c.y*c.y + a1.x*a1.x + a1.y*a1.y -
             2 * (c.x * a1.x + c.y * a1.y) - r*r;
    var deter = b*b - 4*a*cc;

    if ( deter < 0 ) {
        result = new Intersection("Outside");
    } else if ( deter == 0 ) {
        result = new Intersection("Tangent");
        // NOTE: should calculate this point
    } else {
        var e  = Math.sqrt(deter);
        var u1 = ( -b + e ) / ( 2*a );
        var u2 = ( -b - e ) / ( 2*a );

        if ( (u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1) ) {
            if ( (u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1) ) {
                result = new Intersection("Outside");
            } else {
                result = new Intersection("Inside");
            }
        } else {
            result = new Intersection("Intersection");

            if ( 0 <= u1 && u1 <= 1)
                result.points.push( a1.lerp(a2, u1) );

            if ( 0 <= u2 && u2 <= 1)
                result.points.push( a1.lerp(a2, u2) );
        }
    }
    
    //console.log('answer is '+result.toString());
    return result;
};


/*****
*
*   intersectCirclePolygon
*
*****/
Intersection.intersectCirclePolygon = function(c, r, points) {
    var result = new Intersection("None");
    var length = points.length;
    var inter;

    for ( var i = 0; i < length; i++ ) {
        var a1 = points[i];
        var a2 = points[(i+1) % length];

        inter = Intersection.intersectCircleLine(c, r, a1, a2);
        result.appendPoints(inter.points);
    }

    if ( result.points.length > 0 )
        result.status = "Intersection";
    else
        result.status = inter.status;

    return result;
};


/*****
*
*   intersectCircleRectangle
*
*****/
Intersection.intersectCircleRectangle = function(c, r, r1, r2) {
    var min        = r1.min(r2);
    var max        = r1.max(r2);
    var topRight   = new Point2D( max.x, min.y );
    var bottomLeft = new Point2D( min.x, max.y );
   
    /*
    console.log('r1='+r1.toString());
    console.log('r2='+r2.toString());
    console.log('min='+min.toString());
    console.log('max='+max.toString());
    console.log('topRight='+topRight.toString());
    console.log('bottomLeft='+bottomLeft.toString());
    */
    
    var inter1 = Intersection.intersectCircleLine(c, r, min, topRight);
    var inter2 = Intersection.intersectCircleLine(c, r, topRight, max);
    var inter3 = Intersection.intersectCircleLine(c, r, max, bottomLeft);
    var inter4 = Intersection.intersectCircleLine(c, r, bottomLeft, min);
    
    var result = new Intersection("None");

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if ( result.points.length > 0 ) {
        result.status = "Intersection";
    } else {
        var inter5 = Intersection.intersectPointOnRect(c,r1,r2);
        if (inter5.status == 'None') {
            result.status = inter1.status;
        } else {
            result.status = inter5.status;
        }
    }
    return result;
};


/*****
*
*   intersectEllipseEllipse
*   
*   This code is based on MgcIntr2DElpElp.cpp written by David Eberly.  His
*   code along with many other excellent examples are avaiable at his site:
*   http://www.magic-software.com
*
*   NOTE: Rotation will need to be added to this function
*
*****/
Intersection.intersectEllipseEllipse = function(c1, rx1, ry1, c2, rx2, ry2) {
    var a = [
        ry1*ry1, 0, rx1*rx1, -2*ry1*ry1*c1.x, -2*rx1*rx1*c1.y,
        ry1*ry1*c1.x*c1.x + rx1*rx1*c1.y*c1.y - rx1*rx1*ry1*ry1
    ];
    var b = [
        ry2*ry2, 0, rx2*rx2, -2*ry2*ry2*c2.x, -2*rx2*rx2*c2.y,
        ry2*ry2*c2.x*c2.x + rx2*rx2*c2.y*c2.y - rx2*rx2*ry2*ry2
    ];

    var yPoly   = Intersection.bezout(a, b);
    var yRoots  = yPoly.getRoots();
    var epsilon = 1e-3;
    var norm0   = ( a[0]*a[0] + 2*a[1]*a[1] + a[2]*a[2] ) * epsilon;
    var norm1   = ( b[0]*b[0] + 2*b[1]*b[1] + b[2]*b[2] ) * epsilon;
    var result  = new Intersection("None");

    for ( var y = 0; y < yRoots.length; y++ ) {
        var xPoly = new Polynomial(
            a[0],
            a[3] + yRoots[y] * a[1],
            a[5] + yRoots[y] * (a[4] + yRoots[y]*a[2])
        );
        var xRoots = xPoly.getRoots();

        for ( var x = 0; x < xRoots.length; x++ ) {
            var test =
                ( a[0]*xRoots[x] + a[1]*yRoots[y] + a[3] ) * xRoots[x] + 
                ( a[2]*yRoots[y] + a[4] ) * yRoots[y] + a[5];
            if ( Math.abs(test) < norm0 ) {
                test =
                    ( b[0]*xRoots[x] + b[1]*yRoots[y] + b[3] ) * xRoots[x] +
                    ( b[2]*yRoots[y] + b[4] ) * yRoots[y] + b[5];
                if ( Math.abs(test) < norm1 ) {
                    result.appendPoint( new Point2D( xRoots[x], yRoots[y] ) );
                }
            }
        }
    }

    if ( result.points.length > 0 ) result.status = "Intersection";

    return result;
};


/*****
*
*   intersectEllipseLine
*   
*   NOTE: Rotation will need to be added to this function
*
*****/
Intersection.intersectEllipseLine = function(c, rx, ry, a1, a2) {
    var result;
    var origin = new Vector2D(a1.x, a1.y);
    var dir    = Vector2D.fromPoints(a1, a2);
    var center = new Vector2D(c.x, c.y);
    var diff   = origin.subtract(center);
    var mDir   = new Vector2D( dir.x/(rx*rx),  dir.y/(ry*ry)  );
    var mDiff  = new Vector2D( diff.x/(rx*rx), diff.y/(ry*ry) );

    var a = dir.dot(mDir);
    var b = dir.dot(mDiff);
    var c = diff.dot(mDiff) - 1.0;
    var d = b*b - a*c;

    if ( d < 0 ) {
        result = new Intersection("Outside");
    } else if ( d > 0 ) {
        var root = Math.sqrt(d);
        var t_a  = (-b - root) / a;
        var t_b  = (-b + root) / a;

        if ( (t_a < 0 || 1 < t_a) && (t_b < 0 || 1 < t_b) ) {
            if ( (t_a < 0 && t_b < 0) || (t_a > 1 && t_b > 1) )
                result = new Intersection("Outside");
            else
                result = new Intersection("Inside");
        } else {
            result = new Intersection("Intersection");
            if ( 0 <= t_a && t_a <= 1 )
                result.appendPoint( a1.lerp(a2, t_a) );
            if ( 0 <= t_b && t_b <= 1 )
                result.appendPoint( a1.lerp(a2, t_b) );
        }
    } else {
        var t = -b/a;
        if ( 0 <= t && t <= 1 ) {
            result = new Intersection("Intersection");
            result.appendPoint( a1.lerp(a2, t) );
        } else {
            result = new Intersection("Outside");
        }
    }
    
    return result;
};


/*****
*
*   intersectEllipsePolygon
*
*****/
Intersection.intersectEllipsePolygon = function(c, rx, ry, points) {
    var result = new Intersection("None");
    var length = points.length;

    for ( var i = 0; i < length; i++ ) {
        var b1 = points[i];
        var b2 = points[(i+1) % length];
        var inter = Intersection.intersectEllipseLine(c, rx, ry, b1, b2);

        result.appendPoints(inter.points);
    }

    if ( result.points.length > 0 )
        result.status = "Intersection";

    return result;
};


/*****
*
*   intersectEllipseRectangle
*
*****/
Intersection.intersectEllipseRectangle = function(c, rx, ry, r1, r2) {
    var min        = r1.min(r2);
    var max        = r1.max(r2);
    var topRight   = new Point2D( max.x, min.y );
    var bottomLeft = new Point2D( min.x, max.y );
    
    var inter1 = Intersection.intersectEllipseLine(c, rx, ry, min, topRight);
    var inter2 = Intersection.intersectEllipseLine(c, rx, ry, topRight, max);
    var inter3 = Intersection.intersectEllipseLine(c, rx, ry, max, bottomLeft);
    var inter4 = Intersection.intersectEllipseLine(c, rx, ry, bottomLeft, min);
    
    var result = new Intersection("None");

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if ( result.points.length > 0 )
        result.status = "Intersection";

    return result;
};


/*****
*
*   intersectLineLine
*
*****/
Intersection.intersectLineLine = function(a1, a2, b1, b2) {
    var result;
    
    var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

    if ( u_b != 0 ) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;

        if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
            result = new Intersection("Intersection");
            result.points.push(
                new Point2D(
                    a1.x + ua * (a2.x - a1.x),
                    a1.y + ua * (a2.y - a1.y)
                )
            );
        } else {
            result = new Intersection("None");
        }
    } else {
        if ( ua_t == 0 || ub_t == 0 ) {
            result = new Intersection("Coincident");
        } else {
            result = new Intersection("Parallel");
        }
    }

    return result;
};


/*****
*
*   intersectLinePolygon
*
*****/
Intersection.intersectLinePolygon = function(a1, a2, points) {
    var result = new Intersection("None");
    var length = points.length;

    for ( var i = 0; i < length; i++ ) {
        var b1 = points[i];
        var b2 = points[(i+1) % length];
        var inter = Intersection.intersectLineLine(a1, a2, b1, b2);

        result.appendPoints(inter.points);
    }

    if ( result.points.length > 0 ) result.status = "Intersection";

    return result;
};


/*****
*
*   intersectLineRectangle
*
*****/
Intersection.intersectLineRectangle = function(a1, a2, r1, r2) {
    var min        = r1.min(r2);
    var max        = r1.max(r2);
    var topRight   = new Point2D( max.x, min.y );
    var bottomLeft = new Point2D( min.x, max.y );
    
    var inter1 = Intersection.intersectLineLine(min, topRight, a1, a2);
    var inter2 = Intersection.intersectLineLine(topRight, max, a1, a2);
    var inter3 = Intersection.intersectLineLine(max, bottomLeft, a1, a2);
    var inter4 = Intersection.intersectLineLine(bottomLeft, min, a1, a2);
    
    var result = new Intersection("None");

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);


    if ( result.points.length > 0 ) {
        result.status = "Intersection";
    } else {
        var inter5 = Intersection.intersectPointOnRect(a1,r1,r2);
        result.status = inter5.status;
    }

    return result;
};


/*****
*
*   intersectPolygonPolygon
*
*****/
Intersection.intersectPolygonPolygon = function(points1, points2) {
    var result = new Intersection("None");
    var length = points1.length;

    for ( var i = 0; i < length; i++ ) {
        var a1 = points1[i];
        var a2 = points1[(i+1) % length];
        var inter = Intersection.intersectLinePolygon(a1, a2, points2);

        result.appendPoints(inter.points);
    }

    if ( result.points.length > 0 )
        result.status = "Intersection";

    return result;

};


/*****
*
*   intersectPolygonRectangle
*
*****/
Intersection.intersectPolygonRectangle = function(points, r1, r2) {
    var min        = r1.min(r2);
    var max        = r1.max(r2);
    var topRight   = new Point2D( max.x, min.y );
    var bottomLeft = new Point2D( min.x, max.y );
    
    var inter1 = Intersection.intersectLinePolygon(min, topRight, points);
    var inter2 = Intersection.intersectLinePolygon(topRight, max, points);
    var inter3 = Intersection.intersectLinePolygon(max, bottomLeft, points);
    var inter4 = Intersection.intersectLinePolygon(bottomLeft, min, points);
    
    var result = new Intersection("None");

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if ( result.points.length > 0 )
        result.status = "Intersection";

    return result;
};


/*****
*
*   intersectRayRay
*
*****/
Intersection.intersectRayRay = function(a1, a2, b1, b2) {
    var result;
    
    var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

    if ( u_b != 0 ) {
        var ua = ua_t / u_b;

        result = new Intersection("Intersection");
        result.points.push(
            new Point2D(
                a1.x + ua * (a2.x - a1.x),
                a1.y + ua * (a2.y - a1.y)
            )
        );
    } else {
        if ( ua_t == 0 || ub_t == 0 ) {
            result = new Intersection("Coincident");
        } else {
            result = new Intersection("Parallel");
        }
    }

    return result;
};


/*****
*
*   intersectRectangleRectangle
*
*****/
Intersection.intersectRectangleRectangle = function(a1, a2, b1, b2) {
    var min        = a1.min(a2);
    var max        = a1.max(a2);
    var topRight   = new Point2D( max.x, min.y );
    var bottomLeft = new Point2D( min.x, max.y );
    
    var inter1 = Intersection.intersectLineRectangle(min, topRight, b1, b2);
    var inter2 = Intersection.intersectLineRectangle(topRight, max, b1, b2);
    var inter3 = Intersection.intersectLineRectangle(max, bottomLeft, b1, b2);
    var inter4 = Intersection.intersectLineRectangle(bottomLeft, min, b1, b2);
    
    var result = new Intersection("None");

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if ( result.points.length > 0 ) {
        result.status = "Intersection";
    } else {
        var inter5 = Intersection.intersectPointOnRect(a1,b1,b2);
        if (inter5.status == 'None') {
            var inter6 = Intersection.intersectPointOnRect(b1,a1,a2);
            if (inter6.status == 'None') {
                result.status = inter1.status;
            } else {
                result.status = inter6.status;
            }
        } else {
            result.status = inter5.status;
        }
    }

    return result;
};

/************************************************************
Chris' Point-based Checks

/*****
*
*   intersectPointPoint
*
*****/
Intersection.intersectPointPoint = function(p1,p2) {
    var result = new Intersection("None");
    
    if (p1.eq(p2)) {
        result.appendPoint(p1.clone());
        result.status = "Intersection";
    }
    
    return result;
}


/*****
*
*   intersectPointLine 
*
*   NOTE: the line may have a corona (i.e. thickness)
*
*****/
Intersection.intersectPointOnLine = function(p1,a1,a2,corona) {
    if ((corona===undefined) || (corona < .5)) { corona = .5; }
    var result = Intersection.intersectCircleLine(p1, corona, a1, a2);
    if (result.status != 'Outside') {
        result.status = 'Intersection';
        result.points = new Array(p1);
    }
}


/*****
*
*   intersectPointCircle
*
*   NOTE: this is a hit-based check against a filled circle; intersection is anywhere on or inside the radius
*
*****/
Intersection.intersectPointOnCircle = function(p1,c,r) {
    var result = new Intersection("None");

    if (p1.distanceFrom(c) <= r) {
        result.appendPoint(p1.clone());
        result.status = "Intersection";
    }
    
    return result;
}


/*****
*
*   intersectPointRect
*
*   NOTE: this is a hit-based check against a filled rect; intersection is anywhere on or inside the rect boundary
*
*****/
Intersection.intersectPointOnRect = function(p1,a1,a2) {
    var result = new Intersection("None");

    var min        = a1.min(a2);
    var max        = a1.max(a2);
    var topRight   = new Point2D( max.x, min.y );
    var bottomLeft = new Point2D( min.x, max.y );

    if ((p1.x <= topRight.x) && (p1.x >= bottomLeft.x) && (p1.y >= topRight.y) && (p1.y <= bottomLeft.y)) {
        result.appendPoint(p1.clone());
        result.status = "Intersection";
    }
    
    return result;
}


