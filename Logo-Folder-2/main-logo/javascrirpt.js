//Lettter Variables//
var h = document.querySelector('#svgH'),
  offsetH = h.getTotalLength();

var e = document.querySelector('#svgE'),
  offsetE = e.getTotalLength();

var n = document.querySelector('#svgN'),
  offsetN = n.getTotalLength();

var d = document.querySelector('#svgD'),
  offsetD = d.getTotalLength();

var y = document.querySelector('#svgY'),
  offsetY = y.getTotalLength();

//Set Stroke of Letters//
h.style.strokeDasharray = offsetH;
h.style.strokeDashOffset = offsetH;

e.style.strokeDasharray = offsetE;
e.style.strokeDashOffset = offsetE;

n.style.strokeDasharray = offsetN;
n.style.strokeDashOffset = offsetN;

d.style.strokeDasharray = offsetD;
d.style.strokeDashOffset = offsetD;

y.style.strokeDasharray = offsetY;
y.style.strokeDashOffset = offsetY;

//SVG Animation Function//
window.onload = function() {
  var offsetMe = function() {

    //Animate H//
    if (offsetH < 0) offsetH = 0;
    h.style.strokeDashoffset = offsetH;
    offsetH = offsetH - 75;

    //Animate E//
    if (offsetE < 0) offsetE = 0;
    e.style.strokeDashoffset = offsetE;
    offsetE = offsetE - 75;

    //Animate N//
    if (offsetN < 0) offsetN = 0;
    n.style.strokeDashoffset = offsetN;
    offsetN = offsetN - 75;

    //Animate D//
    if (offsetD < 0) offsetD = 0;
    d.style.strokeDashoffset = offsetD;
    offsetD = offsetD - 75;

    //Animate Y//
    if (offsetY < 0) offsetY = 0;
    y.style.strokeDashoffset = offsetY;
    offsetY = offsetY - 75;

    requestAnimationFrame(offsetMe);
  }
  offsetMe();
}