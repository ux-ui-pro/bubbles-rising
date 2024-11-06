<div align="center">
<br>

<h1>bubbles-rising</h1>

<p><sup>The BubblesRising class is designed to create an animation of bubbles that rise and gradually disappear over time. It dynamically generates particles, controls their movement and opacity, and adjusts the canvas size when the container is resized. The class ensures smooth animation updates using requestAnimationFrame. It supports customization options such as bubble color and size range and includes methods for initialization, updating, rendering, and resource cleanup.</sup></p>

[![npm](https://img.shields.io/npm/v/bubbles-rising.svg?colorB=brightgreen)](https://www.npmjs.com/package/bubbles-rising)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/bubbles-rising.svg)](https://github.com/ux-ui-pro/bubbles-rising)
[![NPM Downloads](https://img.shields.io/npm/dm/bubbles-rising.svg?style=flat)](https://www.npmjs.org/package/bubbles-rising)

<sup>1.6kB gzipped</sup>

<a href="https://codepen.io/ux-ui/full/yLmjZVZ">Demo</a>

</div>
<br>

&#10148; **Install**
```console
$ yarn add bubbles-rising
```
<br>

&#10148; **Import**
```javascript
import BubblesRising from 'bubbles-rising';
```
<br>

&#10148; **Usage**
```javascript
const bubblesRising = new BubblesRising({
  el: '.bubbles',
  color: 'rgb(128, 128, 128)',
  sizes: [2, 18],
});

bubblesRising.init();
```
<br>

&#10148; **Options**

| Option  |                      Type                      |       Default        | Description                                                                                                                    |
|:-------:|:----------------------------------------------:|:--------------------:|:-------------------------------------------------------------------------------------------------------------------------------|
|  `el`   |            `string \| HTMLElement`             |      `.bubbles`      | The container element for the animation. Can be a CSS selector (string) or an HTMLElement object.                              |
| `color` |                    `string`                    | `rgb(120, 200, 150)` | The color of the particles in the animation.                                                                                   |
| `sizes` |               `[number, number]`               |      `[4, 12]`       | The range of particle sizes, defined as an array where the first value is the minimum size and the second is the maximum size. |
| `shape` | `'circle' \| 'square' \| 'triangle' \| 'star'` |      `'circle'`      | The shape of the particles. Options are 'circle', 'square', 'triangle', or 'star'.                                             |
| `angle` |                   `boolean`                    |       `false`        | Enables or disables rotation angles for the particles.                                                                         |

<br>


&#10148; **Methods**

| Method      |      Parameters      | Returns | Description                                                                              |
|:------------|:--------------------:|:-------:|:-----------------------------------------------------------------------------------------|
| `init()`    |        `none`        | `void`  | Initializes the canvas, sets up event listeners, and starts the animation loop.          |
| `destroy()` |        `none`        | `void`  | Stops the animation, removes event listeners, clears the canvas, and releases resources. |
<br>

&#10148; **License**

bubbles-rising is released under MIT license
