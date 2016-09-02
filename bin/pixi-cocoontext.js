(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @namespace PIXI.cocoonText
 */
module.exports = PIXI.cocoontext = {
    CocoonText:    require('./CocoonText'),
    CONST:    require('./CocoonTextUtil')
};

},{"./CocoonText":2,"./CocoonTextUtil":3}],2:[function(require,module,exports){
var CONST = require('../CocoonTextUtil');

/**
 * A CocoonText Object will create a line or multiple lines of text. To split a line you can use '\n' in your text string,
 * or add a wordWrap property set to true and and wordWrapWidth property with a value in the style object.
 *
 * Once a CocoonText is generated, it is stored as a BaseTexture and will be used if a new Text is
 * created with the exact same parameters.
 *
 * A CocoonText can be created directly from a string and a style object
 *
 * ```js
 * var text = new PIXI.extras.CocoonText('This is a CocoonText',{font : '24px Arial', fill : 0xff1010, align : 'center'});
 * ```
 *
 * @class
 * @extends Sprite
 * @memberof PIXI.extras
 * @param text {string} The copy that you would like the text to display
 * @param [style] {object} The style parameters
 * @param [style.font] {string} default 'bold 20px Arial' The style and size of the font
 * @param [style.fill='black'] {String|Number|Object} A canvas fillstyle that will be used on the text e.g 'red', '#00FF00',
 *      or object for gradients '{vertical: false, stops : [{stop: 0 , color: '#000'}, {stop: 1, color: '#FFF']}'
 * @param [style.align='left'] {string} Alignment for multiline text ('left', 'center' or 'right'), does not affect single line text
 * @param [style.stroke] {String|Number|Object} A canvas fillstyle that will be used on the text stroke, see 'fill' for details
 * @param [style.strokeThickness=0] {number} A number that represents the thickness of the stroke. Default is 0 (no stroke)
 * @param [style.wordWrap=false] {boolean} Indicates if word wrap should be used
 * @param [style.wordWrapWidth=100] {number} The width at which text will wrap, it needs wordWrap to be set to true
 * @param [style.lineHeight] {number} The line height, a number that represents the vertical space that a letter uses
 * @param [style.dropShadow=false] {boolean} Set a drop shadow for the text
 * @param [style.dropShadowColor='#000000'] {String|Number|Object} A fill style to be used on the dropshadow, see 'fill' for details
 * @param [style.dropShadowAngle=Math.PI/4] {number} Set a angle of the drop shadow
 * @param [style.dropShadowDistance=5] {number} Set a distance of the drop shadow
 * @param [style.dropShadowBlur=0] {number} How much drop shadow should be blurred, 0 disables blur
 * @param [style.dropShadowStrength=1] {number} Set the opacity of drop shadow when blurring
 * @param [style.dropShadowStroke=1] {number} Set the stroke width of the drop shadow
 * @param [style.padding=0] {number} Occasionally some fonts are cropped. Adding some padding will prevent this from happening
 * @param [style.textBaseline='alphabetic'] {string} The baseline of the text that is rendered.
 * @param [style.lineJoin='miter'] {string} The lineJoin property sets the type of corner created, it can resolve
 *      spiked text issues. Default is 'miter' (creates a sharp corner).
 * @param [style.miterLimit=10] {number} The miter limit to use when using the 'miter' lineJoin mode. This can reduce
 *      or increase the spikiness of rendered text.
 */
function CocoonText(text, style, resolution)
{
    /**
     * The canvas element that everything is drawn to
     *
     * @member {HTMLCanvasElement}
     */
    this.canvas = null;

    /**
     * The canvas 2d context that everything is drawn with
     * @member {HTMLCanvasElement}
     */
    this.context = null;

    /**
     * The resolution of the canvas.
     * @member {number}
     */
    this.resolution = resolution || CONST.TEXT_RESOLUTION || PIXI.RESOLUTION;

    /**
     * Private tracker for the current text.
     *
     * @member {string}
     * @private
     */
    this._text = null;

    /**
     * Private tracker for the current style.
     *
     * @member {object}
     * @private
     */
    this._style = null;

    /**
     * Private tracker for the generated style.
     *
     * @member {object}
     * @private
     */
    this._generatedStyle = null;

    if (typeof style.font !== 'undefined') { style.font = (style.font.replace(/[0-9\.]+/,(parseFloat(style.font.match(/[0-9\.]+/)[0])).toFixed(0))); }

    if (typeof style.dropShadowAngle === 'number') { style.dropShadowAngle = (Math.round(1000 * style.dropShadowAngle) / 1000); }
    if (typeof style.dropShadowBlur === 'number') { style.dropShadowBlur = (Math.round(1000 * style.dropShadowBlur) / 1000); }
    if (typeof style.dropShadowDistance === 'number') { style.dropShadowDistance = (Math.round(1000 * style.dropShadowDistance) / 1000); }
    if (typeof style.dropShadowStrength === 'number') { style.dropShadowStrength = (Math.round(1000 * style.dropShadowStrength) / 1000); }
    if (typeof style.dropShadowStroke === 'number') { style.dropShadowStroke = (Math.round(1000 * style.dropShadowStroke) / 1000); }
    if (typeof style.lineHeight === 'number') { style.lineHeight = (Math.round(1000 * style.lineHeight) / 1000); }
    if (typeof style.miterLimit === 'number') { style.miterLimit = (Math.round(1000 * style.miterLimit) / 1000); }
    if (typeof style.padding === 'number') { style.padding = (Math.round(1000 * style.padding) / 1000); }
    if (typeof style.strokeThickness === 'number') { style.strokeThickness = (Math.round(1000 * style.strokeThickness) / 1000); }
    if (typeof style.wordWrapWidth === 'number') { style.wordWrapWidth = (Math.round(1000 * style.wordWrapWidth) / 1000); }

    this._pixiId = text + JSON.stringify(style) + this.resolution;

    var baseTexture = PIXI.utils.BaseTextureCache[this._pixiId];

    if (typeof baseTexture === 'undefined')
    {
        this.canvas = document.createElement('canvas');
        this.canvas._pixiId = this._pixiId;
        this.cacheDirty = true;
    }
    else
    {
        this.canvas = baseTexture.source;
        this.cacheDirty = false;
    }

    this.context = this.canvas.getContext('2d');

    var texture = PIXI.Texture.fromCanvas(this.canvas);
    texture.trim = new PIXI.Rectangle();
    PIXI.Sprite.call(this, texture);

    this.text = text;
    this.style = style;

    this.switchNeeded = false;
}

// constructor
CocoonText.prototype = Object.create(PIXI.Sprite.prototype);
CocoonText.prototype.constructor = CocoonText;
module.exports = CocoonText;

Object.defineProperties(CocoonText.prototype, {
    /**
     * The width of the CocoonText, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof CocoonText#
     */
    width: {
        get: function ()
        {
            if (this.dirty)
            {
                this.updateText();
            }

            return this.scale.x * this._texture._frame.width;
        },
        set: function (value)
        {
            this.scale.x = value / this._texture._frame.width;
            this._width = value;
        }
    },

    /**
     * The height of the CocoonText, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof CocoonText#
     */
    height: {
        get: function ()
        {
            if (this.dirty)
            {
                this.updateText();
            }

            return  this.scale.y * this._texture._frame.height;
        },
        set: function (value)
        {
            this.scale.y = value / this._texture._frame.height;
            this._height = value;
        }
    },

    /**
     * Set the style of the text
     *
     * @param [value] {object} The style parameters
     * @param [value.font='bold 20pt Arial'] {string} The style and size of the font
     * @param [value.fill='black'] {String|Number|Object} A canvas fillstyle that will be used on the text e.g 'red', '#00FF00',
     *      or object for gradients '{vertical: false, stops : [{stop: 0 , color: '#000'}, {stop: 1, color: '#FFF']}'
     * @param [value.align='left'] {string} Alignment for multiline text ('left', 'center' or 'right'), does not affect single line text
     * @param [value.stroke='black'] {String|Number|Object} A canvas fillstyle that will be used on the text stroke, see 'fill' for details
     * @param [value.strokeThickness=0] {number} A number that represents the thickness of the stroke. Default is 0 (no stroke)
     * @param [value.wordWrap=false] {boolean} Indicates if word wrap should be used
     * @param [value.wordWrapWidth=100] {number} The width at which text will wrap
     * @param [value.lineHeight] {number} The line height, a number that represents the vertical space that a letter uses
     * @param [value.dropShadow=false] {boolean} Set a drop shadow for the text
     * @param [value.dropShadowColor='#000000'] {String|Number|Object} A fill style to be used on the dropshadow, see 'fill' for details
     * @param [value.dropShadowAngle=Math.PI/6] {number} Set a angle of the drop shadow
     * @param [value.dropShadowDistance=5] {number} Set a distance of the drop shadow
     * @param [value.dropShadowBlur=0] {number} How much drop shadow should be blurred, 0 disables blur
     * @param [value.dropShadowStrength=1] {number} Set the opacity of drop shadow when blurring
     * @param [value.dropShadowStroke=0] {number} Set the stroke width of drop shadow
     * @param [value.padding=0] {number} Occasionally some fonts are cropped. Adding some padding will prevent this from happening
     * @param [value.textBaseline='alphabetic'] {string} The baseline of the text that is rendered.
     * @param [value.lineJoin='miter'] {string} The lineJoin property sets the type of corner created, it can resolve
     *      spiked text issues. Default is 'miter' (creates a sharp corner).
     * @param [value.miterLimit=10] {number} The miter limit to use when using the 'miter' lineJoin mode. This can reduce
     *      or increase the spikiness of rendered text.
     * @memberof CocoonText#
     */
    style: {
        get: function ()
        {
            return this._style;
        },
        set: function (value)
        {
            var style = {};
            style.font = value.font || 'bold 20px Arial';
            style.lineHeight = (typeof value.lineHeight !== 'undefined') ? (value.lineHeight * this.resolution) : (undefined);
            style.fill = value.fill || 'black';
            style.align = value.align || 'left';
            style.stroke = value.stroke || 'black'; //provide a default, see: https://github.com/GoodBoyDigital/pixi.js/issues/136
            style.strokeThickness = value.strokeThickness || 0;
            style.wordWrap = value.wordWrap || false;
            style.wordWrapWidth = value.wordWrapWidth || 100;

            style.dropShadow = value.dropShadow || false;
            style.dropShadowColor = value.dropShadowColor || '#000000';
            style.dropShadowAngle = value.dropShadowAngle || Math.PI / 6;
            style.dropShadowDistance = value.dropShadowDistance || 5;
            style.dropShadowBlur = value.dropShadowBlur || 0;
            style.dropShadowStrength = value.dropShadowStrength || 1;
            style.dropShadowStroke = value.dropShadowStroke || 0;

            style.padding = value.padding || 0;

            style.textBaseline = value.textBaseline || 'alphabetic';

            style.lineJoin = value.lineJoin || 'miter';
            style.miterLimit = value.miterLimit || 10;

            var oldStyle = JSON.stringify(this._generatedStyle);

            //multiply the font style by the resolution
            //TODO : warn if font size not in px unit
            this._generatedStyle = {
                font : (style.font || '').replace(/[0-9\.]+/,(parseFloat(style.font.match(/[0-9\.]+/)[0]) * this.resolution).toFixed(0)),
                lineHeight : style.lineHeight,
                fill : style.fill,
                align : style.align,
                stroke : style.stroke,
                strokeThickness : Math.round(style.strokeThickness*this.resolution),
                wordWrap : style.wordWrap,
                wordWrapWidth : Math.round(style.wordWrapWidth*this.resolution),
                dropShadow : style.dropShadow,
                dropShadowColor : style.dropShadowColor,
                dropShadowAngle : style.dropShadowAngle,
                dropShadowDistance : Math.round(style.dropShadowDistance*this.resolution),
                dropShadowBlur : style.dropShadowBlur || 0,
                dropShadowStrength : style.dropShadowStrength || 1,
                dropShadowStroke : style.dropShadowStroke || 0,
                padding : Math.round(style.padding*this.resolution),
                textBaseline : style.textBaseline,
                lineJoin : style.lineJoin,
                miterLimit : style.miterLimit
            };

            if (JSON.stringify(this._generatedStyle) !== oldStyle)
            {
                if (this._style !== null)
                {
                    this.prepareUpdateText(this._text,value);
                }

                this._style = style;
                this.dirty = true;
            }
        }
    },

    /**
     * Set the copy for the text object. To split a line you can use '\n'.
     *
     * @param text {string} The copy that you would like the text to display
     * @memberof CocoonText#
     */
    text: {
        get: function()
        {
            return this._text;
        },
        set: function (text){
            text = text.toString() || ' ';
            if (this._text === text)
            {
                return;
            }
            if (this._text !== null)
            {
                this.prepareUpdateText(text, this._style);
            }
            this._text = text;
            this.dirty = true;
        }
    }
});

/**
 * Prepare the canvas for an update and try to get a cached text first.
 *
 * @private
 */
CocoonText.prototype.prepareUpdateText = function (text,style)
{
    this._pixiId = text + JSON.stringify(style) + this.resolution;
    this.switchNeeded = true;
};

var textureCache = {};

/**
 * Prepare the canvas for an update and try to get a cached text first.
 *
 * @private
 */
CocoonText.prototype.switchCanvas = function ()
{
    var baseTexture = PIXI.utils.BaseTextureCache[this._pixiId];
    var texture;
    if (baseTexture)
    {
        //there is a cached text for these parameters
        this.canvas = baseTexture.source;
        this.context = this.canvas.getContext('2d');
        texture = textureCache[this._pixiId];

        this.cacheDirty = false;
    }
    else
    {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas._pixiId = this._pixiId;

        texture = PIXI.Texture.fromCanvas(this.canvas);
        texture.trim = new PIXI.Rectangle();
        textureCache[this._pixiId] = texture;

        this.cacheDirty = true;
    }
    this.texture = texture;
    this._texture = texture;
    this.switchNeeded = false;
};

/**
 * Renders text and updates it when needed
 *
 * @private
 */
CocoonText.prototype.updateText = function ()
{
    if (this.switchNeeded)
    {
        this.switchCanvas();
    }
    if (this.cacheDirty)
    {
        var style = this._generatedStyle;
        this.context.font = style.font;

        // word wrap
        // preserve original text
        var outputText = style.wordWrap ? this.wordWrap(this._text) : this._text;

        // split text into lines
        var lines = outputText.split(/(?:\r\n|\r|\n)/);

        // calculate text width
        var lineWidths = new Array(lines.length);
        var maxLineWidth = 0;
        var fontProperties = this.determineFontProperties(style.font);
        for (var i = 0; i < lines.length; i++)
        {
            var lineWidth = this.context.measureText(lines[i]).width;
            lineWidths[i] = lineWidth;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
        }

        var width = maxLineWidth + style.strokeThickness;
        if (style.dropShadow)
        {
            width += style.dropShadowDistance;
        }

        this.canvas.width = ( width + this.context.lineWidth );

        // calculate text height
        var lineHeight = this.style.lineHeight || fontProperties.fontSize + style.strokeThickness;

        var height = lineHeight * lines.length;
        if (style.dropShadow)
        {
            height += style.dropShadowDistance;
        }

        this.canvas.height = ( height + style.padding * 2 );

        if (navigator.isCocoonJS)
        {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }


        this.context.font = style.font;
        this.context.textBaseline = style.textBaseline;
        this.context.lineJoin = style.lineJoin;
        this.context.miterLimit = style.miterLimit;

        var linePositionX;
        var linePositionY;

        if (style.dropShadow)
        {
            var dropShadowColor = style.dropShadowColor;
            if (typeof dropShadowColor === 'object') {
                dropShadowColor = this.gradientFill(dropShadowColor, width, lineHeight + style.strokeThickness + style.dropShadowDistance);
            }

            var xShadowOffset = Math.cos(style.dropShadowAngle) * style.dropShadowDistance / this.resolution;
            var yShadowOffset = Math.sin(style.dropShadowAngle) * style.dropShadowDistance / this.resolution;

            this.context.shadowColor = dropShadowColor;
            this.context.shadowOffsetX = xShadowOffset;
            this.context.shadowOffsetY = yShadowOffset;

            if (style.dropShadowBlur) {
                this.context.shadowBlur = style.dropShadowBlur * this.resolution * 2;
            }

        } else {
            this.context.shadowColor = undefined;
        }

        var stroke = style.stroke;
        if (typeof stroke === 'object') {
            stroke = this.gradientFill(stroke, width, lineHeight + style.strokeThickness);
        }

        this.context.strokeStyle = stroke;
        this.context.lineWidth = style.strokeThickness;


        var fill = style.fill;
        if (typeof fill === 'object') {
            fill = this.gradientFill(
                fill,
                width,
                lineHeight,
                style.strokeThickness + style.padding
            );
        }

        //set canvas text styles
        this.context.fillStyle = fill;

        //draw lines line by line
        for (i = 0; i < lines.length; i++)
        {
            linePositionX = style.strokeThickness / 2;
            linePositionY = (style.strokeThickness / 2 + i * lineHeight) + fontProperties.ascent;

            if (style.align === 'right')
            {
                linePositionX += maxLineWidth - lineWidths[i];
            }
            else if (style.align === 'center')
            {
                linePositionX += (maxLineWidth - lineWidths[i]) / 2;
            }

            if (style.stroke && style.strokeThickness)
            {
                this.context.strokeText(lines[i], linePositionX, linePositionY + style.padding);
            }

            if (style.fill)
            {
                this.context.fillText(lines[i], linePositionX, linePositionY + style.padding);
            }
        }
    }

    this.updateTexture();
};

CocoonText.prototype.gradientFill = function (options, width, height, padding)
{
    padding = padding || 0;
    width = width + padding;
    height = height + padding;

    var paddingX, paddingY;
    paddingX = paddingY = padding;

    if (options.vertical) {
        height = 0;
        paddingY = 0;
    } else {
        width = 0;
        paddingX = 0;
    }

    var gradient = this.context.createLinearGradient(paddingX, paddingY, width, height);

    for (var i = 0, iLen = options.stops.length; i < iLen; i++) {
        gradient.addColorStop(options.stops[i].stop, options.stops[i].color);
    }

    return gradient;
};

CocoonText.prototype.blur = function (iterations, strength, alpha) {
    var x = 0;
    var y = 0;

    // Copy the current pixels to be used as a stencil
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');
    newCanvas.width = this.canvas.width;
    newCanvas.height = this.canvas.height;
    context.drawImage(this.canvas, 0, 0);

    var oldAlpha = this.context.globalAlpha;
    this.context.globalAlpha = alpha / (iterations * 4);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply blur
    for (var i = 0; i < iterations * 4; ++i) {
        var direction = i % 4;
        var offset = ((i + 1) / 4) * this.resolution;
        switch (direction) {
            case 0:  // Up.
                y -= offset;
            break;
            case 1:  // Right.
                x += offset;
            break;
            case 2:  // Down.
                y += offset;
            break;
            case 3:  // Left.
                x -= offset;
            break;
        }
        this.context.drawImage(newCanvas, x, y);
    }

    this.context.globalAlpha = oldAlpha;
};

/**
 * Updates texture size based on canvas size
 *
 * @private
 */
CocoonText.prototype.updateTexture = function ()
{
    var texture = this._texture;

    if (this.cacheDirty)
    {
        texture.baseTexture.hasLoaded = true;
        texture.baseTexture.resolution = this.resolution;

        texture.baseTexture.width = this.canvas.width / this.resolution;
        texture.baseTexture.height = this.canvas.height / this.resolution;
    }

    texture.orig.width = texture._frame.width = this.canvas.width / this.resolution;
    texture.orig.height = texture._frame.height = this.canvas.height / this.resolution;

    texture.trim.x = 0;
    texture.trim.y = -this._style.padding;

    texture.trim.width = texture._frame.width;
    texture.trim.height = texture._frame.height; //- this._style.padding*2;

    this._width = this.canvas.width / this.resolution;
    this._height = this.canvas.height / this.resolution;

    this.scale.x = 1;
    this.scale.y = 1;

    if (this.cacheDirty)
    {
        texture.baseTexture.emit('update',  texture.baseTexture);
    }

    this.dirty = false;
    this.cacheDirty = false;
};

/**
 * Calculates the ascent, descent and fontSize of a given fontStyle
 *
 * @param fontStyle {object}
 * @private
 */
CocoonText.prototype.determineFontProperties = function (fontStyle)
{
    var properties = PIXI.Text.fontPropertiesCache[fontStyle];

    if (!properties)
    {
        properties = {};

        var canvas = PIXI.Text.fontPropertiesCanvas;
        var context = PIXI.Text.fontPropertiesContext;

        context.font = fontStyle;

        var width = Math.ceil(context.measureText('|MÉq').width);
        var baseline = Math.ceil(context.measureText('M').width);
        var height = 2 * baseline;

        // baseline factor depends a lot of the font. todo : let user specify a factor per font name ?
        baseline = baseline * 1.2 | 0;

        canvas.width = width;
        canvas.height = height;

        context.fillStyle = '#f00';
        context.fillRect(0, 0, width, height);

        context.font = fontStyle;

        context.textBaseline = 'alphabetic';
        context.fillStyle = '#000';
        context.fillText('|MÉq', 0, baseline);

        var imagedata = context.getImageData(0, 0, width, height).data;
        var pixels = imagedata.length;
        var line = width * 4;

        var i, j;

        var idx = 0;
        var stop = false;

        // ascent. scan from top to bottom until we find a non red pixel
        for (i = 0; i < baseline; i++)
        {
            for (j = 0; j < line; j += 4)
            {
                if (imagedata[idx + j] !== 255)
                {
                    stop = true;
                    break;
                }
            }
            if (!stop)
            {
                idx += line;
            }
            else
            {
                break;
            }
        }

        properties.ascent = baseline - i;

        idx = pixels - line;
        stop = false;

        // descent. scan from bottom to top until we find a non red pixel
        for (i = height; i > baseline; i--)
        {
            for (j = 0; j < line; j += 4)
            {
                if (imagedata[idx + j] !== 255)
                {
                    stop = true;
                    break;
                }
            }
            if (!stop)
            {
                idx -= line;
            }
            else
            {
                break;
            }
        }

        properties.descent = i - baseline;
        properties.fontSize = properties.ascent + properties.descent;

        PIXI.Text.fontPropertiesCache[fontStyle] = properties;
    }

    return properties;
};

/**
 * Applies newlines to a string to have it optimally fit into the horizontal
 * bounds set by the Text object's wordWrapWidth property.
 *
 * @param text {string}
 * @private
 */
CocoonText.prototype.wordWrap = function (text)
{
    // Greedy wrapping algorithm that will wrap words as the line grows longer
    // than its horizontal bounds.
    var result = '';
    var lines = text.split('\n');
    var wordWrapWidth = this._generatedStyle.wordWrapWidth;
    for (var i = 0; i < lines.length; i++)
    {
        var spaceLeft = wordWrapWidth;
        var words = lines[i].split(' ');
        for (var j = 0; j < words.length; j++)
        {
            var wordWidth = this.context.measureText(words[j]).width;
            var wordWidthWithSpace = wordWidth + this.context.measureText(' ').width;
            if (j === 0 || wordWidthWithSpace > spaceLeft)
            {
                // Skip printing the newline if it's the first word of the line that is
                // greater than the word wrap width.
                if (j > 0)
                {
                    result += '\n';
                }
                result += words[j];
                spaceLeft = wordWrapWidth - wordWidth;
            }
            else
            {
                spaceLeft -= wordWidthWithSpace;
                result += ' ' + words[j];
            }
        }

        if (i < lines.length-1)
        {
            result += '\n';
        }
    }
    return result;
};

/**
 * Renders the object using the WebGL renderer
 *
 * @param renderer {WebGLRenderer}
 */
CocoonText.prototype.renderWebGL = function (renderer)
{
    if (this.dirty)
    {
        this.updateText();
    }

    PIXI.Sprite.prototype.renderWebGL.call(this, renderer);
};

/**
 * Renders the object using the Canvas renderer
 *
 * @param renderer {CanvasRenderer}
 * @private
 */
CocoonText.prototype._renderCanvas = function (renderer)
{
    if (this.dirty)
    {
        this.updateText();
    }

    PIXI.Sprite.prototype._renderCanvas.call(this, renderer);
};

/**
 * Returns the bounds of the Text as a rectangle. The bounds calculation takes the worldTransform into account.
 *
 * @param matrix {Matrix} the transformation matrix of the Text
 * @return {Rectangle} the framing rectangle
 */
CocoonText.prototype.getBounds = function (matrix)
{
    if (this.dirty)
    {
        this.updateText();
    }

    return PIXI.Sprite.prototype.getBounds.call(this, matrix);
};

/**
 * Destroys this text object.
 *
 * @param [destroyBaseTexture=true] {boolean} whether to destroy the base texture as well
 */
CocoonText.prototype.destroy = function (destroyBaseTexture)
{
    // make sure to reset the the context and canvas.. dont want this hanging around in memory!
    this.context = null;
    this.canvas = null;

    this._style = null;

    this._texture.destroy(destroyBaseTexture === undefined ? true : destroyBaseTexture);
};

},{"../CocoonTextUtil":3}],3:[function(require,module,exports){
module.exports = {
    /**
     * @property {number} TEXT_RESOLUTION - Default resolution of a new CocoonText
     * @constant
     * @static
     */
    TEXT_RESOLUTION:1
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyIsInNyYy9Db2Nvb25UZXh0VXRpbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaHpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAbmFtZXNwYWNlIFBJWEkuY29jb29uVGV4dFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFBJWEkuY29jb29udGV4dCA9IHtcbiAgICBDb2Nvb25UZXh0OiAgICByZXF1aXJlKCcuL0NvY29vblRleHQnKSxcbiAgICBDT05TVDogICAgcmVxdWlyZSgnLi9Db2Nvb25UZXh0VXRpbCcpXG59O1xuIiwidmFyIENPTlNUID0gcmVxdWlyZSgnLi4vQ29jb29uVGV4dFV0aWwnKTtcblxuLyoqXG4gKiBBIENvY29vblRleHQgT2JqZWN0IHdpbGwgY3JlYXRlIGEgbGluZSBvciBtdWx0aXBsZSBsaW5lcyBvZiB0ZXh0LiBUbyBzcGxpdCBhIGxpbmUgeW91IGNhbiB1c2UgJ1xcbicgaW4geW91ciB0ZXh0IHN0cmluZyxcbiAqIG9yIGFkZCBhIHdvcmRXcmFwIHByb3BlcnR5IHNldCB0byB0cnVlIGFuZCBhbmQgd29yZFdyYXBXaWR0aCBwcm9wZXJ0eSB3aXRoIGEgdmFsdWUgaW4gdGhlIHN0eWxlIG9iamVjdC5cbiAqXG4gKiBPbmNlIGEgQ29jb29uVGV4dCBpcyBnZW5lcmF0ZWQsIGl0IGlzIHN0b3JlZCBhcyBhIEJhc2VUZXh0dXJlIGFuZCB3aWxsIGJlIHVzZWQgaWYgYSBuZXcgVGV4dCBpc1xuICogY3JlYXRlZCB3aXRoIHRoZSBleGFjdCBzYW1lIHBhcmFtZXRlcnMuXG4gKlxuICogQSBDb2Nvb25UZXh0IGNhbiBiZSBjcmVhdGVkIGRpcmVjdGx5IGZyb20gYSBzdHJpbmcgYW5kIGEgc3R5bGUgb2JqZWN0XG4gKlxuICogYGBganNcbiAqIHZhciB0ZXh0ID0gbmV3IFBJWEkuZXh0cmFzLkNvY29vblRleHQoJ1RoaXMgaXMgYSBDb2Nvb25UZXh0Jyx7Zm9udCA6ICcyNHB4IEFyaWFsJywgZmlsbCA6IDB4ZmYxMDEwLCBhbGlnbiA6ICdjZW50ZXInfSk7XG4gKiBgYGBcbiAqXG4gKiBAY2xhc3NcbiAqIEBleHRlbmRzIFNwcml0ZVxuICogQG1lbWJlcm9mIFBJWEkuZXh0cmFzXG4gKiBAcGFyYW0gdGV4dCB7c3RyaW5nfSBUaGUgY29weSB0aGF0IHlvdSB3b3VsZCBsaWtlIHRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAqIEBwYXJhbSBbc3R5bGVdIHtvYmplY3R9IFRoZSBzdHlsZSBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gW3N0eWxlLmZvbnRdIHtzdHJpbmd9IGRlZmF1bHQgJ2JvbGQgMjBweCBBcmlhbCcgVGhlIHN0eWxlIGFuZCBzaXplIG9mIHRoZSBmb250XG4gKiBAcGFyYW0gW3N0eWxlLmZpbGw9J2JsYWNrJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgZS5nICdyZWQnLCAnIzAwRkYwMCcsXG4gKiAgICAgIG9yIG9iamVjdCBmb3IgZ3JhZGllbnRzICd7dmVydGljYWw6IGZhbHNlLCBzdG9wcyA6IFt7c3RvcDogMCAsIGNvbG9yOiAnIzAwMCd9LCB7c3RvcDogMSwgY29sb3I6ICcjRkZGJ119J1xuICogQHBhcmFtIFtzdHlsZS5hbGlnbj0nbGVmdCddIHtzdHJpbmd9IEFsaWdubWVudCBmb3IgbXVsdGlsaW5lIHRleHQgKCdsZWZ0JywgJ2NlbnRlcicgb3IgJ3JpZ2h0JyksIGRvZXMgbm90IGFmZmVjdCBzaW5nbGUgbGluZSB0ZXh0XG4gKiBAcGFyYW0gW3N0eWxlLnN0cm9rZV0ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgc3Ryb2tlLCBzZWUgJ2ZpbGwnIGZvciBkZXRhaWxzXG4gKiBAcGFyYW0gW3N0eWxlLnN0cm9rZVRoaWNrbmVzcz0wXSB7bnVtYmVyfSBBIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHRoaWNrbmVzcyBvZiB0aGUgc3Ryb2tlLiBEZWZhdWx0IGlzIDAgKG5vIHN0cm9rZSlcbiAqIEBwYXJhbSBbc3R5bGUud29yZFdyYXA9ZmFsc2VdIHtib29sZWFufSBJbmRpY2F0ZXMgaWYgd29yZCB3cmFwIHNob3VsZCBiZSB1c2VkXG4gKiBAcGFyYW0gW3N0eWxlLndvcmRXcmFwV2lkdGg9MTAwXSB7bnVtYmVyfSBUaGUgd2lkdGggYXQgd2hpY2ggdGV4dCB3aWxsIHdyYXAsIGl0IG5lZWRzIHdvcmRXcmFwIHRvIGJlIHNldCB0byB0cnVlXG4gKiBAcGFyYW0gW3N0eWxlLmxpbmVIZWlnaHRdIHtudW1iZXJ9IFRoZSBsaW5lIGhlaWdodCwgYSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB2ZXJ0aWNhbCBzcGFjZSB0aGF0IGEgbGV0dGVyIHVzZXNcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvdz1mYWxzZV0ge2Jvb2xlYW59IFNldCBhIGRyb3Agc2hhZG93IGZvciB0aGUgdGV4dFxuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93Q29sb3I9JyMwMDAwMDAnXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgZmlsbCBzdHlsZSB0byBiZSB1c2VkIG9uIHRoZSBkcm9wc2hhZG93LCBzZWUgJ2ZpbGwnIGZvciBkZXRhaWxzXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dBbmdsZT1NYXRoLlBJLzRdIHtudW1iZXJ9IFNldCBhIGFuZ2xlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U9NV0ge251bWJlcn0gU2V0IGEgZGlzdGFuY2Ugb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dCbHVyPTBdIHtudW1iZXJ9IEhvdyBtdWNoIGRyb3Agc2hhZG93IHNob3VsZCBiZSBibHVycmVkLCAwIGRpc2FibGVzIGJsdXJcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd1N0cmVuZ3RoPTFdIHtudW1iZXJ9IFNldCB0aGUgb3BhY2l0eSBvZiBkcm9wIHNoYWRvdyB3aGVuIGJsdXJyaW5nXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dTdHJva2U9MV0ge251bWJlcn0gU2V0IHRoZSBzdHJva2Ugd2lkdGggb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLnBhZGRpbmc9MF0ge251bWJlcn0gT2NjYXNpb25hbGx5IHNvbWUgZm9udHMgYXJlIGNyb3BwZWQuIEFkZGluZyBzb21lIHBhZGRpbmcgd2lsbCBwcmV2ZW50IHRoaXMgZnJvbSBoYXBwZW5pbmdcbiAqIEBwYXJhbSBbc3R5bGUudGV4dEJhc2VsaW5lPSdhbHBoYWJldGljJ10ge3N0cmluZ30gVGhlIGJhc2VsaW5lIG9mIHRoZSB0ZXh0IHRoYXQgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gW3N0eWxlLmxpbmVKb2luPSdtaXRlciddIHtzdHJpbmd9IFRoZSBsaW5lSm9pbiBwcm9wZXJ0eSBzZXRzIHRoZSB0eXBlIG9mIGNvcm5lciBjcmVhdGVkLCBpdCBjYW4gcmVzb2x2ZVxuICogICAgICBzcGlrZWQgdGV4dCBpc3N1ZXMuIERlZmF1bHQgaXMgJ21pdGVyJyAoY3JlYXRlcyBhIHNoYXJwIGNvcm5lcikuXG4gKiBAcGFyYW0gW3N0eWxlLm1pdGVyTGltaXQ9MTBdIHtudW1iZXJ9IFRoZSBtaXRlciBsaW1pdCB0byB1c2Ugd2hlbiB1c2luZyB0aGUgJ21pdGVyJyBsaW5lSm9pbiBtb2RlLiBUaGlzIGNhbiByZWR1Y2VcbiAqICAgICAgb3IgaW5jcmVhc2UgdGhlIHNwaWtpbmVzcyBvZiByZW5kZXJlZCB0ZXh0LlxuICovXG5mdW5jdGlvbiBDb2Nvb25UZXh0KHRleHQsIHN0eWxlLCByZXNvbHV0aW9uKVxue1xuICAgIC8qKlxuICAgICAqIFRoZSBjYW52YXMgZWxlbWVudCB0aGF0IGV2ZXJ5dGhpbmcgaXMgZHJhd24gdG9cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY2FudmFzID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYW52YXMgMmQgY29udGV4dCB0aGF0IGV2ZXJ5dGhpbmcgaXMgZHJhd24gd2l0aFxuICAgICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcmVzb2x1dGlvbiBvZiB0aGUgY2FudmFzLlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnJlc29sdXRpb24gPSByZXNvbHV0aW9uIHx8IENPTlNULlRFWFRfUkVTT0xVVElPTiB8fCBQSVhJLlJFU09MVVRJT047XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBjdXJyZW50IHRleHQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgdHJhY2tlciBmb3IgdGhlIGN1cnJlbnQgc3R5bGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtvYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9zdHlsZSA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBnZW5lcmF0ZWQgc3R5bGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtvYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9nZW5lcmF0ZWRTdHlsZSA9IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIHN0eWxlLmZvbnQgIT09ICd1bmRlZmluZWQnKSB7IHN0eWxlLmZvbnQgPSAoc3R5bGUuZm9udC5yZXBsYWNlKC9bMC05XFwuXSsvLChwYXJzZUZsb2F0KHN0eWxlLmZvbnQubWF0Y2goL1swLTlcXC5dKy8pWzBdKSkudG9GaXhlZCgwKSkpOyB9XG5cbiAgICBpZiAodHlwZW9mIHN0eWxlLmRyb3BTaGFkb3dBbmdsZSA9PT0gJ251bWJlcicpIHsgc3R5bGUuZHJvcFNoYWRvd0FuZ2xlID0gKE1hdGgucm91bmQoMTAwMCAqIHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgLyAxMDAwKTsgfVxuICAgIGlmICh0eXBlb2Ygc3R5bGUuZHJvcFNoYWRvd0JsdXIgPT09ICdudW1iZXInKSB7IHN0eWxlLmRyb3BTaGFkb3dCbHVyID0gKE1hdGgucm91bmQoMTAwMCAqIHN0eWxlLmRyb3BTaGFkb3dCbHVyKSAvIDEwMDApOyB9XG4gICAgaWYgKHR5cGVvZiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgPT09ICdudW1iZXInKSB7IHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSA9IChNYXRoLnJvdW5kKDEwMDAgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UpIC8gMTAwMCk7IH1cbiAgICBpZiAodHlwZW9mIHN0eWxlLmRyb3BTaGFkb3dTdHJlbmd0aCA9PT0gJ251bWJlcicpIHsgc3R5bGUuZHJvcFNoYWRvd1N0cmVuZ3RoID0gKE1hdGgucm91bmQoMTAwMCAqIHN0eWxlLmRyb3BTaGFkb3dTdHJlbmd0aCkgLyAxMDAwKTsgfVxuICAgIGlmICh0eXBlb2Ygc3R5bGUuZHJvcFNoYWRvd1N0cm9rZSA9PT0gJ251bWJlcicpIHsgc3R5bGUuZHJvcFNoYWRvd1N0cm9rZSA9IChNYXRoLnJvdW5kKDEwMDAgKiBzdHlsZS5kcm9wU2hhZG93U3Ryb2tlKSAvIDEwMDApOyB9XG4gICAgaWYgKHR5cGVvZiBzdHlsZS5saW5lSGVpZ2h0ID09PSAnbnVtYmVyJykgeyBzdHlsZS5saW5lSGVpZ2h0ID0gKE1hdGgucm91bmQoMTAwMCAqIHN0eWxlLmxpbmVIZWlnaHQpIC8gMTAwMCk7IH1cbiAgICBpZiAodHlwZW9mIHN0eWxlLm1pdGVyTGltaXQgPT09ICdudW1iZXInKSB7IHN0eWxlLm1pdGVyTGltaXQgPSAoTWF0aC5yb3VuZCgxMDAwICogc3R5bGUubWl0ZXJMaW1pdCkgLyAxMDAwKTsgfVxuICAgIGlmICh0eXBlb2Ygc3R5bGUucGFkZGluZyA9PT0gJ251bWJlcicpIHsgc3R5bGUucGFkZGluZyA9IChNYXRoLnJvdW5kKDEwMDAgKiBzdHlsZS5wYWRkaW5nKSAvIDEwMDApOyB9XG4gICAgaWYgKHR5cGVvZiBzdHlsZS5zdHJva2VUaGlja25lc3MgPT09ICdudW1iZXInKSB7IHN0eWxlLnN0cm9rZVRoaWNrbmVzcyA9IChNYXRoLnJvdW5kKDEwMDAgKiBzdHlsZS5zdHJva2VUaGlja25lc3MpIC8gMTAwMCk7IH1cbiAgICBpZiAodHlwZW9mIHN0eWxlLndvcmRXcmFwV2lkdGggPT09ICdudW1iZXInKSB7IHN0eWxlLndvcmRXcmFwV2lkdGggPSAoTWF0aC5yb3VuZCgxMDAwICogc3R5bGUud29yZFdyYXBXaWR0aCkgLyAxMDAwKTsgfVxuXG4gICAgdGhpcy5fcGl4aUlkID0gdGV4dCArIEpTT04uc3RyaW5naWZ5KHN0eWxlKSArIHRoaXMucmVzb2x1dGlvbjtcblxuICAgIHZhciBiYXNlVGV4dHVyZSA9IFBJWEkudXRpbHMuQmFzZVRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuXG4gICAgaWYgKHR5cGVvZiBiYXNlVGV4dHVyZSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGJhc2VUZXh0dXJlLnNvdXJjZTtcbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHZhciB0ZXh0dXJlID0gUElYSS5UZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXMpO1xuICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgIFBJWEkuU3ByaXRlLmNhbGwodGhpcywgdGV4dHVyZSk7XG5cbiAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgIHRoaXMuc3R5bGUgPSBzdHlsZTtcblxuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gZmFsc2U7XG59XG5cbi8vIGNvbnN0cnVjdG9yXG5Db2Nvb25UZXh0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUElYSS5TcHJpdGUucHJvdG90eXBlKTtcbkNvY29vblRleHQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29jb29uVGV4dDtcbm1vZHVsZS5leHBvcnRzID0gQ29jb29uVGV4dDtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoQ29jb29uVGV4dC5wcm90b3R5cGUsIHtcbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggb2YgdGhlIENvY29vblRleHQsIHNldHRpbmcgdGhpcyB3aWxsIGFjdHVhbGx5IG1vZGlmeSB0aGUgc2NhbGUgdG8gYWNoaWV2ZSB0aGUgdmFsdWUgc2V0XG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgd2lkdGg6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGUueCAqIHRoaXMuX3RleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS54ID0gdmFsdWUgLyB0aGlzLl90ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICAgICAgICAgIHRoaXMuX3dpZHRoID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgQ29jb29uVGV4dCwgc2V0dGluZyB0aGlzIHdpbGwgYWN0dWFsbHkgbW9kaWZ5IHRoZSBzY2FsZSB0byBhY2hpZXZlIHRoZSB2YWx1ZSBzZXRcbiAgICAgKlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKiBAbWVtYmVyb2YgQ29jb29uVGV4dCNcbiAgICAgKi9cbiAgICBoZWlnaHQ6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICB0aGlzLnNjYWxlLnkgKiB0aGlzLl90ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNjYWxlLnkgPSB2YWx1ZSAvIHRoaXMuX3RleHR1cmUuX2ZyYW1lLmhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuX2hlaWdodCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc3R5bGUgb2YgdGhlIHRleHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBbdmFsdWVdIHtvYmplY3R9IFRoZSBzdHlsZSBwYXJhbWV0ZXJzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5mb250PSdib2xkIDIwcHQgQXJpYWwnXSB7c3RyaW5nfSBUaGUgc3R5bGUgYW5kIHNpemUgb2YgdGhlIGZvbnRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmZpbGw9J2JsYWNrJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgZS5nICdyZWQnLCAnIzAwRkYwMCcsXG4gICAgICogICAgICBvciBvYmplY3QgZm9yIGdyYWRpZW50cyAne3ZlcnRpY2FsOiBmYWxzZSwgc3RvcHMgOiBbe3N0b3A6IDAgLCBjb2xvcjogJyMwMDAnfSwge3N0b3A6IDEsIGNvbG9yOiAnI0ZGRiddfSdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmFsaWduPSdsZWZ0J10ge3N0cmluZ30gQWxpZ25tZW50IGZvciBtdWx0aWxpbmUgdGV4dCAoJ2xlZnQnLCAnY2VudGVyJyBvciAncmlnaHQnKSwgZG9lcyBub3QgYWZmZWN0IHNpbmdsZSBsaW5lIHRleHRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnN0cm9rZT0nYmxhY2snXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBzdHJva2UsIHNlZSAnZmlsbCcgZm9yIGRldGFpbHNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnN0cm9rZVRoaWNrbmVzcz0wXSB7bnVtYmVyfSBBIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHRoaWNrbmVzcyBvZiB0aGUgc3Ryb2tlLiBEZWZhdWx0IGlzIDAgKG5vIHN0cm9rZSlcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLndvcmRXcmFwPWZhbHNlXSB7Ym9vbGVhbn0gSW5kaWNhdGVzIGlmIHdvcmQgd3JhcCBzaG91bGQgYmUgdXNlZFxuICAgICAqIEBwYXJhbSBbdmFsdWUud29yZFdyYXBXaWR0aD0xMDBdIHtudW1iZXJ9IFRoZSB3aWR0aCBhdCB3aGljaCB0ZXh0IHdpbGwgd3JhcFxuICAgICAqIEBwYXJhbSBbdmFsdWUubGluZUhlaWdodF0ge251bWJlcn0gVGhlIGxpbmUgaGVpZ2h0LCBhIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHZlcnRpY2FsIHNwYWNlIHRoYXQgYSBsZXR0ZXIgdXNlc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvdz1mYWxzZV0ge2Jvb2xlYW59IFNldCBhIGRyb3Agc2hhZG93IGZvciB0aGUgdGV4dFxuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0NvbG9yPScjMDAwMDAwJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGZpbGwgc3R5bGUgdG8gYmUgdXNlZCBvbiB0aGUgZHJvcHNoYWRvdywgc2VlICdmaWxsJyBmb3IgZGV0YWlsc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0FuZ2xlPU1hdGguUEkvNl0ge251bWJlcn0gU2V0IGEgYW5nbGUgb2YgdGhlIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93RGlzdGFuY2U9NV0ge251bWJlcn0gU2V0IGEgZGlzdGFuY2Ugb2YgdGhlIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93Qmx1cj0wXSB7bnVtYmVyfSBIb3cgbXVjaCBkcm9wIHNoYWRvdyBzaG91bGQgYmUgYmx1cnJlZCwgMCBkaXNhYmxlcyBibHVyXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93U3RyZW5ndGg9MV0ge251bWJlcn0gU2V0IHRoZSBvcGFjaXR5IG9mIGRyb3Agc2hhZG93IHdoZW4gYmx1cnJpbmdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dTdHJva2U9MF0ge251bWJlcn0gU2V0IHRoZSBzdHJva2Ugd2lkdGggb2YgZHJvcCBzaGFkb3dcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnBhZGRpbmc9MF0ge251bWJlcn0gT2NjYXNpb25hbGx5IHNvbWUgZm9udHMgYXJlIGNyb3BwZWQuIEFkZGluZyBzb21lIHBhZGRpbmcgd2lsbCBwcmV2ZW50IHRoaXMgZnJvbSBoYXBwZW5pbmdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnRleHRCYXNlbGluZT0nYWxwaGFiZXRpYyddIHtzdHJpbmd9IFRoZSBiYXNlbGluZSBvZiB0aGUgdGV4dCB0aGF0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSBbdmFsdWUubGluZUpvaW49J21pdGVyJ10ge3N0cmluZ30gVGhlIGxpbmVKb2luIHByb3BlcnR5IHNldHMgdGhlIHR5cGUgb2YgY29ybmVyIGNyZWF0ZWQsIGl0IGNhbiByZXNvbHZlXG4gICAgICogICAgICBzcGlrZWQgdGV4dCBpc3N1ZXMuIERlZmF1bHQgaXMgJ21pdGVyJyAoY3JlYXRlcyBhIHNoYXJwIGNvcm5lcikuXG4gICAgICogQHBhcmFtIFt2YWx1ZS5taXRlckxpbWl0PTEwXSB7bnVtYmVyfSBUaGUgbWl0ZXIgbGltaXQgdG8gdXNlIHdoZW4gdXNpbmcgdGhlICdtaXRlcicgbGluZUpvaW4gbW9kZS4gVGhpcyBjYW4gcmVkdWNlXG4gICAgICogICAgICBvciBpbmNyZWFzZSB0aGUgc3Bpa2luZXNzIG9mIHJlbmRlcmVkIHRleHQuXG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgc3R5bGU6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc3R5bGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB7fTtcbiAgICAgICAgICAgIHN0eWxlLmZvbnQgPSB2YWx1ZS5mb250IHx8ICdib2xkIDIwcHggQXJpYWwnO1xuICAgICAgICAgICAgc3R5bGUubGluZUhlaWdodCA9ICh0eXBlb2YgdmFsdWUubGluZUhlaWdodCAhPT0gJ3VuZGVmaW5lZCcpID8gKHZhbHVlLmxpbmVIZWlnaHQgKiB0aGlzLnJlc29sdXRpb24pIDogKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICBzdHlsZS5maWxsID0gdmFsdWUuZmlsbCB8fCAnYmxhY2snO1xuICAgICAgICAgICAgc3R5bGUuYWxpZ24gPSB2YWx1ZS5hbGlnbiB8fCAnbGVmdCc7XG4gICAgICAgICAgICBzdHlsZS5zdHJva2UgPSB2YWx1ZS5zdHJva2UgfHwgJ2JsYWNrJzsgLy9wcm92aWRlIGEgZGVmYXVsdCwgc2VlOiBodHRwczovL2dpdGh1Yi5jb20vR29vZEJveURpZ2l0YWwvcGl4aS5qcy9pc3N1ZXMvMTM2XG4gICAgICAgICAgICBzdHlsZS5zdHJva2VUaGlja25lc3MgPSB2YWx1ZS5zdHJva2VUaGlja25lc3MgfHwgMDtcbiAgICAgICAgICAgIHN0eWxlLndvcmRXcmFwID0gdmFsdWUud29yZFdyYXAgfHwgZmFsc2U7XG4gICAgICAgICAgICBzdHlsZS53b3JkV3JhcFdpZHRoID0gdmFsdWUud29yZFdyYXBXaWR0aCB8fCAxMDA7XG5cbiAgICAgICAgICAgIHN0eWxlLmRyb3BTaGFkb3cgPSB2YWx1ZS5kcm9wU2hhZG93IHx8IGZhbHNlO1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0NvbG9yID0gdmFsdWUuZHJvcFNoYWRvd0NvbG9yIHx8ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHN0eWxlLmRyb3BTaGFkb3dBbmdsZSA9IHZhbHVlLmRyb3BTaGFkb3dBbmdsZSB8fCBNYXRoLlBJIC8gNjtcbiAgICAgICAgICAgIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSA9IHZhbHVlLmRyb3BTaGFkb3dEaXN0YW5jZSB8fCA1O1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0JsdXIgPSB2YWx1ZS5kcm9wU2hhZG93Qmx1ciB8fCAwO1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd1N0cmVuZ3RoID0gdmFsdWUuZHJvcFNoYWRvd1N0cmVuZ3RoIHx8wqAxO1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd1N0cm9rZSA9IHZhbHVlLmRyb3BTaGFkb3dTdHJva2UgfHzCoDA7XG5cbiAgICAgICAgICAgIHN0eWxlLnBhZGRpbmcgPSB2YWx1ZS5wYWRkaW5nIHx8IDA7XG5cbiAgICAgICAgICAgIHN0eWxlLnRleHRCYXNlbGluZSA9IHZhbHVlLnRleHRCYXNlbGluZSB8fCAnYWxwaGFiZXRpYyc7XG5cbiAgICAgICAgICAgIHN0eWxlLmxpbmVKb2luID0gdmFsdWUubGluZUpvaW4gfHwgJ21pdGVyJztcbiAgICAgICAgICAgIHN0eWxlLm1pdGVyTGltaXQgPSB2YWx1ZS5taXRlckxpbWl0IHx8IDEwO1xuXG4gICAgICAgICAgICB2YXIgb2xkU3R5bGUgPSBKU09OLnN0cmluZ2lmeSh0aGlzLl9nZW5lcmF0ZWRTdHlsZSk7XG5cbiAgICAgICAgICAgIC8vbXVsdGlwbHkgdGhlIGZvbnQgc3R5bGUgYnkgdGhlIHJlc29sdXRpb25cbiAgICAgICAgICAgIC8vVE9ETyA6IHdhcm4gaWYgZm9udCBzaXplIG5vdCBpbiBweCB1bml0XG4gICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZWRTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICBmb250IDogKHN0eWxlLmZvbnQgfHwgJycpLnJlcGxhY2UoL1swLTlcXC5dKy8sKHBhcnNlRmxvYXQoc3R5bGUuZm9udC5tYXRjaCgvWzAtOVxcLl0rLylbMF0pICogdGhpcy5yZXNvbHV0aW9uKS50b0ZpeGVkKDApKSxcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0IDogc3R5bGUubGluZUhlaWdodCxcbiAgICAgICAgICAgICAgICBmaWxsIDogc3R5bGUuZmlsbCxcbiAgICAgICAgICAgICAgICBhbGlnbiA6IHN0eWxlLmFsaWduLFxuICAgICAgICAgICAgICAgIHN0cm9rZSA6IHN0eWxlLnN0cm9rZSxcbiAgICAgICAgICAgICAgICBzdHJva2VUaGlja25lc3MgOiBNYXRoLnJvdW5kKHN0eWxlLnN0cm9rZVRoaWNrbmVzcyp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIHdvcmRXcmFwIDogc3R5bGUud29yZFdyYXAsXG4gICAgICAgICAgICAgICAgd29yZFdyYXBXaWR0aCA6IE1hdGgucm91bmQoc3R5bGUud29yZFdyYXBXaWR0aCp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3cgOiBzdHlsZS5kcm9wU2hhZG93LFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3dDb2xvciA6IHN0eWxlLmRyb3BTaGFkb3dDb2xvcixcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93QW5nbGUgOiBzdHlsZS5kcm9wU2hhZG93QW5nbGUsXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd0Rpc3RhbmNlIDogTWF0aC5yb3VuZChzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UqdGhpcy5yZXNvbHV0aW9uKSxcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93Qmx1ciA6IHN0eWxlLmRyb3BTaGFkb3dCbHVyIHx8IDAsXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd1N0cmVuZ3RoIDogc3R5bGUuZHJvcFNoYWRvd1N0cmVuZ3RoIHx8IDEsXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd1N0cm9rZSA6IHN0eWxlLmRyb3BTaGFkb3dTdHJva2UgfHwgMCxcbiAgICAgICAgICAgICAgICBwYWRkaW5nIDogTWF0aC5yb3VuZChzdHlsZS5wYWRkaW5nKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgdGV4dEJhc2VsaW5lIDogc3R5bGUudGV4dEJhc2VsaW5lLFxuICAgICAgICAgICAgICAgIGxpbmVKb2luIDogc3R5bGUubGluZUpvaW4sXG4gICAgICAgICAgICAgICAgbWl0ZXJMaW1pdCA6IHN0eWxlLm1pdGVyTGltaXRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChKU09OLnN0cmluZ2lmeSh0aGlzLl9nZW5lcmF0ZWRTdHlsZSkgIT09IG9sZFN0eWxlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdHlsZSAhPT0gbnVsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZVVwZGF0ZVRleHQodGhpcy5fdGV4dCx2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGNvcHkgZm9yIHRoZSB0ZXh0IG9iamVjdC4gVG8gc3BsaXQgYSBsaW5lIHlvdSBjYW4gdXNlICdcXG4nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQge3N0cmluZ30gVGhlIGNvcHkgdGhhdCB5b3Ugd291bGQgbGlrZSB0aGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgdGV4dDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpe1xuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9TdHJpbmcoKSB8fCAnICc7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCA9PT0gdGV4dClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRleHQsIHRoaXMuX3N0eWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3RleHQgPSB0ZXh0O1xuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnByZXBhcmVVcGRhdGVUZXh0ID0gZnVuY3Rpb24gKHRleHQsc3R5bGUpXG57XG4gICAgdGhpcy5fcGl4aUlkID0gdGV4dCArIEpTT04uc3RyaW5naWZ5KHN0eWxlKSArIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IHRydWU7XG59O1xuXG52YXIgdGV4dHVyZUNhY2hlID0ge307XG5cbi8qKlxuICogUHJlcGFyZSB0aGUgY2FudmFzIGZvciBhbiB1cGRhdGUgYW5kIHRyeSB0byBnZXQgYSBjYWNoZWQgdGV4dCBmaXJzdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5zd2l0Y2hDYW52YXMgPSBmdW5jdGlvbiAoKVxue1xuICAgIHZhciBiYXNlVGV4dHVyZSA9IFBJWEkudXRpbHMuQmFzZVRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuICAgIHZhciB0ZXh0dXJlO1xuICAgIGlmIChiYXNlVGV4dHVyZSlcbiAgICB7XG4gICAgICAgIC8vdGhlcmUgaXMgYSBjYWNoZWQgdGV4dCBmb3IgdGhlc2UgcGFyYW1ldGVyc1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGJhc2VUZXh0dXJlLnNvdXJjZTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdGV4dHVyZSA9IHRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuXG4gICAgICAgIHRleHR1cmUgPSBQSVhJLlRleHR1cmUuZnJvbUNhbnZhcyh0aGlzLmNhbnZhcyk7XG4gICAgICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgICAgICB0ZXh0dXJlQ2FjaGVbdGhpcy5fcGl4aUlkXSA9IHRleHR1cmU7XG5cbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy50ZXh0dXJlID0gdGV4dHVyZTtcbiAgICB0aGlzLl90ZXh0dXJlID0gdGV4dHVyZTtcbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRleHQgYW5kIHVwZGF0ZXMgaXQgd2hlbiBuZWVkZWRcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS51cGRhdGVUZXh0ID0gZnVuY3Rpb24gKClcbntcbiAgICBpZiAodGhpcy5zd2l0Y2hOZWVkZWQpXG4gICAge1xuICAgICAgICB0aGlzLnN3aXRjaENhbnZhcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdmFyIHN0eWxlID0gdGhpcy5fZ2VuZXJhdGVkU3R5bGU7XG4gICAgICAgIHRoaXMuY29udGV4dC5mb250ID0gc3R5bGUuZm9udDtcblxuICAgICAgICAvLyB3b3JkIHdyYXBcbiAgICAgICAgLy8gcHJlc2VydmUgb3JpZ2luYWwgdGV4dFxuICAgICAgICB2YXIgb3V0cHV0VGV4dCA9IHN0eWxlLndvcmRXcmFwID8gdGhpcy53b3JkV3JhcCh0aGlzLl90ZXh0KSA6IHRoaXMuX3RleHQ7XG5cbiAgICAgICAgLy8gc3BsaXQgdGV4dCBpbnRvIGxpbmVzXG4gICAgICAgIHZhciBsaW5lcyA9IG91dHB1dFRleHQuc3BsaXQoLyg/OlxcclxcbnxcXHJ8XFxuKS8pO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0ZXh0IHdpZHRoXG4gICAgICAgIHZhciBsaW5lV2lkdGhzID0gbmV3IEFycmF5KGxpbmVzLmxlbmd0aCk7XG4gICAgICAgIHZhciBtYXhMaW5lV2lkdGggPSAwO1xuICAgICAgICB2YXIgZm9udFByb3BlcnRpZXMgPSB0aGlzLmRldGVybWluZUZvbnRQcm9wZXJ0aWVzKHN0eWxlLmZvbnQpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgbGluZVdpZHRoID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KGxpbmVzW2ldKS53aWR0aDtcbiAgICAgICAgICAgIGxpbmVXaWR0aHNbaV0gPSBsaW5lV2lkdGg7XG4gICAgICAgICAgICBtYXhMaW5lV2lkdGggPSBNYXRoLm1heChtYXhMaW5lV2lkdGgsIGxpbmVXaWR0aCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd2lkdGggPSBtYXhMaW5lV2lkdGggKyBzdHlsZS5zdHJva2VUaGlja25lc3M7XG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB3aWR0aCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9ICggd2lkdGggKyB0aGlzLmNvbnRleHQubGluZVdpZHRoICk7XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHRleHQgaGVpZ2h0XG4gICAgICAgIHZhciBsaW5lSGVpZ2h0ID0gdGhpcy5zdHlsZS5saW5lSGVpZ2h0IHx8IGZvbnRQcm9wZXJ0aWVzLmZvbnRTaXplICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzO1xuXG4gICAgICAgIHZhciBoZWlnaHQgPSBsaW5lSGVpZ2h0ICogbGluZXMubGVuZ3RoO1xuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgaGVpZ2h0ICs9IHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9ICggaGVpZ2h0ICsgc3R5bGUucGFkZGluZyAqIDIgKTtcblxuICAgICAgICBpZiAobmF2aWdhdG9yLmlzQ29jb29uSlMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHRoaXMuY29udGV4dC5mb250ID0gc3R5bGUuZm9udDtcbiAgICAgICAgdGhpcy5jb250ZXh0LnRleHRCYXNlbGluZSA9IHN0eWxlLnRleHRCYXNlbGluZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVKb2luID0gc3R5bGUubGluZUpvaW47XG4gICAgICAgIHRoaXMuY29udGV4dC5taXRlckxpbWl0ID0gc3R5bGUubWl0ZXJMaW1pdDtcblxuICAgICAgICB2YXIgbGluZVBvc2l0aW9uWDtcbiAgICAgICAgdmFyIGxpbmVQb3NpdGlvblk7XG5cbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBkcm9wU2hhZG93Q29sb3IgPSBzdHlsZS5kcm9wU2hhZG93Q29sb3I7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRyb3BTaGFkb3dDb2xvciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93Q29sb3IgPSB0aGlzLmdyYWRpZW50RmlsbChkcm9wU2hhZG93Q29sb3IsIHdpZHRoLCBsaW5lSGVpZ2h0ICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICsgc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHhTaGFkb3dPZmZzZXQgPSBNYXRoLmNvcyhzdHlsZS5kcm9wU2hhZG93QW5nbGUpICogc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICAgICAgdmFyIHlTaGFkb3dPZmZzZXQgPSBNYXRoLnNpbihzdHlsZS5kcm9wU2hhZG93QW5nbGUpICogc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlIC8gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Q29sb3IgPSBkcm9wU2hhZG93Q29sb3I7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHhTaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHlTaGFkb3dPZmZzZXQ7XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93Qmx1cikge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zaGFkb3dCbHVyID0gc3R5bGUuZHJvcFNoYWRvd0JsdXIgKiB0aGlzLnJlc29sdXRpb24gKiAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Q29sb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3Ryb2tlID0gc3R5bGUuc3Ryb2tlO1xuICAgICAgICBpZiAodHlwZW9mIHN0cm9rZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHN0cm9rZSA9IHRoaXMuZ3JhZGllbnRGaWxsKHN0cm9rZSwgd2lkdGgsIGxpbmVIZWlnaHQgKyBzdHlsZS5zdHJva2VUaGlja25lc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gc3Ryb2tlO1xuICAgICAgICB0aGlzLmNvbnRleHQubGluZVdpZHRoID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzO1xuXG5cbiAgICAgICAgdmFyIGZpbGwgPSBzdHlsZS5maWxsO1xuICAgICAgICBpZiAodHlwZW9mIGZpbGwgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBmaWxsID0gdGhpcy5ncmFkaWVudEZpbGwoXG4gICAgICAgICAgICAgICAgZmlsbCxcbiAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0LFxuICAgICAgICAgICAgICAgIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyArIHN0eWxlLnBhZGRpbmdcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCBjYW52YXMgdGV4dCBzdHlsZXNcbiAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IGZpbGw7XG5cbiAgICAgICAgLy9kcmF3IGxpbmVzIGxpbmUgYnkgbGluZVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxpbmVQb3NpdGlvblggPSBzdHlsZS5zdHJva2VUaGlja25lc3MgLyAyO1xuICAgICAgICAgICAgbGluZVBvc2l0aW9uWSA9IChzdHlsZS5zdHJva2VUaGlja25lc3MgLyAyICsgaSAqIGxpbmVIZWlnaHQpICsgZm9udFByb3BlcnRpZXMuYXNjZW50O1xuXG4gICAgICAgICAgICBpZiAoc3R5bGUuYWxpZ24gPT09ICdyaWdodCcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGluZVBvc2l0aW9uWCArPSBtYXhMaW5lV2lkdGggLSBsaW5lV2lkdGhzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3R5bGUuYWxpZ24gPT09ICdjZW50ZXInKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gKG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV0pIC8gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0eWxlLnN0cm9rZSAmJiBzdHlsZS5zdHJva2VUaGlja25lc3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVRleHQobGluZXNbaV0sIGxpbmVQb3NpdGlvblgsIGxpbmVQb3NpdGlvblkgKyBzdHlsZS5wYWRkaW5nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0eWxlLmZpbGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YLCBsaW5lUG9zaXRpb25ZICsgc3R5bGUucGFkZGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZVRleHR1cmUoKTtcbn07XG5cbkNvY29vblRleHQucHJvdG90eXBlLmdyYWRpZW50RmlsbCA9IGZ1bmN0aW9uIChvcHRpb25zLCB3aWR0aCwgaGVpZ2h0LCBwYWRkaW5nKVxue1xuICAgIHBhZGRpbmcgPSBwYWRkaW5nIHx8IDA7XG4gICAgd2lkdGggPSB3aWR0aCArIHBhZGRpbmc7XG4gICAgaGVpZ2h0ID0gaGVpZ2h0ICsgcGFkZGluZztcblxuICAgIHZhciBwYWRkaW5nWCwgcGFkZGluZ1k7XG4gICAgcGFkZGluZ1ggPSBwYWRkaW5nWSA9IHBhZGRpbmc7XG5cbiAgICBpZiAob3B0aW9ucy52ZXJ0aWNhbCkge1xuICAgICAgICBoZWlnaHQgPSAwO1xuICAgICAgICBwYWRkaW5nWSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2lkdGggPSAwO1xuICAgICAgICBwYWRkaW5nWCA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGdyYWRpZW50ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUxpbmVhckdyYWRpZW50KHBhZGRpbmdYLCBwYWRkaW5nWSwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgaUxlbiA9IG9wdGlvbnMuc3RvcHMubGVuZ3RoOyBpIDwgaUxlbjsgaSsrKSB7XG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChvcHRpb25zLnN0b3BzW2ldLnN0b3AsIG9wdGlvbnMuc3RvcHNbaV0uY29sb3IpO1xuICAgIH1cblxuICAgIHJldHVybiBncmFkaWVudDtcbn07XG5cbkNvY29vblRleHQucHJvdG90eXBlLmJsdXIgPSBmdW5jdGlvbiAoaXRlcmF0aW9ucywgc3RyZW5ndGgsIGFscGhhKSB7XG4gICAgdmFyIHggPSAwO1xuICAgIHZhciB5ID0gMDtcblxuICAgIC8vIENvcHkgdGhlIGN1cnJlbnQgcGl4ZWxzIHRvIGJlIHVzZWQgYXMgYSBzdGVuY2lsXG4gICAgdmFyIG5ld0NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBjb250ZXh0ID0gbmV3Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgbmV3Q2FudmFzLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGg7XG4gICAgbmV3Q2FudmFzLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcbiAgICBjb250ZXh0LmRyYXdJbWFnZSh0aGlzLmNhbnZhcywgMCwgMCk7XG5cbiAgICB2YXIgb2xkQWxwaGEgPSB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGE7XG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhID0gYWxwaGEgLyAoaXRlcmF0aW9ucyAqIDQpO1xuICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgICAvLyBBcHBseSBibHVyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVyYXRpb25zICogNDsgKytpKSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBpICUgNDtcbiAgICAgICAgdmFyIG9mZnNldCA9ICgoaSArIDEpIC8gNCkgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIDA6ICAvLyBVcC5cbiAgICAgICAgICAgICAgICB5IC09IG9mZnNldDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOiAgLy8gUmlnaHQuXG4gICAgICAgICAgICAgICAgeCArPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjogIC8vIERvd24uXG4gICAgICAgICAgICAgICAgeSArPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzogIC8vIExlZnQuXG4gICAgICAgICAgICAgICAgeCAtPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKG5ld0NhbnZhcywgeCwgeSk7XG4gICAgfVxuXG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhID0gb2xkQWxwaGE7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGV4dHVyZSBzaXplIGJhc2VkIG9uIGNhbnZhcyBzaXplXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUudXBkYXRlVGV4dHVyZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIHRleHR1cmUgPSB0aGlzLl90ZXh0dXJlO1xuXG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUuaGFzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5yZXNvbHV0aW9uID0gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG4gICAgfVxuXG4gICAgdGV4dHVyZS5vcmlnLndpZHRoID0gdGV4dHVyZS5fZnJhbWUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0ZXh0dXJlLm9yaWcuaGVpZ2h0ID0gdGV4dHVyZS5fZnJhbWUuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdGV4dHVyZS50cmltLnggPSAwO1xuICAgIHRleHR1cmUudHJpbS55ID0gLXRoaXMuX3N0eWxlLnBhZGRpbmc7XG5cbiAgICB0ZXh0dXJlLnRyaW0ud2lkdGggPSB0ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICB0ZXh0dXJlLnRyaW0uaGVpZ2h0ID0gdGV4dHVyZS5fZnJhbWUuaGVpZ2h0OyAvLy0gdGhpcy5fc3R5bGUucGFkZGluZyoyO1xuXG4gICAgdGhpcy5fd2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0aGlzLnNjYWxlLnggPSAxO1xuICAgIHRoaXMuc2NhbGUueSA9IDE7XG5cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5lbWl0KCd1cGRhdGUnLCAgdGV4dHVyZS5iYXNlVGV4dHVyZSk7XG4gICAgfVxuXG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhc2NlbnQsIGRlc2NlbnQgYW5kIGZvbnRTaXplIG9mIGEgZ2l2ZW4gZm9udFN0eWxlXG4gKlxuICogQHBhcmFtIGZvbnRTdHlsZSB7b2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZGV0ZXJtaW5lRm9udFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoZm9udFN0eWxlKVxue1xuICAgIHZhciBwcm9wZXJ0aWVzID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FjaGVbZm9udFN0eWxlXTtcblxuICAgIGlmICghcHJvcGVydGllcylcbiAgICB7XG4gICAgICAgIHByb3BlcnRpZXMgPSB7fTtcblxuICAgICAgICB2YXIgY2FudmFzID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FudmFzO1xuICAgICAgICB2YXIgY29udGV4dCA9IFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NvbnRleHQ7XG5cbiAgICAgICAgY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuXG4gICAgICAgIHZhciB3aWR0aCA9IE1hdGguY2VpbChjb250ZXh0Lm1lYXN1cmVUZXh0KCd8TcOJcScpLndpZHRoKTtcbiAgICAgICAgdmFyIGJhc2VsaW5lID0gTWF0aC5jZWlsKGNvbnRleHQubWVhc3VyZVRleHQoJ00nKS53aWR0aCk7XG4gICAgICAgIHZhciBoZWlnaHQgPSAyICogYmFzZWxpbmU7XG5cbiAgICAgICAgLy8gYmFzZWxpbmUgZmFjdG9yIGRlcGVuZHMgYSBsb3Qgb2YgdGhlIGZvbnQuIHRvZG8gOiBsZXQgdXNlciBzcGVjaWZ5IGEgZmFjdG9yIHBlciBmb250IG5hbWUgP1xuICAgICAgICBiYXNlbGluZSA9IGJhc2VsaW5lICogMS4yIHwgMDtcblxuICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjZjAwJztcbiAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgICAgICBjb250ZXh0LmZvbnQgPSBmb250U3R5bGU7XG5cbiAgICAgICAgY29udGV4dC50ZXh0QmFzZWxpbmUgPSAnYWxwaGFiZXRpYyc7XG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyMwMDAnO1xuICAgICAgICBjb250ZXh0LmZpbGxUZXh0KCd8TcOJcScsIDAsIGJhc2VsaW5lKTtcblxuICAgICAgICB2YXIgaW1hZ2VkYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCkuZGF0YTtcbiAgICAgICAgdmFyIHBpeGVscyA9IGltYWdlZGF0YS5sZW5ndGg7XG4gICAgICAgIHZhciBsaW5lID0gd2lkdGggKiA0O1xuXG4gICAgICAgIHZhciBpLCBqO1xuXG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgc3RvcCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGFzY2VudC4gc2NhbiBmcm9tIHRvcCB0byBib3R0b20gdW50aWwgd2UgZmluZCBhIG5vbiByZWQgcGl4ZWxcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGJhc2VsaW5lOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsaW5lOyBqICs9IDQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGltYWdlZGF0YVtpZHggKyBqXSAhPT0gMjU1KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RvcClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZHggKz0gbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BlcnRpZXMuYXNjZW50ID0gYmFzZWxpbmUgLSBpO1xuXG4gICAgICAgIGlkeCA9IHBpeGVscyAtIGxpbmU7XG4gICAgICAgIHN0b3AgPSBmYWxzZTtcblxuICAgICAgICAvLyBkZXNjZW50LiBzY2FuIGZyb20gYm90dG9tIHRvIHRvcCB1bnRpbCB3ZSBmaW5kIGEgbm9uIHJlZCBwaXhlbFxuICAgICAgICBmb3IgKGkgPSBoZWlnaHQ7IGkgPiBiYXNlbGluZTsgaS0tKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbGluZTsgaiArPSA0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChpbWFnZWRhdGFbaWR4ICsgal0gIT09IDI1NSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXN0b3ApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWR4IC09IGxpbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wZXJ0aWVzLmRlc2NlbnQgPSBpIC0gYmFzZWxpbmU7XG4gICAgICAgIHByb3BlcnRpZXMuZm9udFNpemUgPSBwcm9wZXJ0aWVzLmFzY2VudCArIHByb3BlcnRpZXMuZGVzY2VudDtcblxuICAgICAgICBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYWNoZVtmb250U3R5bGVdID0gcHJvcGVydGllcztcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvcGVydGllcztcbn07XG5cbi8qKlxuICogQXBwbGllcyBuZXdsaW5lcyB0byBhIHN0cmluZyB0byBoYXZlIGl0IG9wdGltYWxseSBmaXQgaW50byB0aGUgaG9yaXpvbnRhbFxuICogYm91bmRzIHNldCBieSB0aGUgVGV4dCBvYmplY3QncyB3b3JkV3JhcFdpZHRoIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSB0ZXh0IHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS53b3JkV3JhcCA9IGZ1bmN0aW9uICh0ZXh0KVxue1xuICAgIC8vIEdyZWVkeSB3cmFwcGluZyBhbGdvcml0aG0gdGhhdCB3aWxsIHdyYXAgd29yZHMgYXMgdGhlIGxpbmUgZ3Jvd3MgbG9uZ2VyXG4gICAgLy8gdGhhbiBpdHMgaG9yaXpvbnRhbCBib3VuZHMuXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIHZhciBsaW5lcyA9IHRleHQuc3BsaXQoJ1xcbicpO1xuICAgIHZhciB3b3JkV3JhcFdpZHRoID0gdGhpcy5fZ2VuZXJhdGVkU3R5bGUud29yZFdyYXBXaWR0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgIHtcbiAgICAgICAgdmFyIHNwYWNlTGVmdCA9IHdvcmRXcmFwV2lkdGg7XG4gICAgICAgIHZhciB3b3JkcyA9IGxpbmVzW2ldLnNwbGl0KCcgJyk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgd29yZHMubGVuZ3RoOyBqKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciB3b3JkV2lkdGggPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQod29yZHNbal0pLndpZHRoO1xuICAgICAgICAgICAgdmFyIHdvcmRXaWR0aFdpdGhTcGFjZSA9IHdvcmRXaWR0aCArIHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dCgnICcpLndpZHRoO1xuICAgICAgICAgICAgaWYgKGogPT09IDAgfHwgd29yZFdpZHRoV2l0aFNwYWNlID4gc3BhY2VMZWZ0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIFNraXAgcHJpbnRpbmcgdGhlIG5ld2xpbmUgaWYgaXQncyB0aGUgZmlyc3Qgd29yZCBvZiB0aGUgbGluZSB0aGF0IGlzXG4gICAgICAgICAgICAgICAgLy8gZ3JlYXRlciB0aGFuIHRoZSB3b3JkIHdyYXAgd2lkdGguXG4gICAgICAgICAgICAgICAgaWYgKGogPiAwKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gd29yZHNbal07XG4gICAgICAgICAgICAgICAgc3BhY2VMZWZ0ID0gd29yZFdyYXBXaWR0aCAtIHdvcmRXaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzcGFjZUxlZnQgLT0gd29yZFdpZHRoV2l0aFNwYWNlO1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnICcgKyB3b3Jkc1tqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpIDwgbGluZXMubGVuZ3RoLTEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFxuJztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBvYmplY3QgdXNpbmcgdGhlIFdlYkdMIHJlbmRlcmVyXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIHtXZWJHTFJlbmRlcmVyfVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5yZW5kZXJXZWJHTCA9IGZ1bmN0aW9uIChyZW5kZXJlcilcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIFBJWEkuU3ByaXRlLnByb3RvdHlwZS5yZW5kZXJXZWJHTC5jYWxsKHRoaXMsIHJlbmRlcmVyKTtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0aGUgb2JqZWN0IHVzaW5nIHRoZSBDYW52YXMgcmVuZGVyZXJcbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIge0NhbnZhc1JlbmRlcmVyfVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuX3JlbmRlckNhbnZhcyA9IGZ1bmN0aW9uIChyZW5kZXJlcilcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIFBJWEkuU3ByaXRlLnByb3RvdHlwZS5fcmVuZGVyQ2FudmFzLmNhbGwodGhpcywgcmVuZGVyZXIpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBib3VuZHMgb2YgdGhlIFRleHQgYXMgYSByZWN0YW5nbGUuIFRoZSBib3VuZHMgY2FsY3VsYXRpb24gdGFrZXMgdGhlIHdvcmxkVHJhbnNmb3JtIGludG8gYWNjb3VudC5cbiAqXG4gKiBAcGFyYW0gbWF0cml4IHtNYXRyaXh9IHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggb2YgdGhlIFRleHRcbiAqIEByZXR1cm4ge1JlY3RhbmdsZX0gdGhlIGZyYW1pbmcgcmVjdGFuZ2xlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLmdldEJvdW5kcyA9IGZ1bmN0aW9uIChtYXRyaXgpXG57XG4gICAgaWYgKHRoaXMuZGlydHkpXG4gICAge1xuICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUElYSS5TcHJpdGUucHJvdG90eXBlLmdldEJvdW5kcy5jYWxsKHRoaXMsIG1hdHJpeCk7XG59O1xuXG4vKipcbiAqIERlc3Ryb3lzIHRoaXMgdGV4dCBvYmplY3QuXG4gKlxuICogQHBhcmFtIFtkZXN0cm95QmFzZVRleHR1cmU9dHJ1ZV0ge2Jvb2xlYW59IHdoZXRoZXIgdG8gZGVzdHJveSB0aGUgYmFzZSB0ZXh0dXJlIGFzIHdlbGxcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIChkZXN0cm95QmFzZVRleHR1cmUpXG57XG4gICAgLy8gbWFrZSBzdXJlIHRvIHJlc2V0IHRoZSB0aGUgY29udGV4dCBhbmQgY2FudmFzLi4gZG9udCB3YW50IHRoaXMgaGFuZ2luZyBhcm91bmQgaW4gbWVtb3J5IVxuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgdGhpcy5jYW52YXMgPSBudWxsO1xuXG4gICAgdGhpcy5fc3R5bGUgPSBudWxsO1xuXG4gICAgdGhpcy5fdGV4dHVyZS5kZXN0cm95KGRlc3Ryb3lCYXNlVGV4dHVyZSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGRlc3Ryb3lCYXNlVGV4dHVyZSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IFRFWFRfUkVTT0xVVElPTiAtIERlZmF1bHQgcmVzb2x1dGlvbiBvZiBhIG5ldyBDb2Nvb25UZXh0XG4gICAgICogQGNvbnN0YW50XG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIFRFWFRfUkVTT0xVVElPTjoxXG59O1xuIl19
