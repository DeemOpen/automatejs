roomba
======

*Not ready for public yet*
Automated javascript testing

Same test using roomba
```javascript
var Roomba = require("roomba"),
    expect = require("chai").expect,
    roomba = new Roomba();
    
roomba.waitFor({
    view: "dashboard-container"
});


roomba.tap("#dashboard-upcoming div");

roomba.waitFor({
    view: "upcoming-container"
});

roomba.tap("#itineraryList li:eq(1)");  
roomba.waitFor({
    view: "upcoming-details"
});

roomba.then(function() {
    expect($(".uiPageActive .subToolBar em").html()).to.contain.string("Philadelphia to SF");
});
```
