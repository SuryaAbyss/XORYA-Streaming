// Netflix Cards Hover & Dynamic Translation Engine

$(document).ready(function () {
  $("section").each(function () {
    var $section = $(this);
    var $ul = $section.find("ul");
    var $items = $ul.children("li");
    var nLi = $items.length;

    if (nLi === 0) return;

    // 1. Dynamic Width Calculation based on item count
    var wElementPercent = 100 / nLi;
    $items.css("width", wElementPercent + "%");

    // 2. Hover Expansion & Dynamic Neighbor Translation
    $items.hover(
      function () {
        var $hovered = $(this);
        var index = $hovered.index();

        $hovered.addClass("hover");

        var scaleFactor = 1.8;
        var cardWidth = $hovered.outerWidth();
        var wBigElement = cardWidth * scaleFactor;
        var translation = (wBigElement - cardWidth) / 2;

        // Scale hovered card
        $hovered.css({
          "transform": "scale(" + scaleFactor + ")",
          "z-index": "50"
        });

        // First Card (nth-child(1)): Shift all subsequent siblings right by translation * 2
        if (index === 0) {
          $hovered.css("transform-origin", "0px center");
          $items.slice(1).css("transform", "translate(" + (translation * 2) + "px, 0px)");
        }
        // Last Card (nth-child(N)): Shift all preceding siblings left by -translation * 2
        else if (index === nLi - 1) {
          $hovered.css("transform-origin", "100% center");
          $items.slice(0, nLi - 1).css("transform", "translate(-" + (translation * 2) + "px, 0px)");
        }
        // Middle Cards: Shift preceding left by -translation and subsequent right by +translation
        else {
          $hovered.css("transform-origin", "center center");
          $items.slice(0, index).css("transform", "translate(-" + translation + "px, 0px)");
          $items.slice(index + 1).css("transform", "translate(" + translation + "px, 0px)");
        }
      },
      // Mouse Out: Reset transform and z-index
      function () {
        var $hovered = $(this);
        $hovered.removeClass("hover");

        $items.css({
          "transform": "translate(0px, 0px) scale(1)",
          "z-index": "1"
        });
      }
    );
  });
});