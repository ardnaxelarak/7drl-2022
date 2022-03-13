function randomInt(max) {
  return Math.floor(ROT.RNG.getUniform() * max);
}

function cardString(card) {
  return `%c{${card.type.color}}${card.type.symbol.repeat(card.value)}`;
}

function capitalize(string) {
  return string[0].toUpperCase() + string.slice(1);
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
  Green: {key: "Green", color: Colors.Green, symbol: "+"},
  Red: {key: "Red", color: Colors.Red, symbol: "!"},
  Blue: {key: "Blue", color: Colors.Blue, symbol: "*"},
  Yellow: {key: "Yellow", color: Colors.Yellow, symbol: "="},
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
  MajorHeal: {name: "Major Heal", type: Magic.Green, cost: 3, heal: 12},
  FireBall: {name: "Fireball", type: Magic.Red, cost: 3, damage: 15, radius: 1},
  FrostBall: {name: "Frost Orb", type: Magic.Blue, cost: 3, damage: 15, radius: 1},
  AcidBall: {name: "Acid Splash", type: Magic.Yellow, cost: 3, damage: 15, radius: 1},
  FireBurst: {name: "Inferno", type: Magic.Red, cost: 4, damage: 25, radius: 3},
  FrostBurst: {name: "Blizzard", type: Magic.Blue, cost: 4, damage: 25, radius: 3},
  AcidBurst: {name: "Acid Rain", type: Magic.Yellow, cost: 4, damage: 25, radius: 3},
};

const Creatures = {
  GridBug: {name: "grid bug", color: "#F1E", symbol: "x", health: 5, damage: 1, level: 1, weight: 1},
  Snake: {name: "snake", color: "#6F6", symbol: "S", health: 4, damage: 1, level: 1, weight: 1},
  GiantAnt: {name: "giant ant", color: "#B72", symbol: "a", health: 8, damage: 2, level: 2, weight: 2},
  CaveSpider: {name: "cave spider", color: "#BBB", symbol: "s", health: 10, damage: 1, level: 2, weight: 2},
  RedJelly: {name: "red jelly", color: Colors.Red, symbol: "j", health: 11, damage: 2, level: 3, immune: ["Red"], weight: 2},
  BlueJelly: {name: "blue jelly", color: Colors.Blue, symbol: "j", health: 11, damage: 2, level: 3, immune: ["Blue"], weight: 2},
  YellowJelly: {name: "acid jelly", color: Colors.Yellow, symbol: "j", health: 11, damage: 2, level: 3, immune: ["Yellow"], weight: 2},
  Jackal: {name: "jackal", color: "#B72", symbol: "d", health: 11, damage: 3, level: 4, weight: 6},
  Kobold: {name: "kobold", color: "#D83", symbol: "k", health: 22, damage: 3, level: 5, weight: 9},
  Gecko: {name: "gecko", color: "#6F6", symbol: ":", health: 150, damage: 1, level: 0, weight: 0},
  Deceptibat: {name: "deceptibat", color: "#F3E", symbol: "B", health: 4, damage: 1, level: 0, weight: 0},
  Autocat: {name: "autocat", color: "#F66", symbol: "f", health: 4, damage: 1, level: 0, weight: 0},
};

const UniqueCreatures = {
  Geckatron: {
    name: "Geckatron",
    proper_name: true,
    type: Creatures.Gecko,
    action: function(creature) {
      if (ROT.RNG.getUniform() >= 0.4) {
        return false;
      }
      const spaces = [];
      const passability = this._passability(null);
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (passability(creature.x + dx, creature.y + dy)) {
            spaces.push({x: creature.x + dx, y: creature.y + dy});
          }
        }
      }
      if (spaces.length > 0) {
        const space = ROT.RNG.getItem(spaces);
        this._createMonster(space.x, space.y, this.player.floor, Creatures.Deceptibat);
        if (this._getSees(space.x, space.y) && this._getSees(creature.x, creature.y)) {
          this._write(`${capitalize(creature.name)} summons a deceptibat!`);
        }
      }
      return false;
    },
  },
  HoptimusPrime: {
    name: "Hoptimus Prime",
    proper_name: true,
    type: Creatures.Gecko,
    action: function(creature) {
      if (ROT.RNG.getUniform() >= 0.3) {
        return false;
      }
      const spaces = [];
      const passability = this._passability(null);
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (passability(creature.x + dx, creature.y + dy)) {
            spaces.push({x: creature.x + dx, y: creature.y + dy});
          }
        }
      }
      if (spaces.length > 0) {
        const space = ROT.RNG.getItem(spaces);
        this._createMonster(space.x, space.y, this.player.floor, Creatures.Autocat);
        if (this._getSees(space.x, space.y) && this._getSees(creature.x, creature.y)) {
          this._write(`${capitalize(creature.name)} summons an autocat!`);
        }
      }
      return false;
    },
  },
};

