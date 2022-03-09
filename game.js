var digger;

function randomInt(max) {
  return Math.floor(ROT.RNG.getUniform() * max);
}

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
};
Magic.types = [Magic.Red, Magic.Green, Magic.Blue, Magic.Yellow];

const Spells = {
  MinorHeal: {name: "Minor Heal", type: Magic.Green, cost: 1, heal: 3},
  FireBolt: {name: "Fire Bolt", type: Magic.Red, cost: 1, damage: 5},
  FrostBolt: {name: "Frost Bolt", type: Magic.Blue, cost: 1, damage: 5},
  AcidBolt: {name: "Acid Bolt", type: Magic.Yellow, cost: 1, damage: 5},
};

const Creatures = {
  Kobold: {name: "kobold", color: "#D83", symbol: "k", health: 5, damage: 1},
};

const Items = {
  gold: function(amount) {
    return {type: "gold", amount: amount, color: "#FE2", symbol: "$"};
  },

  card: function(type, value) {
    return {type: "card", card: {type: type, value: value}, color: type.color, symbol: type.symbol};
  },
};

const Payments = [
  [[1], [0, 1], [0, 0, 1]],
  [[2], [0, 1], [0, 0, 1]],
  [[3], [1, 1], [0, 0, 1], [0, 2]],
  [[4], [2, 1], [0, 2], [1, 0, 1], [0, 1, 1], [0, 0, 2]],
  [[5], [3, 1], [1, 2], [2, 0, 1], [0, 1, 1], [0, 3], [0, 0, 2]],
];

