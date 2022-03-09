var digger;

function randomInt(max) {
  return Math.floor(ROT.RNG.getUniform() * max);
}

const Colors = {
  Red: "#F66",
  Green: "#0F0",
  Blue: "#88F",
  Yellow: "#FF0",
  Gold: "#FE2",
};

const Terrain = {
  Rock: {value: 0, chr: ' ', light: false, enter: false},
  Wall: {value: 1, chr: '#', light: false, enter: false},
  Room: {value: 2, chr: '.', light: true, enter: true},
  Corridor: {value: 3, chr: '.', light: true, enter: true},
  Stair: {value: 4, chr: '>', light: true, enter: true, descend: true},
  Door: {value: 5, chr: '+', light: true, enter: true},
};

const Magic = {
  Green: {color: "#0F0", symbol: "+"},
  Red: {color: "#F66", symbol: "!"},
  Blue: {color: "#88F", symbol: "*"},
  Yellow: {color: "#FF0", symbol: "="},
};
Magic.types = [Magic.Green, Magic.Red, Magic.Blue, Magic.Yellow];

const Spells = {
  MinorHeal: {name: "Minor Heal", type: Magic.Green, cost: 1, heal: 3},
  FireBolt: {name: "Fire Bolt", type: Magic.Red, cost: 1, damage: 5},
  FrostBolt: {name: "Frost Bolt", type: Magic.Blue, cost: 1, damage: 5},
  AcidBolt: {name: "Acid Bolt", type: Magic.Yellow, cost: 1, damage: 5},
  Heal: {name: "Heal", type: Magic.Green, cost: 2, heal: 7},
  FireBlast: {name: "Fire Blast", type: Magic.Red, cost: 2, damage: 11},
  FrostBlast: {name: "Frost Blast", type: Magic.Blue, cost: 2, damage: 11},
  AcidBlast: {name: "Acid Blast", type: Magic.Yellow, cost: 2, damage: 11},
  FireBall: {name: "Fireball", type: Magic.Red, cost: 3, damage: 15, radius: 1},
  FrostBall: {name: "Frost Orb", type: Magic.Blue, cost: 3, damage: 15, radius: 1},
  AcidBall: {name: "Acid Splash", type: Magic.Yellow, cost: 3, damage: 15, radius: 1},
};

const Creatures = {
  GridBug: {name: "grid bug", color: "#F1E", symbol: "x", health: 5, damage: 1, level: 1},
  Snake: {name: "snake", color: "#6F6", symbol: "S", health: 4, damage: 1, level: 1},
  GiantAnt: {name: "giant ant", color: "#B72", symbol: "a", health: 8, damage: 2, level: 2},
  CaveSpider: {name: "cave spider", color: "#BBB", symbol: "s", health: 10, damage: 1, level: 2},
  Jackal: {name: "jackal", color: "#B72", symbol: "d", health: 11, damage: 3, level: 3},
  Kobold: {name: "kobold", color: "#D83", symbol: "k", health: 22, damage: 3, level: 4},
  RedDragon: {name: "red dragon", color: "#F66", symbol: "D", health: 100, damage: 5, level: 6},
};

