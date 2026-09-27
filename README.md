# Banan-Odyssey
A lightning fast HTML5 action-roguelite where Odysseus the Banana slashes through a procedural Greek Underworld. Built entirely in Vanilla ES6 Canvas with zero external dependencies.


# 🍌 The Banan-odyssey: Tartarus

*Hades* meets *Dead Cells* in a zero-dependency HTML5 Canvas micro-platformer. 

The Trojan Food Fight is over, but the journey home has just begun. Play as Odysseus the Banana, adorned with a glowing Spartan crest, as you fight your way out of the Chthonic Kitchen and back to the Fruit Bowl of Ithaca. 

Play the game live: [Insert GitHub Pages Link Here]

## ✨ Features

* **High-Octane Canvas Combat:** Exceptionally tight, frame-rate independent physics featuring dodge-roll i-frames, sweeping melee arcs, hit-stop, and screen-shake for a visceral game feel.
* **Procedural Dark Mythological Aesthetic:** Zero external image assets or sprite sheets. Every entity, glowing hoplite crest, crimson Cyclops eye, and particle explosion is mathematically drawn using HTML5 Canvas blend modes (`lighter`) and radial gradients.
* **Roguelite Progression:** Defeat enemies to harvest glowing Nectar. Survive waves to access the mid-run upgrade menu, permanently increasing your slash reach, max health, or unlocking abilities like the Double Jump.
* **Boss Encounters:** Survive the bullet-hell pull of Charybdis the Blender.
* **Zero Dependencies:** No React, no Phaser, no Webpack. Just pure, highly optimized Vanilla ES6 JavaScript.

## 🎮 Controls

* **A / D** or **Left / Right Arrows:** Move
* **Space** or **W:** Jump (Hold for variable height)
* **Shift:** Dodge Roll (Grants invincibility frames)
* **J** or **Left Click:** Melee Slash

## 🛠️ Architecture & Tech Stack

This project was built to push the limits of what raw browser APIs can do without the bloat of traditional game engines.

* **Engine:** Custom-built Vanilla JS game loop using `requestAnimationFrame` and `deltaTime` physics.
* **Architecture:** Modular ES6 (`Engine.js`, `Player.js`, `Physics.js`, `Enemies.js`) allowing for clean state management between the action phases and the DOM-based upgrade UI.
* **Rendering:** Procedural generation via the `CanvasRenderingContext2D` API.
* **Styling:** CSS3 variables generating classical Greek Meander borders and deep Stygian color palettes (obsidians, crimsons, and tarnished golds). 

## 🚀 Running Locally

Because this game uses ES6 modules (`<script type="module">`), you cannot simply double-click the `index.html` file due to browser CORS security restrictions. 

To run the game locally:

1. Clone the repository:
   ```bash
   git clone [https://github.com/YourUsername/banan-odyssey-tartarus.git](https://github.com/YourUsername/banan-odyssey-tartarus.git)