const Items = {
  gold: function(amount) {
    return {type: "gold", amount: amount, color: Colors.Gold, symbol: "$"};
  },

  card: function(type, value) {
    return {type: "card", card: {type: type, value: value}, color: type.color, symbol: type.symbol};
  },

  goal: function(name) {
    return {name: name, type: "goal", color: "#D5E", symbol: "%"};
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
  start: false,
  ctrl: false,
  shift: false,
  storeSpells: [],
  storeCards: [],
  storeMisc: [],

  init: function() {
    this.display = new ROT.Display({width: 90, height: 35, fontSize: 15, fontFamily: "Comic Mono", spacing: 1.2});
    document.getElementById("container").appendChild(this.display.getContainer());
    document.body.addEventListener("keydown", this._keydown.bind(this));
    document.body.addEventListener("keyup", this._keyup.bind(this));
    document.body.addEventListener("keypress", this._keypress.bind(this));
    this.fov = new ROT.FOV.PreciseShadowcasting(this._lightPasses.bind(this));
    this.start = true;
    this._updateState();
  },

  _getState: function() {
    if (this.start) {
      return "start";
    } else if (this.player.hp <= 0) {
      return "dead";
    } else if (this.player.goals >= 2) {
      return "win";
    } else if (this.store) {
      return "store";
    } else {
      return "map";
    }
  },

  _initGame: function() {
    this.start = false;
    this.player.hp = 10;
    this.player.hp_max = 10;
    this.player.gold = 0;
    this.player.goals = 0;
    this.player.spellbook = [Spells.MinorHeal, Spells.FireBolt, Spells.FrostBolt, Spells.AcidBolt, Spells.Heal];
    this.output = [];
    this.storeSpells = [
      {spell: Spells.FireBlast, cost: 30},
      {spell: Spells.FrostBlast, cost: 30},
      {spell: Spells.AcidBlast, cost: 30},
      {spell: Spells.MajorHeal, cost: 30},
      {spell: Spells.FireBall, cost: 70},
      {spell: Spells.FrostBall, cost: 70},
      {spell: Spells.AcidBall, cost: 70},
      {spell: Spells.FireBurst, cost: 120},
      {spell: Spells.FrostBurst, cost: 120},
      {spell: Spells.AcidBurst, cost: 120},
    ];
    this.storeCards = [];
    for (var i = 0; i <= 1; i++) {
      for (const type of Magic.types) {
        this.storeCards.push({card: {type: type, value: 2 + i}, cost: 20 + 40 * i});
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
          return 4 + this.player.floor;
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
    for (const type of Magic.types) {
      const card = {type: type, value: 1};
      this.storeMisc.push({
        remove: card,
        cost: function() {
          return 10;
        },
        valid: function() {
          return this._countCard(card) > 0;
        },
        action: function() {
          if (this._removeCard(card)) {
            this._write(`${cardString(card)}%c{} card removed.`);
          }
        },
      });
    }
    this.player.target = null;
    this._generateMap(1);
    this._initDeck();
    this._updateState();
  },

  _createMonster: function(x, y, floor, type) {
    if (!type) {
      const weights = {};
      for (const creature of Object.keys(Creatures)) {
        if (Creatures[creature].level <= floor) {
          weights[creature] = Creatures[creature].weight;
        }
      }
      const typeName = ROT.RNG.getWeightedValue(weights);
      type = Creatures[typeName];
    }
    const name = `the ${type.name}`;
    this.creatures.push({name: name, x: x, y: y, type: type, hp: type.health});
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
            this._write(`${cardString(item.card)}%c{} card acquired.`);
            break;
          case "goal":
            this.player.goals += 1;
            this._write(`${item.name} acquired.`);
            if (this.player.goals >= 2) {
              this._write(`You win! Press R to play again.`);
            }
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
        if (!this.ctrl && ["dead", "start", "win"].includes(this._getState())) {
          this._initGame();
          e.preventDefault();
        }
        break;
      case ROT.KEYS.VK_M:
        if (this._getState() == "dead" || this._getState() == "win") {
          this.start = true;
          this._updateState();
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
    if (this.player.spellbook.length >= 10) {
      return false;
    }
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
    this._write(`${cardString(item.card)}%c{} card acquired.`);
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
      const healed = Math.min(this.player.hp_max - this.player.hp, spell.heal - modifier);
      this.player.hp += healed;
      this._write(`${spell.name} heals ${healed} hp.`);
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
        if (target.type.immune && target.type.immune.includes(spell.type.key)) {
          this._write(`${capitalize(target.name)} is unaffected by ${spell.name}.`);
          continue;
        }
        target.hp = Math.max(0, target.hp - spell.damage + modifier);
        this._write(`${spell.name} deals ${spell.damage - modifier} damage to ${target.name}.`);
        if (target.hp <= 0) {
          const index = this.creatures.indexOf(target);
          if (index >= 0) {
            this.creatures.splice(index, 1);
          }
          this._write(`Killed ${target.name}.`);
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

      if (creature.action && !creature.action.bind(this)(creature)) {
        // do nothing, they've already done their thing
      } else if (creature.sees_player) {
        if (Math.abs(creature.x - this.player.x) <= 1 && Math.abs(creature.y - this.player.y) <= 1) {
          this.player.hp = Math.max(0, this.player.hp - creature.type.damage);
          this._write(`${capitalize(creature.name)} hits!`);
          creature.moved = true;
          if (this.player.hp <= 0) {
            this._write("You are dead. Press M to return to the title screen, or press R to restart.");
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
      } else {
        const directions = [{x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
        const attempts = ROT.RNG.shuffle(directions);
        for (const dir of attempts) {
          if (this._passability(creature)(creature.x + dir.x, creature.y + dir.y)) {
            creature.x += dir.x;
            creature.y += dir.y;
            break;
          }
        }
      }
    }
    this._updateState();
  },

  _cardMatches: function(a, b) {
    return a.type == b.type && a.value == b.value;
  },

  _countCard: function(card) {
    var count = 0;
    for (const c of this.player.discard) {
      if (this._cardMatches(card, c)) {
        count++;
      }
    }
    for (const c of this.player.deck) {
      if (this._cardMatches(card, c)) {
        count++;
      }
    }
    for (const c of this.player.hand) {
      if (this._cardMatches(card, c)) {
        count++;
      }
    }
    return count;
  },

  _removeCard: function(card) {
    for (var i = 0; i < this.player.discard.length; i++) {
      const c = this.player.discard[i];
      if (this._cardMatches(card, c)) {
        this.player.discard.splice(i, 1);
        return true;
      }
    }
    for (var i = 0; i < this.player.deck.length; i++) {
      const c = this.player.deck[i];
      if (this._cardMatches(card, c)) {
        this.player.deck.splice(i, 1);
        return true;
      }
    }
    for (var i = 0; i < this.player.hand.length; i++) {
      const c = this.player.hand[i];
      if (this._cardMatches(card, c)) {
        this.player.hand.splice(i, 1);
        return true;
      }
    }
    return false;
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

  _drawStart: function() {
    this.display.drawText(36, 2, "%c{white}The Mage's Student");
    this.display.drawText(42, 4, "a game");
    this.display.drawText(39, 5, "by karafruit");

    this.display.drawText(10, 8, "As part of your duties studying magic under the illustrious Hylda Elynfox, one day you are sent into the cellars to find some ingredients for a special potion. Armed only with some basic magic spells, you must fight off the many creatures guarding the Newt-Core and the Transformative Cricket...\n\n%c{white}The Mage's Student%c{} is a roguelike deckbuilding game in which your mana to cast spells is represented by cards of four types: Fire, Frost, Acid, and Healing. You start with a basic deck consisting of cards that grant one mana of their type and some basic spells, but as you delve deeper in the cellars you can upgrade your cards and learn new spells. But casting consecutive spells of the same type will lose efficacy...\n\nCreated for the 2022 7DRL Challenge.", 70);

    this.display.drawText(25, 25, "%c{white}Movement: WASD or HJKL or arrow keys");
    this.display.drawText(18, 27, "%c{white}Previous Target: [ or P          Next Target: ] or N");
    this.display.drawText(18, 29, "%c{white}Descend Stairs: >    Cast Spells: Numeric Keys (0 - 9)");

    this.display.drawText(34, 31, "%c{#AAF}--- Press R to begin ---");

    this.display.drawText(10, 33, "%c{#FFA}Special Thanks to Willow, KatDevsGames, SapphireSapphic, and Scout_JD");
  },

  _drawWin: function() {
    this.display.drawText(14, 10, "Having defeated Geckatron and Hoptimus Prime, you have collected");
    this.display.drawText(21, 11, "both the Newt-Core and the Transformative Cricket.");

    this.display.drawText(31, 13, "Congratulations! You have won.");
    this.display.drawText(37, 15, "Thanks for playing!");

    this.display.drawText(28, 28, "Press M to return to the title screen");
    this.display.drawText(36, 29, "Press R to play again");
  },

  _drawStore: function() {
    var linenum = 1;
    this.display.drawText(2, linenum++, "############### The Mage's Market ################");
    this.display.drawText(2, linenum++, "#%c{white} === Spells (shift + number) ===");
    var color = "";
    if (this.player.spellbook.length >= 10) {
      this.display.drawText(2, linenum++, "#      [spellbook full]");
    } else {
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
    }
    this.display.drawText(2, linenum++, "#");
    this.display.drawText(2, linenum++, "#%c{white} === Cards (ctrl + number) ===");
    const firstHalf = Math.ceil(this.storeCards.length / 2);
    for (i = 0; i < firstHalf; i++) {
      const item = this.storeCards[i];
      const card = item.card;
      color = "";
      if (item.cost > this.player.gold) {
        color = "#666";
      }
      var line = `${cardString(card)} Card`;
      this.display.drawText(2, linenum++, `#%c{${color}} C${(i + 1) % 10}: %c{${Colors.Gold}}${("$" + item.cost).padStart(5)}%c{${color}} ${line}`);
    }
    linenum -= firstHalf;
    for (i = firstHalf; i < this.storeCards.length; i++) {
      const item = this.storeCards[i];
      const card = item.card;
      color = "";
      if (item.cost > this.player.gold) {
        color = "#666";
      }
      var line = `${cardString(card)} Card`;
      this.display.drawText(28, linenum++, `%c{${color}}C${(i + 1) % 10}: %c{${Colors.Gold}}${("$" + item.cost).padStart(5)}%c{${color}} ${line}`);
    }
    linenum += this.storeCards.length % 2;
    this.display.drawText(2, linenum++, "#");
    this.display.drawText(2, linenum++, "#%c{white} === Miscellaneous ===");
    for (i = 0; i < this.storeMisc.length; i++) {
      const item = this.storeMisc[i];
      const cost = item.cost.bind(this)();
      color = "";
      if (cost > this.player.gold || !item.valid.bind(this)()) {
        color = "#666";
      }
      var line = item.name;
      if (!line) {
        if (item.remove) {
          line = `Remove ${cardString(item.remove)}%c{${color}} Card (${this._countCard(item.remove)} in deck)`;
        }
      }
      this.display.drawText(2, linenum++, `#%c{${color}}  ${(i + 1) % 10}: %c{${Colors.Gold}}${("$" + cost).padStart(5)}%c{${color}} ${line}`);
    }
    this.display.drawText(2, linenum++, "#");
    this.display.drawText(2, linenum++,  "#".repeat(50));
    for (var i = 1; i < linenum; i++) {
      this.display.draw(51, i, "#");
    }
    this.display.drawText(17, linenum++, "%c{white}Press C to Continue");
  },

  _drawFrames: function() {
    if (this._getState() == "dead") {
      this.display.drawText(2, 32, "Anburrh the Late Student");
    } else {
      this.display.drawText(2, 32, "Anburrh the Student");
    }
    this.display.drawText(2, 33, `HP: ${this.player.hp.toString().padStart(this.player.hp_max.toString().length)} / ${this.player.hp_max}`);
    this.display.drawText(17, 33, `%c{${Colors.Gold}}$${this.player.gold}`);
    this.display.drawText(25, 33, `Depth: ${this.player.floor}`);

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
      var offset = 0;
      if (target.proper_name) {
        this.display.drawText(72, 12, `%c{${target.type.color}}${target.name}`);
        offset = 1;
      }
      this.display.draw(72, 12 + offset, target.type.symbol, target.type.color);
      this.display.drawText(74, 12 + offset, target.type.name);
      this.display.drawText(72, 13 + offset, `Dmg: ${target.type.damage} HP: ${target.hp}`);
    } else {
      this.display.drawText(72, 12, "[none]");
    }

    this.display.drawText(54, 15, `%c{white}Spellbook (${this.player.spellbook.length}/10):`);
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
        valueText += `%c{${Colors.Red}}`
      }
      if (spell.heal) {
        valueText += Math.max(0, spell.heal - modifier) + " heal";
      } else if (spell.damage) {
        valueText += Math.max(0, spell.damage - modifier) + " dmg";
        if (spell.radius) {
          valueText += `, R: ${spell.radius}`;
        }
      }
      valueText += `%c{${color}})`;
      this.display.drawText(54, 16 + i, `%c{${color}}${(i + 1) % 10}: %c{${spell.type.color}}${spell.type.symbol.repeat(spell.cost).padEnd(5)}%c{${color}} ${spell.name} ${valueText}`);
    }
  },

  _updateState: function() {
    for (var i = 0; i < this.display.getOptions().height; i++) {
      for (var j = 0; j < this.display.getOptions().width; j++) {
        this.display.draw(j, i, " ");
      }
    }

    const state = this._getState();

    if (state == "start") {
      this._drawStart();
    } else if (state == "win") {
      this._drawWin();
    } else if (state == "store") {
      this._drawStore();
      this._drawFrames();
    } else if (["map", "dead"].includes(state)) {
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
      this._drawFrames();
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

  _finalMap: function(floor) {
    for (var j = 0; j < this.height; j++) {
      for (var i = 0; i < this.width; i++) {
        this.map[j][i] = {terrain: Terrain.Rock, items: []};
      }
    }
    for (var i = 9; i < 40; i++) {
      this.map[1][i].terrain = Terrain.Wall;
      this.map[13][i].terrain = Terrain.Wall;
    }
    for (var j = 2; j < 13; j++) {
      this.map[j][9].terrain = Terrain.Wall;
      for (var i = 10; i < 39; i++) {
        this.map[j][i].terrain = Terrain.Room;
      }
      this.map[j][39].terrain = Terrain.Wall;
    }
    this.map[13][24].terrain = Terrain.Door;
    for (var j = 14; j < 23; j++) {
      this.map[j][24].terrain = Terrain.Corridor;
    }
    for (var i = 19; i < 30; i++) {
      this.map[23][i].terrain = Terrain.Wall;
      this.map[28][i].terrain = Terrain.Wall;
    }
    for (var j = 24; j < 28; j++) {
      this.map[j][19].terrain = Terrain.Wall;
      for (var i = 20; i < 29; i++) {
        this.map[j][i].terrain = Terrain.Room;
      }
      this.map[j][29].terrain = Terrain.Wall;
    }
    this.map[23][24].terrain = Terrain.Door;

    this.player.x = 24;
    this.player.y = 27;
    this.player.floor = floor;

    const c1 = {
      ...UniqueCreatures.Geckatron,
      x: 11,
      y: 3,
      hp: UniqueCreatures.Geckatron.type.health,
    };
    this.creatures.push(c1);
    this.map[3][11].items.push(Items.goal("The Newt-Core"));

    const c2 = {
      ...UniqueCreatures.HoptimusPrime,
      x: 37,
      y: 3,
      hp: UniqueCreatures.HoptimusPrime.type.health,
    };
    this.creatures.push(c2);
    this.map[3][37].items.push(Items.goal("The Transformative Cricket"));
  },

  _generateMap: function(floor) {
    this.creatures = [];
    if (floor >= 6) {
      this._finalMap(floor);
      return;
    }
    const digger = new ROT.Map.Rogue(this.width, this.height);
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

document.fonts.onloadingdone = function() {
  Game.init();
};