const Items = {
  gold: function(amount) {
    return {type: "gold", amount: amount, color: Colors.Gold, symbol: "$"};
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
  streak: null,
  store: false,
  ctrl: false,
  shift: false,
  storeSpells: [],
  storeCards: [],
  storeMisc: [],

  init: function() {
    this.display = new ROT.Display({width: 90, height: 35, fontSize: 15, spacing: 1.1});
    document.getElementById("container").appendChild(this.display.getContainer());
    document.body.addEventListener("keydown", this._keydown.bind(this));
    document.body.addEventListener("keyup", this._keyup.bind(this));
    document.body.addEventListener("keypress", this._keypress.bind(this));
    this.fov = new ROT.FOV.PreciseShadowcasting(this._lightPasses.bind(this));
    this._initGame();
  },

  _getState: function() {
    if (this.player.hp <= 0) {
      return "dead";
    } else if (this.store) {
      return "store";
    } else {
      return "map";
    }
  },

  _initGame: function() {
    this.player.hp = 10;
    this.player.hp_max = 10;
    this.player.gold = 0;
    this.player.spellbook = [Spells.MinorHeal, Spells.FireBolt, Spells.FrostBolt, Spells.AcidBolt, Spells.Heal];
    this.output = [];
    this.storeSpells = [
      {spell: Spells.FireBlast, cost: 30},
      {spell: Spells.FrostBlast, cost: 30},
      {spell: Spells.AcidBlast, cost: 30},
      {spell: Spells.FireBall, cost: 100},
      {spell: Spells.FrostBall, cost: 100},
      {spell: Spells.AcidBall, cost: 100},
    ];
    this.storeCards = [];
    for (var i = 0; i <= 1; i++) {
      for (const type of Magic.types) {
        this.storeCards.push({card: {type: type, value: 2 + i}, cost: 30 + 70 * i});
      }
    }
    this.storeMisc = [
      {
        name: "+5 Max HP",
        cost: function() {
          return this.player.hp_max * 3;
        },
        valid: function() {
          return true;
        },
        action: function() {
          this.player.hp_max += 5;
          this.player.hp = this.player.hp_max;
          this._write("Max HP increased.");
        },
      },
      {
        name: "Full Heal",
        cost: function() {
          return 2 * Math.floor(this.player.hp_max / 5);
        },
        valid: function() {
          return this.player.hp < this.player.hp_max;
        },
        action: function() {
          this.player.hp = this.player.hp_max;
          this._write("HP restored.");
        },
      },
    ];
    this.player.target = null;
    this._generateMap(1);
    this._initDeck();
    this._updateState();
  },

  _createMonster: function(x, y, floor) {
    const types = ROT.RNG.shuffle(Object.values(Creatures));
    var i = 0;
    while (i < types.length && types[i].level > floor) {
      i += 1;
    }
    if (i < types.length) {
      this.creatures.push({x: x, y: y, type: types[i], hp: types[i].health});
    }
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

  _numberPressed: function(num) {
    switch (this._getState()) {
      case "map":
        this._castSpell(num);
        break;
      case "store":
        if (!this.ctrl && !this.shift) {
          this._buyMisc(num);
        } else if (!this.ctrl) {
          this._buySpell(num);
        } else if (!this.shift) {
          this._buyCard(num);
        }
        break;
    }
  },

  _keydown: function(e) {
    switch (e.keyCode) {
      case ROT.KEYS.VK_CONTROL:
        this.ctrl = true;
        break;
      case ROT.KEYS.VK_SHIFT:
        this.shift = true;
        break;
      case ROT.KEYS.VK_LEFT:
      case ROT.KEYS.VK_H:
      case ROT.KEYS.VK_A:
        if (this._getState() == "map") {
          this._tryMove(-1, 0);
        }
        e.preventDefault();
        break;
      case ROT.KEYS.VK_RIGHT:
      case ROT.KEYS.VK_L:
      case ROT.KEYS.VK_D:
        if (this._getState() == "map") {
          this._tryMove(1, 0);
        }
        e.preventDefault();
        break;
      case ROT.KEYS.VK_UP:
      case ROT.KEYS.VK_K:
      case ROT.KEYS.VK_W:
        if (this._getState() == "map") {
          this._tryMove(0, -1);
        }
        e.preventDefault();
        break;
      case ROT.KEYS.VK_DOWN:
      case ROT.KEYS.VK_J:
      case ROT.KEYS.VK_S:
        if (this._getState() == "map") {
          this._tryMove(0, 1);
        }
        e.preventDefault();
        break;
      case ROT.KEYS.VK_C:
        if (this._getState() == "store") {
          this.store = false;
          this._generateMap(this.player.floor + 1);
          this._updateState();
        }
        e.preventDefault();
        break;
      case ROT.KEYS.VK_R:
        if (this._getState() == "dead") {
          this._initGame();
          e.preventDefault();
        }
        break;
      case ROT.KEYS.VK_1:
        this._numberPressed(0);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_2:
        this._numberPressed(1);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_3:
        this._numberPressed(2);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_4:
        this._numberPressed(3);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_5:
        this._numberPressed(4);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_6:
        this._numberPressed(5);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_7:
        this._numberPressed(6);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_8:
        this._numberPressed(7);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_9:
        this._numberPressed(8);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_0:
        this._numberPressed(9);
        e.preventDefault();
        break;
      case ROT.KEYS.VK_OPEN_BRACKET:
      case ROT.KEYS.VK_P:
        if (this._getState() == "map") {
          this._prevTarget();
        }
        e.preventDefault();
        break;
      case ROT.KEYS.VK_CLOSE_BRACKET:
      case ROT.KEYS.VK_N:
        if (this._getState() == "map") {
          this._nextTarget();
        }
        e.preventDefault();
        break;
    }
  },

  _keyup: function(e) {
    switch (e.keyCode) {
      case ROT.KEYS.VK_CONTROL:
        this.ctrl = false;
        break;
      case ROT.KEYS.VK_SHIFT:
        this.shift = false;
        break;
    }
  },

  _keypress: function(e) {
    const ch = String.fromCharCode(e.charCode);
    switch (ch) {
      case '>':
        if (this._getState() == "map" && this._getTerrain(this.player.x, this.player.y).descend) {
          this._write(`Descending to depth ${this.player.floor + 1}.`);
          this.store = true;
          this._updateState();
        }
        e.preventDefault();
        break;
    }
  },

  _initDeck: function() {
    this.player.deck = [];
    this.player.discard = [];
    this.player.hand = [];
    for (const type of Magic.types) {
      var count = 4;
      if (type == Magic.Green) {
        count = 2;
      }
      for (var i = 0; i < count; i++) {
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

  _buySpell: function(num) {
    const item = this.storeSpells[num];
    if (!item || item.cost > this.player.gold) {
      return false;
    }
    this.player.gold -= item.cost;
    this.player.spellbook.push(item.spell);
    this.storeSpells.splice(num, 1);
    this._write(`${item.spell.name} learned.`);
    this._updateState();
  },

  _buyCard: function(num) {
    const item = this.storeCards[num];
    if (!item || item.cost > this.player.gold) {
      return false;
    }
    this.player.gold -= item.cost;
    this.player.discard.push(item.card);
    this._write(`%c{${item.card.type.color}}${item.card.type.symbol.repeat(item.card.value)}%c{} card acquired.`);
    this._updateState();
  },

  _buyMisc: function(num) {
    const item = this.storeMisc[num];
    const cost = item.cost.bind(this)();
    if (!item || !item.valid.bind(this)() || cost > this.player.gold) {
      return false;
    }
    this.player.gold -= cost;
    item.action.bind(this)();
    this._updateState();
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
    var modifier = 0;
    if (this.streak && this.streak.type == spell.type) {
      modifier = this.streak.length;
      this.streak.length += 1;
    } else {
      this.streak = {type: spell.type, length: 1};
    }
    if (spell.heal && spell.heal > modifier) {
      this.player.hp = Math.min(this.player.hp_max, this.player.hp + spell.heal - modifier);
      this._write(`${spell.name} heals ${spell.heal - modifier} hp.`);
    }
    if (spell.damage && spell.damage > modifier) {
      const targets = [this.player.target];
      if (spell.radius && spell.radius > 0) {
        const r2 = spell.radius * spell.radius + 1;
        for (const creature of this.creatures) {
          if (creature == this.player.target) {
            continue;
          }
          const dx = creature.x - this.player.target.x;
          const dy = creature.y - this.player.target.y;
          if (r2 >= dx * dx + dy * dy) {
            targets.push(creature);
          }
        }
      }
      for (const target of targets) {
        target.hp = Math.max(0, target.hp - spell.damage + modifier);
        this._write(`${spell.name} deals ${spell.damage - modifier} damage to the ${target.type.name}.`);
        if (target.hp <= 0) {
          const index = this.creatures.indexOf(target);
          if (index >= 0) {
            this.creatures.splice(index, 1);
          }
          this._write(`Killed the ${target.type.name}.`);
          const gold = randomInt(target.type.level + 1);
          if (gold > 0) {
            this.map[target.y][target.x].items.push(Items.gold(gold));
          }
          if (target == this.player.target) {
            this.player.target = null;
          }
        }
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
          creature.moved = true;
          if (this.player.hp <= 0) {
            this._write("You are dead. Press R to restart.");
            break;
          }
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
    for (var i = 0; i < this.display.getOptions().height; i++) {
      for (var j = 0; j < this.display.getOptions().width; j++) {
        this.display.draw(j, i, " ");
      }
    }

    if (this.store) {
      var linenum = 1;
      this.display.drawText(2, linenum++, "############ The Kerfuffal's Cravings ############");
      this.display.drawText(2, linenum++, "#%c{white} === Spells (shift + number) ===");
      var color = "";
      for (i = 0; i < this.storeSpells.length; i++) {
        const item = this.storeSpells[i];
        const spell = item.spell;
        color = "";
        if (item.cost > this.player.gold) {
          color = "#666";
        }
        var line = `${spell.name} (%c{${spell.type.color}}${spell.type.symbol.repeat(spell.cost)}%c{${color}}`;
        if (spell.heal) {
          line += `, ${spell.heal} healing`;
        }
        if (spell.damage) {
          line += `, ${spell.damage} damage`;
        }
        if (spell.radius) {
          line += `, AoE: ${spell.radius}`;
        }
        line += ")";
        this.display.drawText(2, linenum++, `#%c{${color}} S${(i + 1) % 10}: %c{${Colors.Gold}}${("$" + item.cost).padStart(5)}%c{${color}} ${line}`);
      }
      this.display.drawText(2, linenum++, "#");
      this.display.drawText(2, linenum++, "#%c{white} === Cards (ctrl + number) ===");
      for (i = 0; i < this.storeCards.length; i++) {
        const item = this.storeCards[i];
        const card = item.card;
        color = "";
        if (item.cost > this.player.gold) {
          color = "#666";
        }
        var line = `%c{${card.type.color}}${card.type.symbol.repeat(card.value)}%c{${color}} Card`;
        this.display.drawText(2, linenum++, `#%c{${color}} C${(i + 1) % 10}: %c{${Colors.Gold}}${("$" + item.cost).padStart(5)}%c{${color}} ${line}`);
      }
      this.display.drawText(2, linenum++, "#");
      this.display.drawText(2, linenum++, "#%c{white} === Miscellaneous ===");
      for (i = 0; i < this.storeMisc.length; i++) {
        const item = this.storeMisc[i];
        const cost = item.cost.bind(this)();
        color = "";
        if (cost > this.player.gold || !item.valid.bind(this)()) {
          color = "#666";
        }
        this.display.drawText(2, linenum++, `#%c{${color}}  ${(i + 1) % 10}: %c{${Colors.Gold}}${("$" + cost).padStart(5)}%c{${color}} ${item.name}`);
      }
      this.display.drawText(2, linenum++, "#");
      this.display.drawText(2, linenum++,  "#".repeat(50));
      for (var i = 1; i < linenum; i++) {
        this.display.draw(51, i, "#");
      }
      this.display.drawText(17, linenum++, "%c{white}Press C to Continue");
    } else {
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
    }

    if (this._getState() == "dead") {
      this.display.drawText(2, 32, "Player the Deceased");
    } else {
      this.display.drawText(2, 32, "Player the Explorer");
    }
    this.display.drawText(25, 32, `Depth: ${this.player.floor}`);
    this.display.drawText(2, 33, `HP: ${this.player.hp.toString().padStart(this.player.hp_max.toString().length)} / ${this.player.hp_max}`);
    this.display.drawText(17, 33, `%c{${Colors.Gold}}$${this.player.gold}`);

    this.display.drawText(54, 1, this._getText(), 34);
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
    this.display.drawText(72, 11, "%c{white}Target:");
    if (this.player.target) {
      const target = this.player.target;
      this.display.draw(72, 12, target.type.symbol, target.type.color);
      this.display.drawText(74, 12, target.type.name);
      this.display.drawText(72, 13, `Dmg: ${target.type.damage} HP: ${target.hp}`);
    } else {
      this.display.drawText(72, 12, "[none]");
    }

    this.display.drawText(54, 15, "%c{white}Spellbook:");
    for (var i = 0; i < this.player.spellbook.length; i++) {
      const spell = this.player.spellbook[i];
      var color = "#888";
      if (this._canCast(spell)) {
        color = "white";
      }
      var modifier = 0;
      var valueText = "(";
      if (this.streak && spell.type == this.streak.type) {
        modifier = this.streak.length;
        valueText += "%c{#F66}"
      }
      if (spell.heal) {
        valueText += Math.max(0, spell.heal - modifier) + " heal";
      } else if (spell.damage) {
        valueText += Math.max(0, spell.damage - modifier) + " dmg";
      }
      valueText += `%c{${color}})`;
      this.display.drawText(54, 16 + i, `%c{${color}}${(i + 1) % 10}: %c{${spell.type.color}}${spell.type.symbol.repeat(spell.cost).padEnd(5)}%c{${color}} ${spell.name} ${valueText}`);
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
    this.creatures = [];
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

    for (var i = 3; i < rooms.length; i++) {
      const goldX = rooms[i].x + randomInt(rooms[i].width);
      const goldY = rooms[i].y + randomInt(rooms[i].height);
      this.map[goldY][goldX].items.push(Items.gold(5 * (randomInt(floor) + 1)));
    }

    this.map[stairY][stairX].terrain = Terrain.Stair;
    if (!this._getTerrain(this.player.x, this.player.y).enter) {
      return this._generateMap(floor);
    }

    const pathfinder = new ROT.Path.AStar(stairX, stairY, this._passability(null), {topology: 4});
    valid = false;
    const pathCallback = function(x, y) {
      if (x == stairX && y == stairY) {
        valid = true;
      }
    };
    pathfinder.compute(this.player.x, this.player.y, pathCallback.bind(this));

    if (!valid) {
      return this._generateMap(floor);
    }

    const placements = ROT.RNG.shuffle(spaces);
    const enemies = Math.min(15 + randomInt(5 * floor), placements.length);
    for (var i = 0; i < enemies; i++) {
      const space = placements[i];
      if (space.x == this.player.x && space.y == this.player.y) {
        continue;
      }
      this._createMonster(space.x, space.y, floor);
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