const Game = {
  width: 50,
  height: 30,
  display: null,
  map: [],
  fov: null,
  output: [],
  player: {},
  creatures: [],

  init: function() {
    this.display = new ROT.Display({width: 80, height: 35, fontSize: 15, spacing: 1.1});
    document.getElementById("container").appendChild(this.display.getContainer());
    document.body.addEventListener("keydown", this._keydown.bind(this));
    document.body.addEventListener("keypress", this._keypress.bind(this));
    this.fov = new ROT.FOV.PreciseShadowcasting(this._lightPasses.bind(this));
    this._initGame();
  },

  _initGame: function() {
    this.player.hp = 10;
    this.player.hp_max = 10;
    this.player.gold = 0;
    this.player.spellbook = [Spells.MinorHeal, Spells.FireBolt, Spells.FrostBolt, Spells.AcidBolt];
    this.player.target = null;
    this._generateMap(1);
    this._initDeck();
    this._updateState();
  },

  _createMonster: function(x, y, type) {
    this.creatures.push({x: x, y: y, type: type, hp: type.health});
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

  _getTopItem: function(x, y) {
    if (this.map[y] && this.map[y][x] && this.map[y][x].items) {
      return this.map[y][x].items[0];
    } else {
      return null;
    }
  },

  _sees: function(x, y) {
    if (this.map[y] && this.map[y][x]) {
      this.map[y][x].seen = true;
      this.map[y][x].sees = true;
    }
  },

  _pickUp: function(x, y) {
    if (this.map[y] && this.map[y][x] && this.map[y][x].items) {
      while (this.map[y][x].items.length > 0) {
        const item = this.map[y][x].items.shift();
        switch (item.type) {
          case "gold":
            this.player.gold += item.amount;
            this._write(`${item.amount} gold acquired.`);
            break;
          case "card":
            this.player.discard.push(item.card);
            this._write(`%c{${item.card.type.color}}${item.card.type.symbol.repeat(item.card.value)}%c{} card acquired.`);
            break;
        }
      }
    }
  },

  _lightPasses: function(x, y) {
    return this._getTerrain(x, y).light;
  },

  _passability: function(entity) {
    const callback = function(x, y) {
      if (!this._getTerrain(x, y).enter) {
        return false;
      }
      for (const creature of this.creatures) {
        if (creature != entity && creature.x == x && creature.y == y) {
          return false;
        }
      }
      return true;
    };
    return callback.bind(this);
  },

  _tryMove: function(xd, yd) {
    if (this._passability(null)(this.player.x + xd, this.player.y + yd)) {
      this.player.x += xd;
      this.player.y += yd;
      this._pickUp(this.player.x, this.player.y);
      this._tick();
      return true;
    }
    return false;
  },

  _keydown: function(e) {
    switch (e.keyCode) {
      case ROT.KEYS.VK_LEFT:
      case ROT.KEYS.VK_H:
      case ROT.KEYS.VK_A:
        this._tryMove(-1, 0);
        break;
      case ROT.KEYS.VK_RIGHT:
      case ROT.KEYS.VK_L:
      case ROT.KEYS.VK_D:
        this._tryMove(1, 0);
        break;
      case ROT.KEYS.VK_UP:
      case ROT.KEYS.VK_K:
      case ROT.KEYS.VK_W:
        this._tryMove(0, -1);
        break;
      case ROT.KEYS.VK_DOWN:
      case ROT.KEYS.VK_J:
      case ROT.KEYS.VK_S:
        this._tryMove(0, 1);
        break;
      case ROT.KEYS.VK_1:
        this._castSpell(0);
        break;
      case ROT.KEYS.VK_2:
        this._castSpell(1);
        break;
      case ROT.KEYS.VK_3:
        this._castSpell(2);
        break;
      case ROT.KEYS.VK_4:
        this._castSpell(3);
        break;
      case ROT.KEYS.VK_5:
        this._castSpell(4);
        break;
      case ROT.KEYS.VK_6:
        this._castSpell(5);
        break;
      case ROT.KEYS.VK_7:
        this._castSpell(6);
        break;
      case ROT.KEYS.VK_8:
        this._castSpell(7);
        break;
      case ROT.KEYS.VK_9:
        this._castSpell(8);
        break;
      case ROT.KEYS.VK_0:
        this._castSpell(9);
        break;
      case ROT.KEYS.VK_OPEN_BRACKET:
      case ROT.KEYS.VK_P:
        this._prevTarget();
        break;
      case ROT.KEYS.VK_CLOSE_BRACKET:
      case ROT.KEYS.VK_N:
        this._nextTarget();
        break;
    }
  },

  _keypress: function(e) {
    const ch = String.fromCharCode(e.charCode);
    switch (ch) {
      case '>':
        if (this._getTerrain(this.player.x, this.player.y).descend) {
          this._write(`Descending to depth ${this.player.floor + 1}.`);
          this._generateMap(this.player.floor + 1);
          this._tick();
        }
        break;
    }
  },

  _initDeck: function() {
    this.player.deck = [];
    this.player.discard = [];
    this.player.hand = [];
    for (const type of Magic.types) {
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

  _canCast: function(spell) {
    var count = 0;
    for (const card of this.player.hand) {
      if (card.type == spell.type) {
        count += card.value;
      }
    }
    return count >= spell.cost;
  },

  _paySpell: function(spell) {
    const counts = [0, 0, 0];
    for (var i = 0; i < this.player.hand.length; i++) {
      const card = this.player.hand[i];
      if (card.type == spell.type) {
        counts[card.value - 1] += 1;
      }
    }

    const attempts = Payments[spell.cost - 1];
    var solution = null;
    for (const attempt of attempts) {
      var valid = true;
      for (var i = 0; i < attempt.length; i++) {
        if (attempt[i] > counts[i]) {
          valid = false;
          break;
        }
      }
      if (valid) {
        solution = attempt;
        break;
      }
    }

    if (solution) {
      for (var i = 0; i < solution.length; i++) {
        for (var j = 0; j < solution[i]; j++) {
          for (var k = 0; k < this.player.hand.length; k++) {
            const card = this.player.hand[k];
            if (card.type == spell.type && card.value == i + 1) {
              this.player.discard.push(this.player.hand[k]);
              this.player.hand.splice(k, 1);
              break;
            }
          }
        }
      }
    } else {
      console.log("No payment found");
    }
  },

  _castSpell: function(index) {
    const spell = this.player.spellbook[index];
    if (!spell || !this._canCast(spell)) {
      return;
    }
    if (spell.heal && this.player.hp >= this.player.hp_max) {
      return;
    }
    if (spell.damage && !this.player.target) {
      return;
    }
    this._paySpell(spell);
    this._write(`Casted ${spell.name}.`);
    if (spell.heal) {
      this.player.hp = Math.min(this.player.hp_max, this.player.hp + spell.heal);
    }
    if (spell.damage) {
      this.player.target.hp = Math.max(0, this.player.target.hp - spell.damage);
      if (this.player.target.hp <= 0) {
        const index = this.creatures.indexOf(this.player.target);
        if (index >= 0) {
          this.creatures.splice(index, 1);
        }
        this._write(`Killed the ${this.player.target.type.name}.`);
        this.player.target = null;
      }
    }
    this._tick();
  },

  _write: function(text) {
    this.output.unshift(text);
    while (this.output.length > 9) {
      this.output.pop();
    }
  },

  _getText: function() {
    var text = "";
    if (this.output.length > 0) {
      text += "%c{white}" + this.output[0].replace(/%c{}/g, "%c{white}") + "%c{}";
    }
    for (var i = 1; i < this.output.length; i++) {
      text += "\n" + this.output[i];
    }
    return text;
  },

  _tick: function() {
    for (const creature of this.creatures) {
      creature.sees_player = false;
      creature.moved = false;
      const sightCallback = function(x, y, r, visibility) {
        if (x == this.player.x && y == this.player.y) {
          creature.sees_player = true;
        }
      };

      this.fov.compute(creature.x, creature.y, 10, sightCallback.bind(this));

      if (creature.sees_player) {
        if (Math.abs(creature.x - this.player.x) <= 1 && Math.abs(creature.y - this.player.y) <= 1) {
          this.player.hp = Math.max(0, this.player.hp - creature.type.damage);
          this._write(`The ${creature.type.name} hits!`);
          if (this.player.hp <= 0) {
            this._write("You are dead.");
          }
          creature.moved = true;
        } else {
          const pathfinder = new ROT.Path.AStar(this.player.x, this.player.y, this._passability(creature), {topology: 4});
          const pathCallback = function(x, y) {
            if (creature.moved || (creature.x == x && creature.y == y)) {
              return;
            }
            creature.x = x;
            creature.y = y;
            creature.moved = true;
          };
          pathfinder.compute(creature.x, creature.y, pathCallback.bind(this));
        }
      }
    }
    this._updateState();
  },

  _getSortedTargetList: function() {
    const list = [];
    for (const creature of this.creatures) {
      if (this._getSees(creature.x, creature.y)) {
        const dx = creature.x - this.player.x;
        const dy = creature.y - this.player.y;
        list.push({creature: creature, dist2: dx * dx + dy * dy});
      }
    }
    list.sort(this._cmpTarget);
    return list;
  },

  _cmpTarget: function(a, b) {
    return a.dist2 - b.dist2;
  },

  _targetIndex: function(list, creature) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].creature == creature) {
        return i;
      }
    }
    return -1;
  },

  _prevTarget: function() {
    const list = this._getSortedTargetList();
    if (list.length == 0) {
      return;
    }
    var index = this._targetIndex(list, this.player.target);
    if (index < 0) {
      index = 0;
    }
    const newIndex = (index - 1 + list.length) % list.length;
    this.player.target = list[newIndex].creature;
    this._updateState();
  },

  _nextTarget: function() {
    const list = this._getSortedTargetList();
    if (list.length == 0) {
      return;
    }
    var index = this._targetIndex(list, this.player.target);
    if (index < 0) {
      index = -1;
    }
    const newIndex = (index + 1) % list.length;
    this.player.target = list[newIndex].creature;
    this._updateState();
  },

  _findTarget: function() {
    const list = this._getSortedTargetList();
    if (list.length > 0) {
      this.player.target = list[0].creature;
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

    if (this.player.target && !this._getSees(this.player.target.x, this.player.target.y)) {
      this.player.target = null;
    }
    if (!this.player.target) {
      this._findTarget();
    }

    this._drawMap();

    this.display.drawText(2, 32, "Player the Explorer");
    this.display.drawText(2, 33, `HP: ${this.player.hp.toString().padStart(this.player.hp_max.toString().length)} / ${this.player.hp_max}`);
    this.display.drawText(17, 33, `%c{#FE2}$${this.player.gold}`);

    for (var i = 0; i < this.display.getOptions().height; i++) {
      for (var j = 54; j < this.display.getOptions().width; j++) {
        this.display.draw(j, i, " ");
      }
    }
    this.display.drawText(54, 1, this._getText(), 24);
    for (var i = 10; i < this.display.getOptions().height; i++) {
      for (var j = 54; j < this.display.getOptions().width; j++) {
        this.display.draw(j, i, " ");
      }
    }

    this._fillHand();
    this.display.drawText(54, 11, "%c{white}Hand:");
    var x = 54;
    for (var i = 0; i < this.player.hand.length; i++) {
      for (var j = 0; j < this.player.hand[i].value; j++) {
        this.display.draw(x, 12, this.player.hand[i].type.symbol, this.player.hand[i].type.color);
        x += 1;
      }
      x += 1;
    }

    this.display.drawText(54, 14, "%c{white}Spellbook:");
    for (var i = 0; i < this.player.spellbook.length; i++) {
      const spell = this.player.spellbook[i];
      var color = "#888";
      if (this._canCast(spell)) {
        color = "white";
      }
      this.display.drawText(54, 15 + i, `%c{${color}}${(i + 1) % 10}: %c{${spell.type.color}}${spell.type.symbol.repeat(spell.cost).padEnd(5)}%c{${color}} ${spell.name}`);
    }
  },

  _drawMap: function() {
    for (var y = 0; y < this.map.length; y++) {
      for (var x = 0; x < this.map[y].length; x++) {
        if (this._getSeen(x, y)) {
          var bgcolor = "#000";
          var fgcolor = "#FFF";
          var symbol = this._getTerrain(x, y).chr;
          if (this._getSees(x, y) && this._getTerrain(x, y).light) {
            bgcolor = "#444";
            const item = this._getTopItem(x, y);
            if (item) {
              fgcolor = item.color;
              symbol = item.symbol;
            }
          }
          this.display.draw(x + 1, y + 1, symbol, fgcolor, bgcolor);
        } else {
          this.display.draw(x + 1, y + 1, " ", "#FFF", "#000");
        }
      }
    }

    for (const creature of this.creatures) {
      if (this._getSees(creature.x, creature.y)) {
        this.display.drawOver(creature.x + 1, creature.y + 1, creature.type.symbol, creature.type.color, null);
        if (creature == this.player.target) {
          this.display.drawOver(creature.x + 1, creature.y + 1, null, "#000", "#FFF");
        }
      }
    }
    this.display.drawOver(this.player.x + 1, this.player.y + 1, '@', "#FFF", null);
  },

  _generateMap: function(floor) {
    digger = new ROT.Map.Rogue(this.width, this.height);
    const digCallback = function(x, y, value) {
      if (!this.map[y]) {
        this.map[y] = [];
      }
      if (value == 0) {
        this.map[y][x] = {terrain: Terrain.Corridor, items: []};
      } else {
        this.map[y][x] = {terrain: Terrain.Rock, items: []};
      }
    };
    digger.create(digCallback.bind(this));

    const spaces = [];

    for (const room of digger.rooms.flat()) {
      for (var i = 0; i < room.width + 2; i++) {
        this._setWall(room.x + i - 1, room.y - 1);
        this._setWall(room.x + i - 1, room.y + room.height);
      }
      for (var i = 0; i < room.height + 2; i++) {
        this._setWall(room.x - 1, room.y + i - 1);
        this._setWall(room.x + room.width, room.y + i - 1);
      }
      for (var j = 0; j < room.height; j++) {
        for (var i = 0; i < room.width; i++) {
          this.map[room.y + j][room.x + i].type = Terrain.Room;
          spaces.push({x: room.x + i, y: room.y + j});
        }
      }
    }

    const rooms = ROT.RNG.shuffle(digger.rooms.flat());

    const stairX = rooms[0].x + randomInt(rooms[0].width);
    const stairY = rooms[0].y + randomInt(rooms[0].height);
    this.map[stairY][stairX].terrain = Terrain.Stair;

    this.player.x = rooms[1].x + randomInt(rooms[1].width);
    this.player.y = rooms[1].y + randomInt(rooms[1].height);
    this.player.floor = floor;

    const cardX = rooms[2].x + randomInt(rooms[2].width);
    const cardY = rooms[2].y + randomInt(rooms[2].height);
    this.map[cardY][cardX].items.push(Items.card(ROT.RNG.getItem(Magic.types), 2));

    const placements = ROT.RNG.shuffle(spaces);
    for (var i = 0; i < Math.min(12, placements.length); i++) {
      const space = placements[i];
      if (space.x == this.player.x && space.y == this.player.y) {
        continue;
      }
      this._createMonster(space.x, space.y, Creatures.Kobold);
    }

    for (var i = 3; i < rooms.length; i++) {
      const goldX = rooms[i].x + randomInt(rooms[i].width);
      const goldY = rooms[i].y + randomInt(rooms[i].height);
      this.map[goldY][goldX].items.push(Items.gold(randomInt(floor) + 1));
    }

    this.map[stairY][stairX].terrain = Terrain.Stair;
    if (!this._getTerrain(this.player.x, this.player.y).enter) {
      this._generateMap(floor);
    }
  },

  _setWall: function(x, y) {
    if (this._getTerrain(x, y) == Terrain.Corridor) {
      this.map[y][x].terrain = Terrain.Door;
    } else {
      this.map[y][x].terrain = Terrain.Wall;
    }
  },
};
