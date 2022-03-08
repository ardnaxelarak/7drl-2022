var digger;

const Terrain = {
  Rock: {value: 0, chr: ' ', light: false, enter: false},
  Wall: {value: 1, chr: '#', light: false, enter: false},
  Room: {value: 2, chr: '.', light: true, enter: true},
  Corridor: {value: 3, chr: '.', light: true, enter: true},
  Stair: {value: 4, chr: '>', light: true, enter: true, descend: true},
  Door: {value: 5, chr: '+', light: true, enter: true},
};

const Magic = {
  Red: {color: "#F66", symbol: "!"},
  Green: {color: "#0F0", symbol: "+"},
  Blue: {color: "#88F", symbol: "*"},
  Yellow: {color: "#FF0", symbol: "="},

  types: function() {
    return [this.Red, this.Green, this.Blue, this.Yellow];
  },
};

const Game = {
  width: 50,
  height: 30,
  display: null,
  map: [],
  fov: null,
  player: {hp: 5, hp_max: 10},

  init: function() {
    this.display = new ROT.Display({width: 80, height: 35, fontSize: 15, spacing: 1.1});
    document.body.appendChild(this.display.getContainer());
    document.body.addEventListener("keydown", this._keydown.bind(this));
    document.body.addEventListener("keypress", this._keypress.bind(this));
    this.fov = new ROT.FOV.PreciseShadowcasting(this._lightPasses.bind(this));
    this._generateMap();
    this._initDeck();
    this._updateState();
  },

  _getTerrain: function(x, y) {
    if (this.map[y] && this.map[y][x]) {
      return this.map[y][x].terrain;
    } else {
      return Terrain.Rock;
    }
  },

  _getSeen: function(x, y) {
    if (this.map[y] && this.map[y][x]) {
      return this.map[y][x].seen;
    } else {
      return false;
    }
  },

  _getSees: function(x, y) {
    if (this.map[y] && this.map[y][x]) {
      return this.map[y][x].sees;
    } else {
      return false;
    }
  },

  _sees: function(x, y) {
    if (this.map[y] && this.map[y][x]) {
      this.map[y][x].seen = true;
      this.map[y][x].sees = true;
    }
  },

  _lightPasses: function(x, y) {
    return this._getTerrain(x, y).light;
  },

  _tryMove: function(xd, yd) {
    if (this._getTerrain(this.player.x + xd, this.player.y + yd).enter) {
      this.player.x += xd;
      this.player.y += yd;
      this._updateState();
      return true;
    }
    return false;
  },

  _keydown: function(e) {
    switch (e.keyCode) {
      case ROT.KEYS.VK_LEFT:
        this._tryMove(-1, 0);
        break;
      case ROT.KEYS.VK_RIGHT:
        this._tryMove(1, 0);
        break;
      case ROT.KEYS.VK_UP:
        this._tryMove(0, -1);
        break;
      case ROT.KEYS.VK_DOWN:
        this._tryMove(0, 1);
        break;
    }
  },

  _initDeck: function() {
    this.player.deck = [];
    this.player.discard = [];
    this.player.hand = [];
    for (const type of Magic.types()) {
      for (var i = 0; i < 4; i++) {
        this.player.deck.push({type: type, value: 1});
      }
    }
    this.player.deck = ROT.RNG.shuffle(this.player.deck);
  },

  _fillHand: function() {
    while (this.player.hand.length < 4) {
      if (this.player.deck.length == 0) {
        if (this.player.discard.length == 0) {
          return;
        }
        this.player.deck = ROT.RNG.shuffle(this.player.discard);
        this.player.discard = [];
      }
      this.player.hand.push(this.player.deck.shift());
    }
  },

  _keypress: function(e) {
    const ch = String.fromCharCode(e.charCode);
    switch (ch) {
      case '>':
        if (this._getTerrain(this.player.x, this.player.y).descend) {
          this._generateMap();
          this._updateState();
        }
        break;
    }
  },

  _updateState: function() {
    for (var y = 0; y < this.map.length; y++) {
      for (var x = 0; x < this.map[y].length; x++) {
        this.map[y][x].sees = false;
      }
    }

    const callback = function(x, y, r, visibility) {
      this._sees(x, y);
    };

    this.fov.compute(this.player.x, this.player.y, 7, callback.bind(this));

    this._drawMap();

    this.display.drawText(2, 32, "Player the Explorer");
    this.display.drawText(2, 33, `HP: ${this.player.hp.toString().padStart(this.player.hp_max.toString().length)} / ${this.player.hp_max}`);

    this._fillHand();
    this.display.drawText(54, 1, "Hand:");
    this.display.drawText(54, 2, " ".repeat(15));
    var x = 54;
    for (var i = 0; i < this.player.hand.length; i++) {
      for (var j = 0; j < this.player.hand[i].value; j++) {
        this.display.draw(x, 2, this.player.hand[i].type.symbol, this.player.hand[i].type.color);
        x += 1;
      }
      x += 1;
    }
  },

  _drawMap: function() {
    for (var y = 0; y < this.map.length; y++) {
      for (var x = 0; x < this.map[y].length; x++) {
        if (this._getSeen(x, y)) {
          var bgcolor = "#000";
          if (this._getSees(x, y) && this._getTerrain(x, y).light) {
            bgcolor = "#444";
          }
          this.display.draw(x + 1, y + 1, this._getTerrain(x, y).chr, "#FFF", bgcolor);
        } else {
          this.display.draw(x + 1, y + 1, " ", "#FFF", "#000");
        }
      }
    }
    this.display.drawOver(this.player.x + 1, this.player.y + 1, '@', null, null);
  },

  _generateMap: function() {
    digger = new ROT.Map.Rogue(this.width, this.height);
    const digCallback = function(x, y, value) {
      if (!this.map[y]) {
        this.map[y] = [];
      }
      if (value == 0) {
        this.map[y][x] = {terrain: Terrain.Room};
      } else {
        this.map[y][x] = {terrain: Terrain.Rock};
      }
    };
    digger.create(digCallback.bind(this));

    for (const room of digger.rooms.flat()) {
      for (var i = 0; i < room.width + 2; i++) {
        this._setWall(room.x + i - 1, room.y - 1);
        this._setWall(room.x + i - 1, room.y + room.height);
      }
      for (var i = 0; i < room.height + 2; i++) {
        this._setWall(room.x - 1, room.y + i - 1);
        this._setWall(room.x + room.width, room.y + i - 1);
      }
    }

    const stairRoom = ROT.RNG.getItem(digger.rooms.flat());
    const stairX = stairRoom.x + Math.floor(ROT.RNG.getUniform() * stairRoom.width);
    const stairY = stairRoom.y + Math.floor(ROT.RNG.getUniform() * stairRoom.height);
    this.map[stairY][stairX].terrain = Terrain.Stair;

    const startRoom = ROT.RNG.getItem(digger.rooms.flat());
    this.player.x = startRoom.x + Math.floor(ROT.RNG.getUniform() * startRoom.width);
    this.player.y = startRoom.y + Math.floor(ROT.RNG.getUniform() * startRoom.height);
    if (!this._getTerrain(this.player.x, this.player.y).enter) {
      this._generateMap();
    }
  },

  _setWall: function(x, y) {
    if (this._getTerrain(x, y) == Terrain.Room) {
      this.map[y][x].terrain = Terrain.Door;
    } else {
      this.map[y][x].terrain = Terrain.Wall;
    }
  },
};
