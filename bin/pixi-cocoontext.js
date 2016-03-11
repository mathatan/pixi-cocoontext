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

    this._pixiId = text+JSON.stringify(style)+this.resolution;

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
                this.prepareUpdateText(text,this._style);
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
    this._pixiId = text+JSON.stringify(style)+this.resolution;
    this.switchNeeded = true;
};

/**
 * Prepare the canvas for an update and try to get a cached text first.
 *
 * @private
 */
CocoonText.prototype.switchCanvas = function ()
{
    var baseTexture = PIXI.utils.BaseTextureCache[this._pixiId];
    if (baseTexture)
    {
        //there is a cached text for these parameters
        this.canvas = baseTexture.source;
        this.context = this.canvas.getContext('2d');

        this.cacheDirty = false;
    }
    else
    {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas._pixiId = this._pixiId;

        this.cacheDirty = true;
    }
    var texture = PIXI.Texture.fromCanvas(this.canvas);
    texture.trim = new PIXI.Rectangle();
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

            this.context.fillStyle = dropShadowColor;

            var xShadowOffset = Math.cos(style.dropShadowAngle) * style.dropShadowDistance / this.resolution;
            var yShadowOffset = Math.sin(style.dropShadowAngle) * style.dropShadowDistance / this.resolution;

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

                if (style.fill) {
                    if (style.dropShadowStroke) {
                        this.context.strokeStyle = dropShadowColor;
                        this.context.lineWidth = style.dropShadowStroke / this.resolution;                        
                    }

                    this.context.globalAlpha = style.dropShadowStrength;
                    if (style.dropShadowStroke) {
                        this.context.strokeText(lines[i], linePositionX + xShadowOffset, linePositionY + yShadowOffset + style.padding);
                    } 

                    this.context.fillText(lines[i], linePositionX + xShadowOffset, linePositionY + yShadowOffset + style.padding);

                    this.context.globalAlpha = 1;

                    if (style.dropShadowBlur) {
                        this.blur(2, style.dropShadowBlur, 1);
                    }
                }
            }
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

    texture.crop.width = texture._frame.width = this.canvas.width / this.resolution;
    texture.crop.height = texture._frame.height = this.canvas.height / this.resolution;

    texture.trim.x = 0;
    texture.trim.y = -this._style.padding;

    texture.trim.width = texture._frame.width;
    texture.trim.height = texture._frame.height - this._style.padding*2;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyIsInNyYy9Db2Nvb25UZXh0VXRpbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3AwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQG5hbWVzcGFjZSBQSVhJLmNvY29vblRleHRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBQSVhJLmNvY29vbnRleHQgPSB7XG4gICAgQ29jb29uVGV4dDogICAgcmVxdWlyZSgnLi9Db2Nvb25UZXh0JyksXG4gICAgQ09OU1Q6ICAgIHJlcXVpcmUoJy4vQ29jb29uVGV4dFV0aWwnKVxufTtcbiIsInZhciBDT05TVCA9IHJlcXVpcmUoJy4uL0NvY29vblRleHRVdGlsJyk7XG5cbi8qKlxuICogQSBDb2Nvb25UZXh0IE9iamVjdCB3aWxsIGNyZWF0ZSBhIGxpbmUgb3IgbXVsdGlwbGUgbGluZXMgb2YgdGV4dC4gVG8gc3BsaXQgYSBsaW5lIHlvdSBjYW4gdXNlICdcXG4nIGluIHlvdXIgdGV4dCBzdHJpbmcsXG4gKiBvciBhZGQgYSB3b3JkV3JhcCBwcm9wZXJ0eSBzZXQgdG8gdHJ1ZSBhbmQgYW5kIHdvcmRXcmFwV2lkdGggcHJvcGVydHkgd2l0aCBhIHZhbHVlIGluIHRoZSBzdHlsZSBvYmplY3QuXG4gKlxuICogT25jZSBhIENvY29vblRleHQgaXMgZ2VuZXJhdGVkLCBpdCBpcyBzdG9yZWQgYXMgYSBCYXNlVGV4dHVyZSBhbmQgd2lsbCBiZSB1c2VkIGlmIGEgbmV3IFRleHQgaXNcbiAqIGNyZWF0ZWQgd2l0aCB0aGUgZXhhY3Qgc2FtZSBwYXJhbWV0ZXJzLlxuICpcbiAqIEEgQ29jb29uVGV4dCBjYW4gYmUgY3JlYXRlZCBkaXJlY3RseSBmcm9tIGEgc3RyaW5nIGFuZCBhIHN0eWxlIG9iamVjdFxuICpcbiAqIGBgYGpzXG4gKiB2YXIgdGV4dCA9IG5ldyBQSVhJLmV4dHJhcy5Db2Nvb25UZXh0KCdUaGlzIGlzIGEgQ29jb29uVGV4dCcse2ZvbnQgOiAnMjRweCBBcmlhbCcsIGZpbGwgOiAweGZmMTAxMCwgYWxpZ24gOiAnY2VudGVyJ30pO1xuICogYGBgXG4gKlxuICogQGNsYXNzXG4gKiBAZXh0ZW5kcyBTcHJpdGVcbiAqIEBtZW1iZXJvZiBQSVhJLmV4dHJhc1xuICogQHBhcmFtIHRleHQge3N0cmluZ30gVGhlIGNvcHkgdGhhdCB5b3Ugd291bGQgbGlrZSB0aGUgdGV4dCB0byBkaXNwbGF5XG4gKiBAcGFyYW0gW3N0eWxlXSB7b2JqZWN0fSBUaGUgc3R5bGUgcGFyYW1ldGVyc1xuICogQHBhcmFtIFtzdHlsZS5mb250XSB7c3RyaW5nfSBkZWZhdWx0ICdib2xkIDIwcHggQXJpYWwnIFRoZSBzdHlsZSBhbmQgc2l6ZSBvZiB0aGUgZm9udFxuICogQHBhcmFtIFtzdHlsZS5maWxsPSdibGFjayddIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IGUuZyAncmVkJywgJyMwMEZGMDAnLFxuICogICAgICBvciBvYmplY3QgZm9yIGdyYWRpZW50cyAne3ZlcnRpY2FsOiBmYWxzZSwgc3RvcHMgOiBbe3N0b3A6IDAgLCBjb2xvcjogJyMwMDAnfSwge3N0b3A6IDEsIGNvbG9yOiAnI0ZGRiddfSdcbiAqIEBwYXJhbSBbc3R5bGUuYWxpZ249J2xlZnQnXSB7c3RyaW5nfSBBbGlnbm1lbnQgZm9yIG11bHRpbGluZSB0ZXh0ICgnbGVmdCcsICdjZW50ZXInIG9yICdyaWdodCcpLCBkb2VzIG5vdCBhZmZlY3Qgc2luZ2xlIGxpbmUgdGV4dFxuICogQHBhcmFtIFtzdHlsZS5zdHJva2VdIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IHN0cm9rZSwgc2VlICdmaWxsJyBmb3IgZGV0YWlsc1xuICogQHBhcmFtIFtzdHlsZS5zdHJva2VUaGlja25lc3M9MF0ge251bWJlcn0gQSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB0aGlja25lc3Mgb2YgdGhlIHN0cm9rZS4gRGVmYXVsdCBpcyAwIChubyBzdHJva2UpXG4gKiBAcGFyYW0gW3N0eWxlLndvcmRXcmFwPWZhbHNlXSB7Ym9vbGVhbn0gSW5kaWNhdGVzIGlmIHdvcmQgd3JhcCBzaG91bGQgYmUgdXNlZFxuICogQHBhcmFtIFtzdHlsZS53b3JkV3JhcFdpZHRoPTEwMF0ge251bWJlcn0gVGhlIHdpZHRoIGF0IHdoaWNoIHRleHQgd2lsbCB3cmFwLCBpdCBuZWVkcyB3b3JkV3JhcCB0byBiZSBzZXQgdG8gdHJ1ZVxuICogQHBhcmFtIFtzdHlsZS5saW5lSGVpZ2h0XSB7bnVtYmVyfSBUaGUgbGluZSBoZWlnaHQsIGEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdmVydGljYWwgc3BhY2UgdGhhdCBhIGxldHRlciB1c2VzXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3c9ZmFsc2VdIHtib29sZWFufSBTZXQgYSBkcm9wIHNoYWRvdyBmb3IgdGhlIHRleHRcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0NvbG9yPScjMDAwMDAwJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGZpbGwgc3R5bGUgdG8gYmUgdXNlZCBvbiB0aGUgZHJvcHNoYWRvdywgc2VlICdmaWxsJyBmb3IgZGV0YWlsc1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93QW5nbGU9TWF0aC5QSS80XSB7bnVtYmVyfSBTZXQgYSBhbmdsZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlPTVdIHtudW1iZXJ9IFNldCBhIGRpc3RhbmNlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93Qmx1cj0wXSB7bnVtYmVyfSBIb3cgbXVjaCBkcm9wIHNoYWRvdyBzaG91bGQgYmUgYmx1cnJlZCwgMCBkaXNhYmxlcyBibHVyXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dTdHJlbmd0aD0xXSB7bnVtYmVyfSBTZXQgdGhlIG9wYWNpdHkgb2YgZHJvcCBzaGFkb3cgd2hlbiBibHVycmluZ1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93U3Ryb2tlPTFdIHtudW1iZXJ9IFNldCB0aGUgc3Ryb2tlIHdpZHRoIG9mIHRoZSBkcm9wIHNoYWRvd1xuICogQHBhcmFtIFtzdHlsZS5wYWRkaW5nPTBdIHtudW1iZXJ9IE9jY2FzaW9uYWxseSBzb21lIGZvbnRzIGFyZSBjcm9wcGVkLiBBZGRpbmcgc29tZSBwYWRkaW5nIHdpbGwgcHJldmVudCB0aGlzIGZyb20gaGFwcGVuaW5nXG4gKiBAcGFyYW0gW3N0eWxlLnRleHRCYXNlbGluZT0nYWxwaGFiZXRpYyddIHtzdHJpbmd9IFRoZSBiYXNlbGluZSBvZiB0aGUgdGV4dCB0aGF0IGlzIHJlbmRlcmVkLlxuICogQHBhcmFtIFtzdHlsZS5saW5lSm9pbj0nbWl0ZXInXSB7c3RyaW5nfSBUaGUgbGluZUpvaW4gcHJvcGVydHkgc2V0cyB0aGUgdHlwZSBvZiBjb3JuZXIgY3JlYXRlZCwgaXQgY2FuIHJlc29sdmVcbiAqICAgICAgc3Bpa2VkIHRleHQgaXNzdWVzLiBEZWZhdWx0IGlzICdtaXRlcicgKGNyZWF0ZXMgYSBzaGFycCBjb3JuZXIpLlxuICogQHBhcmFtIFtzdHlsZS5taXRlckxpbWl0PTEwXSB7bnVtYmVyfSBUaGUgbWl0ZXIgbGltaXQgdG8gdXNlIHdoZW4gdXNpbmcgdGhlICdtaXRlcicgbGluZUpvaW4gbW9kZS4gVGhpcyBjYW4gcmVkdWNlXG4gKiAgICAgIG9yIGluY3JlYXNlIHRoZSBzcGlraW5lc3Mgb2YgcmVuZGVyZWQgdGV4dC5cbiAqL1xuZnVuY3Rpb24gQ29jb29uVGV4dCh0ZXh0LCBzdHlsZSwgcmVzb2x1dGlvbilcbntcbiAgICAvKipcbiAgICAgKiBUaGUgY2FudmFzIGVsZW1lbnQgdGhhdCBldmVyeXRoaW5nIGlzIGRyYXduIHRvXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH1cbiAgICAgKi9cbiAgICB0aGlzLmNhbnZhcyA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY2FudmFzIDJkIGNvbnRleHQgdGhhdCBldmVyeXRoaW5nIGlzIGRyYXduIHdpdGhcbiAgICAgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH1cbiAgICAgKi9cbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHJlc29sdXRpb24gb2YgdGhlIGNhbnZhcy5cbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5yZXNvbHV0aW9uID0gcmVzb2x1dGlvbiB8fCBDT05TVC5URVhUX1JFU09MVVRJT04gfHwgUElYSS5SRVNPTFVUSU9OO1xuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSB0cmFja2VyIGZvciB0aGUgY3VycmVudCB0ZXh0LlxuICAgICAqXG4gICAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fdGV4dCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBjdXJyZW50IHN0eWxlLlxuICAgICAqXG4gICAgICogQG1lbWJlciB7b2JqZWN0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fc3R5bGUgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSB0cmFja2VyIGZvciB0aGUgZ2VuZXJhdGVkIHN0eWxlLlxuICAgICAqXG4gICAgICogQG1lbWJlciB7b2JqZWN0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fZ2VuZXJhdGVkU3R5bGUgPSBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiBzdHlsZS5mb250ICE9PSAndW5kZWZpbmVkJykgeyBzdHlsZS5mb250ID0gKHN0eWxlLmZvbnQucmVwbGFjZSgvWzAtOVxcLl0rLywocGFyc2VGbG9hdChzdHlsZS5mb250Lm1hdGNoKC9bMC05XFwuXSsvKVswXSkpLnRvRml4ZWQoMCkpKTsgfVxuXG4gICAgaWYgKHR5cGVvZiBzdHlsZS5kcm9wU2hhZG93QW5nbGUgPT09ICdudW1iZXInKSB7IHN0eWxlLmRyb3BTaGFkb3dBbmdsZSA9IChNYXRoLnJvdW5kKDEwMDAgKiBzdHlsZS5kcm9wU2hhZG93QW5nbGUpIC8gMTAwMCk7IH1cbiAgICBpZiAodHlwZW9mIHN0eWxlLmRyb3BTaGFkb3dCbHVyID09PSAnbnVtYmVyJykgeyBzdHlsZS5kcm9wU2hhZG93Qmx1ciA9IChNYXRoLnJvdW5kKDEwMDAgKiBzdHlsZS5kcm9wU2hhZG93Qmx1cikgLyAxMDAwKTsgfVxuICAgIGlmICh0eXBlb2Ygc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlID09PSAnbnVtYmVyJykgeyBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgPSAoTWF0aC5yb3VuZCgxMDAwICogc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlKSAvIDEwMDApOyB9XG4gICAgaWYgKHR5cGVvZiBzdHlsZS5kcm9wU2hhZG93U3RyZW5ndGggPT09ICdudW1iZXInKSB7IHN0eWxlLmRyb3BTaGFkb3dTdHJlbmd0aCA9IChNYXRoLnJvdW5kKDEwMDAgKiBzdHlsZS5kcm9wU2hhZG93U3RyZW5ndGgpIC8gMTAwMCk7IH1cbiAgICBpZiAodHlwZW9mIHN0eWxlLmRyb3BTaGFkb3dTdHJva2UgPT09ICdudW1iZXInKSB7IHN0eWxlLmRyb3BTaGFkb3dTdHJva2UgPSAoTWF0aC5yb3VuZCgxMDAwICogc3R5bGUuZHJvcFNoYWRvd1N0cm9rZSkgLyAxMDAwKTsgfVxuICAgIGlmICh0eXBlb2Ygc3R5bGUubGluZUhlaWdodCA9PT0gJ251bWJlcicpIHsgc3R5bGUubGluZUhlaWdodCA9IChNYXRoLnJvdW5kKDEwMDAgKiBzdHlsZS5saW5lSGVpZ2h0KSAvIDEwMDApOyB9XG4gICAgaWYgKHR5cGVvZiBzdHlsZS5taXRlckxpbWl0ID09PSAnbnVtYmVyJykgeyBzdHlsZS5taXRlckxpbWl0ID0gKE1hdGgucm91bmQoMTAwMCAqIHN0eWxlLm1pdGVyTGltaXQpIC8gMTAwMCk7IH1cbiAgICBpZiAodHlwZW9mIHN0eWxlLnBhZGRpbmcgPT09ICdudW1iZXInKSB7IHN0eWxlLnBhZGRpbmcgPSAoTWF0aC5yb3VuZCgxMDAwICogc3R5bGUucGFkZGluZykgLyAxMDAwKTsgfVxuICAgIGlmICh0eXBlb2Ygc3R5bGUuc3Ryb2tlVGhpY2tuZXNzID09PSAnbnVtYmVyJykgeyBzdHlsZS5zdHJva2VUaGlja25lc3MgPSAoTWF0aC5yb3VuZCgxMDAwICogc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKSAvIDEwMDApOyB9XG4gICAgaWYgKHR5cGVvZiBzdHlsZS53b3JkV3JhcFdpZHRoID09PSAnbnVtYmVyJykgeyBzdHlsZS53b3JkV3JhcFdpZHRoID0gKE1hdGgucm91bmQoMTAwMCAqIHN0eWxlLndvcmRXcmFwV2lkdGgpIC8gMTAwMCk7IH1cblxuICAgIHRoaXMuX3BpeGlJZCA9IHRleHQrSlNPTi5zdHJpbmdpZnkoc3R5bGUpK3RoaXMucmVzb2x1dGlvbjtcblxuICAgIHZhciBiYXNlVGV4dHVyZSA9IFBJWEkudXRpbHMuQmFzZVRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuXG4gICAgaWYgKHR5cGVvZiBiYXNlVGV4dHVyZSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGJhc2VUZXh0dXJlLnNvdXJjZTtcbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHZhciB0ZXh0dXJlID0gUElYSS5UZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXMpO1xuICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgIFBJWEkuU3ByaXRlLmNhbGwodGhpcywgdGV4dHVyZSk7XG5cbiAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgIHRoaXMuc3R5bGUgPSBzdHlsZTtcblxuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gZmFsc2U7XG59XG5cbi8vIGNvbnN0cnVjdG9yXG5Db2Nvb25UZXh0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUElYSS5TcHJpdGUucHJvdG90eXBlKTtcbkNvY29vblRleHQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29jb29uVGV4dDtcbm1vZHVsZS5leHBvcnRzID0gQ29jb29uVGV4dDtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoQ29jb29uVGV4dC5wcm90b3R5cGUsIHtcbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggb2YgdGhlIENvY29vblRleHQsIHNldHRpbmcgdGhpcyB3aWxsIGFjdHVhbGx5IG1vZGlmeSB0aGUgc2NhbGUgdG8gYWNoaWV2ZSB0aGUgdmFsdWUgc2V0XG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgd2lkdGg6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGUueCAqIHRoaXMuX3RleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS54ID0gdmFsdWUgLyB0aGlzLl90ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICAgICAgICAgIHRoaXMuX3dpZHRoID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgQ29jb29uVGV4dCwgc2V0dGluZyB0aGlzIHdpbGwgYWN0dWFsbHkgbW9kaWZ5IHRoZSBzY2FsZSB0byBhY2hpZXZlIHRoZSB2YWx1ZSBzZXRcbiAgICAgKlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKiBAbWVtYmVyb2YgQ29jb29uVGV4dCNcbiAgICAgKi9cbiAgICBoZWlnaHQ6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICB0aGlzLnNjYWxlLnkgKiB0aGlzLl90ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNjYWxlLnkgPSB2YWx1ZSAvIHRoaXMuX3RleHR1cmUuX2ZyYW1lLmhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuX2hlaWdodCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc3R5bGUgb2YgdGhlIHRleHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBbdmFsdWVdIHtvYmplY3R9IFRoZSBzdHlsZSBwYXJhbWV0ZXJzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5mb250PSdib2xkIDIwcHQgQXJpYWwnXSB7c3RyaW5nfSBUaGUgc3R5bGUgYW5kIHNpemUgb2YgdGhlIGZvbnRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmZpbGw9J2JsYWNrJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgZS5nICdyZWQnLCAnIzAwRkYwMCcsXG4gICAgICogICAgICBvciBvYmplY3QgZm9yIGdyYWRpZW50cyAne3ZlcnRpY2FsOiBmYWxzZSwgc3RvcHMgOiBbe3N0b3A6IDAgLCBjb2xvcjogJyMwMDAnfSwge3N0b3A6IDEsIGNvbG9yOiAnI0ZGRiddfSdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmFsaWduPSdsZWZ0J10ge3N0cmluZ30gQWxpZ25tZW50IGZvciBtdWx0aWxpbmUgdGV4dCAoJ2xlZnQnLCAnY2VudGVyJyBvciAncmlnaHQnKSwgZG9lcyBub3QgYWZmZWN0IHNpbmdsZSBsaW5lIHRleHRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnN0cm9rZT0nYmxhY2snXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBzdHJva2UsIHNlZSAnZmlsbCcgZm9yIGRldGFpbHNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnN0cm9rZVRoaWNrbmVzcz0wXSB7bnVtYmVyfSBBIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHRoaWNrbmVzcyBvZiB0aGUgc3Ryb2tlLiBEZWZhdWx0IGlzIDAgKG5vIHN0cm9rZSlcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLndvcmRXcmFwPWZhbHNlXSB7Ym9vbGVhbn0gSW5kaWNhdGVzIGlmIHdvcmQgd3JhcCBzaG91bGQgYmUgdXNlZFxuICAgICAqIEBwYXJhbSBbdmFsdWUud29yZFdyYXBXaWR0aD0xMDBdIHtudW1iZXJ9IFRoZSB3aWR0aCBhdCB3aGljaCB0ZXh0IHdpbGwgd3JhcFxuICAgICAqIEBwYXJhbSBbdmFsdWUubGluZUhlaWdodF0ge251bWJlcn0gVGhlIGxpbmUgaGVpZ2h0LCBhIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHZlcnRpY2FsIHNwYWNlIHRoYXQgYSBsZXR0ZXIgdXNlc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvdz1mYWxzZV0ge2Jvb2xlYW59IFNldCBhIGRyb3Agc2hhZG93IGZvciB0aGUgdGV4dFxuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0NvbG9yPScjMDAwMDAwJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGZpbGwgc3R5bGUgdG8gYmUgdXNlZCBvbiB0aGUgZHJvcHNoYWRvdywgc2VlICdmaWxsJyBmb3IgZGV0YWlsc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0FuZ2xlPU1hdGguUEkvNl0ge251bWJlcn0gU2V0IGEgYW5nbGUgb2YgdGhlIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93RGlzdGFuY2U9NV0ge251bWJlcn0gU2V0IGEgZGlzdGFuY2Ugb2YgdGhlIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93Qmx1cj0wXSB7bnVtYmVyfSBIb3cgbXVjaCBkcm9wIHNoYWRvdyBzaG91bGQgYmUgYmx1cnJlZCwgMCBkaXNhYmxlcyBibHVyXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93U3RyZW5ndGg9MV0ge251bWJlcn0gU2V0IHRoZSBvcGFjaXR5IG9mIGRyb3Agc2hhZG93IHdoZW4gYmx1cnJpbmdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dTdHJva2U9MF0ge251bWJlcn0gU2V0IHRoZSBzdHJva2Ugd2lkdGggb2YgZHJvcCBzaGFkb3dcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnBhZGRpbmc9MF0ge251bWJlcn0gT2NjYXNpb25hbGx5IHNvbWUgZm9udHMgYXJlIGNyb3BwZWQuIEFkZGluZyBzb21lIHBhZGRpbmcgd2lsbCBwcmV2ZW50IHRoaXMgZnJvbSBoYXBwZW5pbmdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnRleHRCYXNlbGluZT0nYWxwaGFiZXRpYyddIHtzdHJpbmd9IFRoZSBiYXNlbGluZSBvZiB0aGUgdGV4dCB0aGF0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSBbdmFsdWUubGluZUpvaW49J21pdGVyJ10ge3N0cmluZ30gVGhlIGxpbmVKb2luIHByb3BlcnR5IHNldHMgdGhlIHR5cGUgb2YgY29ybmVyIGNyZWF0ZWQsIGl0IGNhbiByZXNvbHZlXG4gICAgICogICAgICBzcGlrZWQgdGV4dCBpc3N1ZXMuIERlZmF1bHQgaXMgJ21pdGVyJyAoY3JlYXRlcyBhIHNoYXJwIGNvcm5lcikuXG4gICAgICogQHBhcmFtIFt2YWx1ZS5taXRlckxpbWl0PTEwXSB7bnVtYmVyfSBUaGUgbWl0ZXIgbGltaXQgdG8gdXNlIHdoZW4gdXNpbmcgdGhlICdtaXRlcicgbGluZUpvaW4gbW9kZS4gVGhpcyBjYW4gcmVkdWNlXG4gICAgICogICAgICBvciBpbmNyZWFzZSB0aGUgc3Bpa2luZXNzIG9mIHJlbmRlcmVkIHRleHQuXG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgc3R5bGU6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc3R5bGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB7fTtcbiAgICAgICAgICAgIHN0eWxlLmZvbnQgPSB2YWx1ZS5mb250IHx8ICdib2xkIDIwcHggQXJpYWwnO1xuICAgICAgICAgICAgc3R5bGUubGluZUhlaWdodCA9ICh0eXBlb2YgdmFsdWUubGluZUhlaWdodCAhPT0gJ3VuZGVmaW5lZCcpID8gKHZhbHVlLmxpbmVIZWlnaHQgKiB0aGlzLnJlc29sdXRpb24pIDogKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICBzdHlsZS5maWxsID0gdmFsdWUuZmlsbCB8fCAnYmxhY2snO1xuICAgICAgICAgICAgc3R5bGUuYWxpZ24gPSB2YWx1ZS5hbGlnbiB8fCAnbGVmdCc7XG4gICAgICAgICAgICBzdHlsZS5zdHJva2UgPSB2YWx1ZS5zdHJva2UgfHwgJ2JsYWNrJzsgLy9wcm92aWRlIGEgZGVmYXVsdCwgc2VlOiBodHRwczovL2dpdGh1Yi5jb20vR29vZEJveURpZ2l0YWwvcGl4aS5qcy9pc3N1ZXMvMTM2XG4gICAgICAgICAgICBzdHlsZS5zdHJva2VUaGlja25lc3MgPSB2YWx1ZS5zdHJva2VUaGlja25lc3MgfHwgMDtcbiAgICAgICAgICAgIHN0eWxlLndvcmRXcmFwID0gdmFsdWUud29yZFdyYXAgfHwgZmFsc2U7XG4gICAgICAgICAgICBzdHlsZS53b3JkV3JhcFdpZHRoID0gdmFsdWUud29yZFdyYXBXaWR0aCB8fCAxMDA7XG5cbiAgICAgICAgICAgIHN0eWxlLmRyb3BTaGFkb3cgPSB2YWx1ZS5kcm9wU2hhZG93IHx8IGZhbHNlO1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0NvbG9yID0gdmFsdWUuZHJvcFNoYWRvd0NvbG9yIHx8ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHN0eWxlLmRyb3BTaGFkb3dBbmdsZSA9IHZhbHVlLmRyb3BTaGFkb3dBbmdsZSB8fCBNYXRoLlBJIC8gNjtcbiAgICAgICAgICAgIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSA9IHZhbHVlLmRyb3BTaGFkb3dEaXN0YW5jZSB8fCA1O1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0JsdXIgPSB2YWx1ZS5kcm9wU2hhZG93Qmx1ciB8fCAwO1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd1N0cmVuZ3RoID0gdmFsdWUuZHJvcFNoYWRvd1N0cmVuZ3RoIHx8wqAxO1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd1N0cm9rZSA9IHZhbHVlLmRyb3BTaGFkb3dTdHJva2UgfHzCoDA7XG5cbiAgICAgICAgICAgIHN0eWxlLnBhZGRpbmcgPSB2YWx1ZS5wYWRkaW5nIHx8IDA7XG5cbiAgICAgICAgICAgIHN0eWxlLnRleHRCYXNlbGluZSA9IHZhbHVlLnRleHRCYXNlbGluZSB8fCAnYWxwaGFiZXRpYyc7XG5cbiAgICAgICAgICAgIHN0eWxlLmxpbmVKb2luID0gdmFsdWUubGluZUpvaW4gfHwgJ21pdGVyJztcbiAgICAgICAgICAgIHN0eWxlLm1pdGVyTGltaXQgPSB2YWx1ZS5taXRlckxpbWl0IHx8IDEwO1xuXG4gICAgICAgICAgICB2YXIgb2xkU3R5bGUgPSBKU09OLnN0cmluZ2lmeSh0aGlzLl9nZW5lcmF0ZWRTdHlsZSk7XG5cbiAgICAgICAgICAgIC8vbXVsdGlwbHkgdGhlIGZvbnQgc3R5bGUgYnkgdGhlIHJlc29sdXRpb25cbiAgICAgICAgICAgIC8vVE9ETyA6IHdhcm4gaWYgZm9udCBzaXplIG5vdCBpbiBweCB1bml0XG4gICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZWRTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICBmb250IDogKHN0eWxlLmZvbnQgfHwgJycpLnJlcGxhY2UoL1swLTlcXC5dKy8sKHBhcnNlRmxvYXQoc3R5bGUuZm9udC5tYXRjaCgvWzAtOVxcLl0rLylbMF0pICogdGhpcy5yZXNvbHV0aW9uKS50b0ZpeGVkKDApKSxcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0IDogc3R5bGUubGluZUhlaWdodCxcbiAgICAgICAgICAgICAgICBmaWxsIDogc3R5bGUuZmlsbCxcbiAgICAgICAgICAgICAgICBhbGlnbiA6IHN0eWxlLmFsaWduLFxuICAgICAgICAgICAgICAgIHN0cm9rZSA6IHN0eWxlLnN0cm9rZSxcbiAgICAgICAgICAgICAgICBzdHJva2VUaGlja25lc3MgOiBNYXRoLnJvdW5kKHN0eWxlLnN0cm9rZVRoaWNrbmVzcyp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIHdvcmRXcmFwIDogc3R5bGUud29yZFdyYXAsXG4gICAgICAgICAgICAgICAgd29yZFdyYXBXaWR0aCA6IE1hdGgucm91bmQoc3R5bGUud29yZFdyYXBXaWR0aCp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3cgOiBzdHlsZS5kcm9wU2hhZG93LFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3dDb2xvciA6IHN0eWxlLmRyb3BTaGFkb3dDb2xvcixcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93QW5nbGUgOiBzdHlsZS5kcm9wU2hhZG93QW5nbGUsXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd0Rpc3RhbmNlIDogTWF0aC5yb3VuZChzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UqdGhpcy5yZXNvbHV0aW9uKSxcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93Qmx1ciA6IHN0eWxlLmRyb3BTaGFkb3dCbHVyIHx8IDAsXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd1N0cmVuZ3RoIDogc3R5bGUuZHJvcFNoYWRvd1N0cmVuZ3RoIHx8IDEsXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd1N0cm9rZSA6IHN0eWxlLmRyb3BTaGFkb3dTdHJva2UgfHwgMCxcbiAgICAgICAgICAgICAgICBwYWRkaW5nIDogTWF0aC5yb3VuZChzdHlsZS5wYWRkaW5nKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgdGV4dEJhc2VsaW5lIDogc3R5bGUudGV4dEJhc2VsaW5lLFxuICAgICAgICAgICAgICAgIGxpbmVKb2luIDogc3R5bGUubGluZUpvaW4sXG4gICAgICAgICAgICAgICAgbWl0ZXJMaW1pdCA6IHN0eWxlLm1pdGVyTGltaXRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChKU09OLnN0cmluZ2lmeSh0aGlzLl9nZW5lcmF0ZWRTdHlsZSkgIT09IG9sZFN0eWxlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdHlsZSAhPT0gbnVsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZVVwZGF0ZVRleHQodGhpcy5fdGV4dCx2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGNvcHkgZm9yIHRoZSB0ZXh0IG9iamVjdC4gVG8gc3BsaXQgYSBsaW5lIHlvdSBjYW4gdXNlICdcXG4nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQge3N0cmluZ30gVGhlIGNvcHkgdGhhdCB5b3Ugd291bGQgbGlrZSB0aGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgdGV4dDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpe1xuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9TdHJpbmcoKSB8fCAnICc7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCA9PT0gdGV4dClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRleHQsdGhpcy5fc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdGV4dCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFByZXBhcmUgdGhlIGNhbnZhcyBmb3IgYW4gdXBkYXRlIGFuZCB0cnkgdG8gZ2V0IGEgY2FjaGVkIHRleHQgZmlyc3QuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUucHJlcGFyZVVwZGF0ZVRleHQgPSBmdW5jdGlvbiAodGV4dCxzdHlsZSlcbntcbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0K0pTT04uc3RyaW5naWZ5KHN0eWxlKSt0aGlzLnJlc29sdXRpb247XG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnN3aXRjaENhbnZhcyA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIGJhc2VUZXh0dXJlID0gUElYSS51dGlscy5CYXNlVGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF07XG4gICAgaWYgKGJhc2VUZXh0dXJlKVxuICAgIHtcbiAgICAgICAgLy90aGVyZSBpcyBhIGNhY2hlZCB0ZXh0IGZvciB0aGVzZSBwYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuY2FudmFzID0gYmFzZVRleHR1cmUuc291cmNlO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHZhciB0ZXh0dXJlID0gUElYSS5UZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXMpO1xuICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgIHRoaXMudGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5fdGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0ZXh0IGFuZCB1cGRhdGVzIGl0IHdoZW4gbmVlZGVkXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUudXBkYXRlVGV4dCA9IGZ1bmN0aW9uICgpXG57XG4gICAgaWYgKHRoaXMuc3dpdGNoTmVlZGVkKVxuICAgIHtcbiAgICAgICAgdGhpcy5zd2l0Y2hDYW52YXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMuX2dlbmVyYXRlZFN0eWxlO1xuICAgICAgICB0aGlzLmNvbnRleHQuZm9udCA9IHN0eWxlLmZvbnQ7XG5cbiAgICAgICAgLy8gd29yZCB3cmFwXG4gICAgICAgIC8vIHByZXNlcnZlIG9yaWdpbmFsIHRleHRcbiAgICAgICAgdmFyIG91dHB1dFRleHQgPSBzdHlsZS53b3JkV3JhcCA/IHRoaXMud29yZFdyYXAodGhpcy5fdGV4dCkgOiB0aGlzLl90ZXh0O1xuXG4gICAgICAgIC8vIHNwbGl0IHRleHQgaW50byBsaW5lc1xuICAgICAgICB2YXIgbGluZXMgPSBvdXRwdXRUZXh0LnNwbGl0KC8oPzpcXHJcXG58XFxyfFxcbikvKTtcblxuICAgICAgICAvLyBjYWxjdWxhdGUgdGV4dCB3aWR0aFxuICAgICAgICB2YXIgbGluZVdpZHRocyA9IG5ldyBBcnJheShsaW5lcy5sZW5ndGgpO1xuICAgICAgICB2YXIgbWF4TGluZVdpZHRoID0gMDtcbiAgICAgICAgdmFyIGZvbnRQcm9wZXJ0aWVzID0gdGhpcy5kZXRlcm1pbmVGb250UHJvcGVydGllcyhzdHlsZS5mb250KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGxpbmVXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChsaW5lc1tpXSkud2lkdGg7XG4gICAgICAgICAgICBsaW5lV2lkdGhzW2ldID0gbGluZVdpZHRoO1xuICAgICAgICAgICAgbWF4TGluZVdpZHRoID0gTWF0aC5tYXgobWF4TGluZVdpZHRoLCBsaW5lV2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZHRoID0gbWF4TGluZVdpZHRoICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzO1xuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgd2lkdGggKz0gc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAoIHdpZHRoICsgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCApO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0ZXh0IGhlaWdodFxuICAgICAgICB2YXIgbGluZUhlaWdodCA9IHRoaXMuc3R5bGUubGluZUhlaWdodCB8fCBmb250UHJvcGVydGllcy5mb250U2l6ZSArIHN0eWxlLnN0cm9rZVRoaWNrbmVzcztcblxuICAgICAgICB2YXIgaGVpZ2h0ID0gbGluZUhlaWdodCAqIGxpbmVzLmxlbmd0aDtcbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAoIGhlaWdodCArIHN0eWxlLnBhZGRpbmcgKiAyICk7XG5cbiAgICAgICAgaWYgKG5hdmlnYXRvci5pc0NvY29vbkpTKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cblxuICAgICAgICB0aGlzLmNvbnRleHQuZm9udCA9IHN0eWxlLmZvbnQ7XG4gICAgICAgIHRoaXMuY29udGV4dC50ZXh0QmFzZWxpbmUgPSBzdHlsZS50ZXh0QmFzZWxpbmU7XG4gICAgICAgIHRoaXMuY29udGV4dC5saW5lSm9pbiA9IHN0eWxlLmxpbmVKb2luO1xuICAgICAgICB0aGlzLmNvbnRleHQubWl0ZXJMaW1pdCA9IHN0eWxlLm1pdGVyTGltaXQ7XG5cbiAgICAgICAgdmFyIGxpbmVQb3NpdGlvblg7XG4gICAgICAgIHZhciBsaW5lUG9zaXRpb25ZO1xuXG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgZHJvcFNoYWRvd0NvbG9yID0gc3R5bGUuZHJvcFNoYWRvd0NvbG9yO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkcm9wU2hhZG93Q29sb3IgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd0NvbG9yID0gdGhpcy5ncmFkaWVudEZpbGwoZHJvcFNoYWRvd0NvbG9yLCB3aWR0aCwgbGluZUhlaWdodCArIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyArIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBkcm9wU2hhZG93Q29sb3I7XG5cbiAgICAgICAgICAgIHZhciB4U2hhZG93T2Zmc2V0ID0gTWF0aC5jb3Moc3R5bGUuZHJvcFNoYWRvd0FuZ2xlKSAqIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICAgICAgICAgIHZhciB5U2hhZG93T2Zmc2V0ID0gTWF0aC5zaW4oc3R5bGUuZHJvcFNoYWRvd0FuZ2xlKSAqIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSAvIHRoaXMucmVzb2x1dGlvbjtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggPSBzdHlsZS5zdHJva2VUaGlja25lc3MgLyAyO1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblkgPSAoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMiArIGkgKiBsaW5lSGVpZ2h0KSArIGZvbnRQcm9wZXJ0aWVzLmFzY2VudDtcblxuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5hbGlnbiA9PT0gJ3JpZ2h0JylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gbWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc3R5bGUuYWxpZ24gPT09ICdjZW50ZXInKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZVBvc2l0aW9uWCArPSAobWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXSkgLyAyO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5maWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93U3Ryb2tlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBkcm9wU2hhZG93Q29sb3I7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQubGluZVdpZHRoID0gc3R5bGUuZHJvcFNoYWRvd1N0cm9rZSAvIHRoaXMucmVzb2x1dGlvbjsgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5nbG9iYWxBbHBoYSA9IHN0eWxlLmRyb3BTaGFkb3dTdHJlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3dTdHJva2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YICsgeFNoYWRvd09mZnNldCwgbGluZVBvc2l0aW9uWSArIHlTaGFkb3dPZmZzZXQgKyBzdHlsZS5wYWRkaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSBcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQobGluZXNbaV0sIGxpbmVQb3NpdGlvblggKyB4U2hhZG93T2Zmc2V0LCBsaW5lUG9zaXRpb25ZICsgeVNoYWRvd09mZnNldCArIHN0eWxlLnBhZGRpbmcpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5nbG9iYWxBbHBoYSA9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3dCbHVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJsdXIoMiwgc3R5bGUuZHJvcFNoYWRvd0JsdXIsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0cm9rZSA9IHN0eWxlLnN0cm9rZTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHJva2UgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBzdHJva2UgPSB0aGlzLmdyYWRpZW50RmlsbChzdHJva2UsIHdpZHRoLCBsaW5lSGVpZ2h0ICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHN0cm9rZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IHN0eWxlLnN0cm9rZVRoaWNrbmVzcztcbiBcblxuICAgICAgICB2YXIgZmlsbCA9IHN0eWxlLmZpbGw7XG4gICAgICAgIGlmICh0eXBlb2YgZmlsbCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGZpbGwgPSB0aGlzLmdyYWRpZW50RmlsbChcbiAgICAgICAgICAgICAgICBmaWxsLFxuICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQsXG4gICAgICAgICAgICAgICAgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICsgc3R5bGUucGFkZGluZ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2V0IGNhbnZhcyB0ZXh0IHN0eWxlc1xuICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gZmlsbDtcblxuICAgICAgICAvL2RyYXcgbGluZXMgbGluZSBieSBsaW5lXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgbGluZVBvc2l0aW9uWCA9IHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAvIDI7XG4gICAgICAgICAgICBsaW5lUG9zaXRpb25ZID0gKHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAvIDIgKyBpICogbGluZUhlaWdodCkgKyBmb250UHJvcGVydGllcy5hc2NlbnQ7XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5hbGlnbiA9PT0gJ3JpZ2h0JylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YICs9IG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzdHlsZS5hbGlnbiA9PT0gJ2NlbnRlcicpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGluZVBvc2l0aW9uWCArPSAobWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXSkgLyAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3R5bGUuc3Ryb2tlICYmIHN0eWxlLnN0cm9rZVRoaWNrbmVzcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlVGV4dChsaW5lc1tpXSwgbGluZVBvc2l0aW9uWCwgbGluZVBvc2l0aW9uWSArIHN0eWxlLnBhZGRpbmcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3R5bGUuZmlsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQobGluZXNbaV0sIGxpbmVQb3NpdGlvblgsIGxpbmVQb3NpdGlvblkgKyBzdHlsZS5wYWRkaW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudXBkYXRlVGV4dHVyZSgpO1xufTtcblxuQ29jb29uVGV4dC5wcm90b3R5cGUuZ3JhZGllbnRGaWxsID0gZnVuY3Rpb24gKG9wdGlvbnMsIHdpZHRoLCBoZWlnaHQsIHBhZGRpbmcpXG57XG4gICAgcGFkZGluZyA9IHBhZGRpbmcgfHwgMDtcbiAgICB3aWR0aCA9IHdpZHRoICsgcGFkZGluZztcbiAgICBoZWlnaHQgPSBoZWlnaHQgKyBwYWRkaW5nO1xuXG4gICAgdmFyIHBhZGRpbmdYLCBwYWRkaW5nWTtcbiAgICBwYWRkaW5nWCA9IHBhZGRpbmdZID0gcGFkZGluZztcblxuICAgIGlmIChvcHRpb25zLnZlcnRpY2FsKSB7XG4gICAgICAgIGhlaWdodCA9IDA7XG4gICAgICAgIHBhZGRpbmdZID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3aWR0aCA9IDA7XG4gICAgICAgIHBhZGRpbmdYID0gMDtcbiAgICB9XG5cbiAgICB2YXIgZ3JhZGllbnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlTGluZWFyR3JhZGllbnQocGFkZGluZ1gsIHBhZGRpbmdZLCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBpTGVuID0gb3B0aW9ucy5zdG9wcy5sZW5ndGg7IGkgPCBpTGVuOyBpKyspIHtcbiAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKG9wdGlvbnMuc3RvcHNbaV0uc3RvcCwgb3B0aW9ucy5zdG9wc1tpXS5jb2xvcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyYWRpZW50O1xufTtcblxuQ29jb29uVGV4dC5wcm90b3R5cGUuYmx1ciA9IGZ1bmN0aW9uIChpdGVyYXRpb25zLCBzdHJlbmd0aCwgYWxwaGEpIHtcbiAgICB2YXIgeCA9IDA7XG4gICAgdmFyIHkgPSAwO1xuXG4gICAgLy8gQ29weSB0aGUgY3VycmVudCBwaXhlbHMgdG8gYmUgdXNlZCBhcyBhIHN0ZW5jaWxcbiAgICB2YXIgbmV3Q2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIGNvbnRleHQgPSBuZXdDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBuZXdDYW52YXMud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aDtcbiAgICBuZXdDYW52YXMuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKHRoaXMuY2FudmFzLCAwLCAwKTsgICAgXG5cbiAgICB2YXIgb2xkQWxwaGEgPSB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGE7XG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhID0gYWxwaGEgLyAoaXRlcmF0aW9ucyAqIDQpO1xuICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgICAvLyBBcHBseSBibHVyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVyYXRpb25zICogNDsgKytpKSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBpICUgNDtcbiAgICAgICAgdmFyIG9mZnNldCA9ICgoaSArIDEpIC8gNCkgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIDA6ICAvLyBVcC5cbiAgICAgICAgICAgICAgICB5IC09IG9mZnNldDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOiAgLy8gUmlnaHQuXG4gICAgICAgICAgICAgICAgeCArPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjogIC8vIERvd24uXG4gICAgICAgICAgICAgICAgeSArPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzogIC8vIExlZnQuXG4gICAgICAgICAgICAgICAgeCAtPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKG5ld0NhbnZhcywgeCwgeSk7ICAgICAgICBcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSBvbGRBbHBoYTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0ZXh0dXJlIHNpemUgYmFzZWQgb24gY2FudmFzIHNpemVcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS51cGRhdGVUZXh0dXJlID0gZnVuY3Rpb24gKClcbntcbiAgICB2YXIgdGV4dHVyZSA9IHRoaXMuX3RleHR1cmU7XG5cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5oYXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLnJlc29sdXRpb24gPSB0aGlzLnJlc29sdXRpb247XG5cbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB9XG5cbiAgICB0ZXh0dXJlLmNyb3Aud2lkdGggPSB0ZXh0dXJlLl9mcmFtZS53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRleHR1cmUuY3JvcC5oZWlnaHQgPSB0ZXh0dXJlLl9mcmFtZS5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0ZXh0dXJlLnRyaW0ueCA9IDA7XG4gICAgdGV4dHVyZS50cmltLnkgPSAtdGhpcy5fc3R5bGUucGFkZGluZztcblxuICAgIHRleHR1cmUudHJpbS53aWR0aCA9IHRleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgIHRleHR1cmUudHJpbS5oZWlnaHQgPSB0ZXh0dXJlLl9mcmFtZS5oZWlnaHQgLSB0aGlzLl9zdHlsZS5wYWRkaW5nKjI7XG5cbiAgICB0aGlzLl93aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcblxuICAgIHRoaXMuc2NhbGUueCA9IDE7XG4gICAgdGhpcy5zY2FsZS55ID0gMTtcblxuICAgIGlmICh0aGlzLmNhY2hlRGlydHkpXG4gICAge1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmVtaXQoJ3VwZGF0ZScsICB0ZXh0dXJlLmJhc2VUZXh0dXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGFzY2VudCwgZGVzY2VudCBhbmQgZm9udFNpemUgb2YgYSBnaXZlbiBmb250U3R5bGVcbiAqXG4gKiBAcGFyYW0gZm9udFN0eWxlIHtvYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5kZXRlcm1pbmVGb250UHJvcGVydGllcyA9IGZ1bmN0aW9uIChmb250U3R5bGUpXG57XG4gICAgdmFyIHByb3BlcnRpZXMgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYWNoZVtmb250U3R5bGVdO1xuXG4gICAgaWYgKCFwcm9wZXJ0aWVzKVxuICAgIHtcbiAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuXG4gICAgICAgIHZhciBjYW52YXMgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYW52YXM7XG4gICAgICAgIHZhciBjb250ZXh0ID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ29udGV4dDtcblxuICAgICAgICBjb250ZXh0LmZvbnQgPSBmb250U3R5bGU7XG5cbiAgICAgICAgdmFyIHdpZHRoID0gTWF0aC5jZWlsKGNvbnRleHQubWVhc3VyZVRleHQoJ3xNw4lxJykud2lkdGgpO1xuICAgICAgICB2YXIgYmFzZWxpbmUgPSBNYXRoLmNlaWwoY29udGV4dC5tZWFzdXJlVGV4dCgnTScpLndpZHRoKTtcbiAgICAgICAgdmFyIGhlaWdodCA9IDIgKiBiYXNlbGluZTtcblxuICAgICAgICAvLyBiYXNlbGluZSBmYWN0b3IgZGVwZW5kcyBhIGxvdCBvZiB0aGUgZm9udC4gdG9kbyA6IGxldCB1c2VyIHNwZWNpZnkgYSBmYWN0b3IgcGVyIGZvbnQgbmFtZSA/XG4gICAgICAgIGJhc2VsaW5lID0gYmFzZWxpbmUgKiAxLjIgfCAwO1xuXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmMDAnO1xuICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICAgIGNvbnRleHQuZm9udCA9IGZvbnRTdHlsZTtcblxuICAgICAgICBjb250ZXh0LnRleHRCYXNlbGluZSA9ICdhbHBoYWJldGljJztcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnIzAwMCc7XG4gICAgICAgIGNvbnRleHQuZmlsbFRleHQoJ3xNw4lxJywgMCwgYmFzZWxpbmUpO1xuXG4gICAgICAgIHZhciBpbWFnZWRhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KS5kYXRhO1xuICAgICAgICB2YXIgcGl4ZWxzID0gaW1hZ2VkYXRhLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpbmUgPSB3aWR0aCAqIDQ7XG5cbiAgICAgICAgdmFyIGksIGo7XG5cbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBzdG9wID0gZmFsc2U7XG5cbiAgICAgICAgLy8gYXNjZW50LiBzY2FuIGZyb20gdG9wIHRvIGJvdHRvbSB1bnRpbCB3ZSBmaW5kIGEgbm9uIHJlZCBwaXhlbFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYmFzZWxpbmU7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxpbmU7IGogKz0gNClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VkYXRhW2lkeCArIGpdICE9PSAyNTUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdG9wKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkeCArPSBsaW5lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvcGVydGllcy5hc2NlbnQgPSBiYXNlbGluZSAtIGk7XG5cbiAgICAgICAgaWR4ID0gcGl4ZWxzIC0gbGluZTtcbiAgICAgICAgc3RvcCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlc2NlbnQuIHNjYW4gZnJvbSBib3R0b20gdG8gdG9wIHVudGlsIHdlIGZpbmQgYSBub24gcmVkIHBpeGVsXG4gICAgICAgIGZvciAoaSA9IGhlaWdodDsgaSA+IGJhc2VsaW5lOyBpLS0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsaW5lOyBqICs9IDQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGltYWdlZGF0YVtpZHggKyBqXSAhPT0gMjU1KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RvcClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZHggLT0gbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BlcnRpZXMuZGVzY2VudCA9IGkgLSBiYXNlbGluZTtcbiAgICAgICAgcHJvcGVydGllcy5mb250U2l6ZSA9IHByb3BlcnRpZXMuYXNjZW50ICsgcHJvcGVydGllcy5kZXNjZW50O1xuXG4gICAgICAgIFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NhY2hlW2ZvbnRTdHlsZV0gPSBwcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIG5ld2xpbmVzIHRvIGEgc3RyaW5nIHRvIGhhdmUgaXQgb3B0aW1hbGx5IGZpdCBpbnRvIHRoZSBob3Jpem9udGFsXG4gKiBib3VuZHMgc2V0IGJ5IHRoZSBUZXh0IG9iamVjdCdzIHdvcmRXcmFwV2lkdGggcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHRleHQge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLndvcmRXcmFwID0gZnVuY3Rpb24gKHRleHQpXG57XG4gICAgLy8gR3JlZWR5IHdyYXBwaW5nIGFsZ29yaXRobSB0aGF0IHdpbGwgd3JhcCB3b3JkcyBhcyB0aGUgbGluZSBncm93cyBsb25nZXJcbiAgICAvLyB0aGFuIGl0cyBob3Jpem9udGFsIGJvdW5kcy5cbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgdmFyIGxpbmVzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gICAgdmFyIHdvcmRXcmFwV2lkdGggPSB0aGlzLl9nZW5lcmF0ZWRTdHlsZS53b3JkV3JhcFdpZHRoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgICB2YXIgc3BhY2VMZWZ0ID0gd29yZFdyYXBXaWR0aDtcbiAgICAgICAgdmFyIHdvcmRzID0gbGluZXNbaV0uc3BsaXQoJyAnKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB3b3Jkcy5sZW5ndGg7IGorKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHdvcmRXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dCh3b3Jkc1tqXSkud2lkdGg7XG4gICAgICAgICAgICB2YXIgd29yZFdpZHRoV2l0aFNwYWNlID0gd29yZFdpZHRoICsgdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KCcgJykud2lkdGg7XG4gICAgICAgICAgICBpZiAoaiA9PT0gMCB8fCB3b3JkV2lkdGhXaXRoU3BhY2UgPiBzcGFjZUxlZnQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBwcmludGluZyB0aGUgbmV3bGluZSBpZiBpdCdzIHRoZSBmaXJzdCB3b3JkIG9mIHRoZSBsaW5lIHRoYXQgaXNcbiAgICAgICAgICAgICAgICAvLyBncmVhdGVyIHRoYW4gdGhlIHdvcmQgd3JhcCB3aWR0aC5cbiAgICAgICAgICAgICAgICBpZiAoaiA+IDApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB3b3Jkc1tqXTtcbiAgICAgICAgICAgICAgICBzcGFjZUxlZnQgPSB3b3JkV3JhcFdpZHRoIC0gd29yZFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNwYWNlTGVmdCAtPSB3b3JkV2lkdGhXaXRoU3BhY2U7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcgJyArIHdvcmRzW2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPCBsaW5lcy5sZW5ndGgtMSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIG9iamVjdCB1c2luZyB0aGUgV2ViR0wgcmVuZGVyZXJcbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIge1dlYkdMUmVuZGVyZXJ9XG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnJlbmRlcldlYkdMID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgUElYSS5TcHJpdGUucHJvdG90eXBlLnJlbmRlcldlYkdMLmNhbGwodGhpcywgcmVuZGVyZXIpO1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBvYmplY3QgdXNpbmcgdGhlIENhbnZhcyByZW5kZXJlclxuICpcbiAqIEBwYXJhbSByZW5kZXJlciB7Q2FudmFzUmVuZGVyZXJ9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5fcmVuZGVyQ2FudmFzID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgUElYSS5TcHJpdGUucHJvdG90eXBlLl9yZW5kZXJDYW52YXMuY2FsbCh0aGlzLCByZW5kZXJlcik7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiB0aGUgVGV4dCBhcyBhIHJlY3RhbmdsZS4gVGhlIGJvdW5kcyBjYWxjdWxhdGlvbiB0YWtlcyB0aGUgd29ybGRUcmFuc2Zvcm0gaW50byBhY2NvdW50LlxuICpcbiAqIEBwYXJhbSBtYXRyaXgge01hdHJpeH0gdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBvZiB0aGUgVGV4dFxuICogQHJldHVybiB7UmVjdGFuZ2xlfSB0aGUgZnJhbWluZyByZWN0YW5nbGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZ2V0Qm91bmRzID0gZnVuY3Rpb24gKG1hdHJpeClcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIHJldHVybiBQSVhJLlNwcml0ZS5wcm90b3R5cGUuZ2V0Qm91bmRzLmNhbGwodGhpcywgbWF0cml4KTtcbn07XG5cbi8qKlxuICogRGVzdHJveXMgdGhpcyB0ZXh0IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gW2Rlc3Ryb3lCYXNlVGV4dHVyZT10cnVlXSB7Ym9vbGVhbn0gd2hldGhlciB0byBkZXN0cm95IHRoZSBiYXNlIHRleHR1cmUgYXMgd2VsbFxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKGRlc3Ryb3lCYXNlVGV4dHVyZSlcbntcbiAgICAvLyBtYWtlIHN1cmUgdG8gcmVzZXQgdGhlIHRoZSBjb250ZXh0IGFuZCBjYW52YXMuLiBkb250IHdhbnQgdGhpcyBoYW5naW5nIGFyb3VuZCBpbiBtZW1vcnkhXG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICB0aGlzLmNhbnZhcyA9IG51bGw7XG5cbiAgICB0aGlzLl9zdHlsZSA9IG51bGw7XG5cbiAgICB0aGlzLl90ZXh0dXJlLmRlc3Ryb3koZGVzdHJveUJhc2VUZXh0dXJlID09PSB1bmRlZmluZWQgPyB0cnVlIDogZGVzdHJveUJhc2VUZXh0dXJlKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gVEVYVF9SRVNPTFVUSU9OIC0gRGVmYXVsdCByZXNvbHV0aW9uIG9mIGEgbmV3IENvY29vblRleHRcbiAgICAgKiBAY29uc3RhbnRcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgVEVYVF9SRVNPTFVUSU9OOjFcbn07XG4iXX0=
