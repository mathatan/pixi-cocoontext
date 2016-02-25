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
 * @param [style.fill='black'] {String|Number} A canvas fillstyle that will be used on the text e.g 'red', '#00FF00'
 * @param [style.align='left'] {string} Alignment for multiline text ('left', 'center' or 'right'), does not affect single line text
 * @param [style.stroke] {String|Number} A canvas fillstyle that will be used on the text stroke e.g 'blue', '#FCFF00'
 * @param [style.strokeThickness=0] {number} A number that represents the thickness of the stroke. Default is 0 (no stroke)
 * @param [style.wordWrap=false] {boolean} Indicates if word wrap should be used
 * @param [style.wordWrapWidth=100] {number} The width at which text will wrap, it needs wordWrap to be set to true
 * @param [style.lineHeight] {number} The line height, a number that represents the vertical space that a letter uses
 * @param [style.dropShadow=false] {boolean} Set a drop shadow for the text
 * @param [style.dropShadowColor='#000000'] {string} A fill style to be used on the dropshadow e.g 'red', '#00FF00'
 * @param [style.dropShadowAngle=Math.PI/4] {number} Set a angle of the drop shadow
 * @param [style.dropShadowDistance=5] {number} Set a distance of the drop shadow
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

    this._pixiId = text+JSON.stringify(style)+this.resolution;

    var baseTexture = PIXI.utils.BaseTextureCache[this._pixiId];
    if (!baseTexture)
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
     * @param [value.fill='black'] {object} A canvas fillstyle that will be used on the text eg 'red', '#00FF00'
     * @param [value.align='left'] {string} Alignment for multiline text ('left', 'center' or 'right'), does not affect single line text
     * @param [value.stroke='black'] {string} A canvas fillstyle that will be used on the text stroke eg 'blue', '#FCFF00'
     * @param [value.strokeThickness=0] {number} A number that represents the thickness of the stroke. Default is 0 (no stroke)
     * @param [value.wordWrap=false] {boolean} Indicates if word wrap should be used
     * @param [value.wordWrapWidth=100] {number} The width at which text will wrap
     * @param [value.lineHeight] {number} The line height, a number that represents the vertical space that a letter uses
     * @param [value.dropShadow=false] {boolean} Set a drop shadow for the text
     * @param [value.dropShadowColor='#000000'] {string} A fill style to be used on the dropshadow e.g 'red', '#00FF00'
     * @param [value.dropShadowAngle=Math.PI/6] {number} Set a angle of the drop shadow
     * @param [value.dropShadowDistance=5] {number} Set a distance of the drop shadow
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

            style.padding = value.padding || 0;

            style.textBaseline = value.textBaseline || 'alphabetic';

            style.lineJoin = value.lineJoin || 'miter';
            style.miterLimit = value.miterLimit || 10;

            if (typeof style.fill === 'object') {
                style.fill = this.gradientFill(style.fill);
            } 
            if (typeof style.stroke === 'object') {
                style.stroke = this.gradientFill(style.stroke);
            } 
            if (typeof style.dropShadowColor === 'object') {
                style.dropShadowColor = this.gradientFill(style.dropShadowColor);
            } 

            //multiply the font style by the resolution
            //TODO : warn if font size not in px unit
            this._generatedStyle = {
                font : style.font.replace(/[0-9]+/,Math.round(parseInt(style.font.match(/[0-9]+/)[0],10)*this.resolution)),
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
                padding : Math.round(style.padding*this.resolution),
                textBaseline : style.textBaseline,
                lineJoin : style.lineJoin,
                miterLimit : style.miterLimit
            };

            if (this._style !== null)
            {
                this.prepareUpdateText(this._text,value);
            }

            this._style = style;
            this.dirty = true;
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
        this.context.strokeStyle = style.stroke;
        this.context.lineWidth = style.strokeThickness;
        this.context.textBaseline = style.textBaseline;
        this.context.lineJoin = style.lineJoin;
        this.context.miterLimit = style.miterLimit;

        var linePositionX;
        var linePositionY;

        if (style.dropShadow)
        {
            this.context.fillStyle = style.dropShadowColor;

            var xShadowOffset = Math.cos(style.dropShadowAngle) * style.dropShadowDistance;
            var yShadowOffset = Math.sin(style.dropShadowAngle) * style.dropShadowDistance;

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

                if (style.fill)
                {
                    this.context.fillText(lines[i], linePositionX + xShadowOffset, linePositionY + yShadowOffset + style.padding);
                }
            }
        }

        //set canvas text styles
        this.context.fillStyle = style.fill;

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

CocoonText.prototype.gradientFill = function (options) 
{
    var width = this.canvas.width / this.resolution,
        height = this.canvas.height / this.resolution;
    if (options.vertical) {
        height = 0;
    } else {
        width = 0;
    }

    var gradient = this.context.createLinearGradient(0, 0, width, height);

    for (var i = 0, iLen = options.stops.length; i < iLen; i++) {
        gradient.addColorStop(options.stops[i].stop, options.stops[i].color);
    }

    return gradient;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyIsInNyYy9Db2Nvb25UZXh0VXRpbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2dEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBuYW1lc3BhY2UgUElYSS5jb2Nvb25UZXh0XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUElYSS5jb2Nvb250ZXh0ID0ge1xuICAgIENvY29vblRleHQ6ICAgIHJlcXVpcmUoJy4vQ29jb29uVGV4dCcpLFxuICAgIENPTlNUOiAgICByZXF1aXJlKCcuL0NvY29vblRleHRVdGlsJylcbn07XG4iLCJ2YXIgQ09OU1QgPSByZXF1aXJlKCcuLi9Db2Nvb25UZXh0VXRpbCcpO1xuXG4vKipcbiAqIEEgQ29jb29uVGV4dCBPYmplY3Qgd2lsbCBjcmVhdGUgYSBsaW5lIG9yIG11bHRpcGxlIGxpbmVzIG9mIHRleHQuIFRvIHNwbGl0IGEgbGluZSB5b3UgY2FuIHVzZSAnXFxuJyBpbiB5b3VyIHRleHQgc3RyaW5nLFxuICogb3IgYWRkIGEgd29yZFdyYXAgcHJvcGVydHkgc2V0IHRvIHRydWUgYW5kIGFuZCB3b3JkV3JhcFdpZHRoIHByb3BlcnR5IHdpdGggYSB2YWx1ZSBpbiB0aGUgc3R5bGUgb2JqZWN0LlxuICpcbiAqIE9uY2UgYSBDb2Nvb25UZXh0IGlzIGdlbmVyYXRlZCwgaXQgaXMgc3RvcmVkIGFzIGEgQmFzZVRleHR1cmUgYW5kIHdpbGwgYmUgdXNlZCBpZiBhIG5ldyBUZXh0IGlzXG4gKiBjcmVhdGVkIHdpdGggdGhlIGV4YWN0IHNhbWUgcGFyYW1ldGVycy5cbiAqXG4gKiBBIENvY29vblRleHQgY2FuIGJlIGNyZWF0ZWQgZGlyZWN0bHkgZnJvbSBhIHN0cmluZyBhbmQgYSBzdHlsZSBvYmplY3RcbiAqXG4gKiBgYGBqc1xuICogdmFyIHRleHQgPSBuZXcgUElYSS5leHRyYXMuQ29jb29uVGV4dCgnVGhpcyBpcyBhIENvY29vblRleHQnLHtmb250IDogJzI0cHggQXJpYWwnLCBmaWxsIDogMHhmZjEwMTAsIGFsaWduIDogJ2NlbnRlcid9KTtcbiAqIGBgYFxuICpcbiAqIEBjbGFzc1xuICogQGV4dGVuZHMgU3ByaXRlXG4gKiBAbWVtYmVyb2YgUElYSS5leHRyYXNcbiAqIEBwYXJhbSB0ZXh0IHtzdHJpbmd9IFRoZSBjb3B5IHRoYXQgeW91IHdvdWxkIGxpa2UgdGhlIHRleHQgdG8gZGlzcGxheVxuICogQHBhcmFtIFtzdHlsZV0ge29iamVjdH0gVGhlIHN0eWxlIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBbc3R5bGUuZm9udF0ge3N0cmluZ30gZGVmYXVsdCAnYm9sZCAyMHB4IEFyaWFsJyBUaGUgc3R5bGUgYW5kIHNpemUgb2YgdGhlIGZvbnRcbiAqIEBwYXJhbSBbc3R5bGUuZmlsbD0nYmxhY2snXSB7U3RyaW5nfE51bWJlcn0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IGUuZyAncmVkJywgJyMwMEZGMDAnXG4gKiBAcGFyYW0gW3N0eWxlLmFsaWduPSdsZWZ0J10ge3N0cmluZ30gQWxpZ25tZW50IGZvciBtdWx0aWxpbmUgdGV4dCAoJ2xlZnQnLCAnY2VudGVyJyBvciAncmlnaHQnKSwgZG9lcyBub3QgYWZmZWN0IHNpbmdsZSBsaW5lIHRleHRcbiAqIEBwYXJhbSBbc3R5bGUuc3Ryb2tlXSB7U3RyaW5nfE51bWJlcn0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IHN0cm9rZSBlLmcgJ2JsdWUnLCAnI0ZDRkYwMCdcbiAqIEBwYXJhbSBbc3R5bGUuc3Ryb2tlVGhpY2tuZXNzPTBdIHtudW1iZXJ9IEEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdGhpY2tuZXNzIG9mIHRoZSBzdHJva2UuIERlZmF1bHQgaXMgMCAobm8gc3Ryb2tlKVxuICogQHBhcmFtIFtzdHlsZS53b3JkV3JhcD1mYWxzZV0ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB3b3JkIHdyYXAgc2hvdWxkIGJlIHVzZWRcbiAqIEBwYXJhbSBbc3R5bGUud29yZFdyYXBXaWR0aD0xMDBdIHtudW1iZXJ9IFRoZSB3aWR0aCBhdCB3aGljaCB0ZXh0IHdpbGwgd3JhcCwgaXQgbmVlZHMgd29yZFdyYXAgdG8gYmUgc2V0IHRvIHRydWVcbiAqIEBwYXJhbSBbc3R5bGUubGluZUhlaWdodF0ge251bWJlcn0gVGhlIGxpbmUgaGVpZ2h0LCBhIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHZlcnRpY2FsIHNwYWNlIHRoYXQgYSBsZXR0ZXIgdXNlc1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93PWZhbHNlXSB7Ym9vbGVhbn0gU2V0IGEgZHJvcCBzaGFkb3cgZm9yIHRoZSB0ZXh0XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dDb2xvcj0nIzAwMDAwMCddIHtzdHJpbmd9IEEgZmlsbCBzdHlsZSB0byBiZSB1c2VkIG9uIHRoZSBkcm9wc2hhZG93IGUuZyAncmVkJywgJyMwMEZGMDAnXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dBbmdsZT1NYXRoLlBJLzRdIHtudW1iZXJ9IFNldCBhIGFuZ2xlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U9NV0ge251bWJlcn0gU2V0IGEgZGlzdGFuY2Ugb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLnBhZGRpbmc9MF0ge251bWJlcn0gT2NjYXNpb25hbGx5IHNvbWUgZm9udHMgYXJlIGNyb3BwZWQuIEFkZGluZyBzb21lIHBhZGRpbmcgd2lsbCBwcmV2ZW50IHRoaXMgZnJvbSBoYXBwZW5pbmdcbiAqIEBwYXJhbSBbc3R5bGUudGV4dEJhc2VsaW5lPSdhbHBoYWJldGljJ10ge3N0cmluZ30gVGhlIGJhc2VsaW5lIG9mIHRoZSB0ZXh0IHRoYXQgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gW3N0eWxlLmxpbmVKb2luPSdtaXRlciddIHtzdHJpbmd9IFRoZSBsaW5lSm9pbiBwcm9wZXJ0eSBzZXRzIHRoZSB0eXBlIG9mIGNvcm5lciBjcmVhdGVkLCBpdCBjYW4gcmVzb2x2ZVxuICogICAgICBzcGlrZWQgdGV4dCBpc3N1ZXMuIERlZmF1bHQgaXMgJ21pdGVyJyAoY3JlYXRlcyBhIHNoYXJwIGNvcm5lcikuXG4gKiBAcGFyYW0gW3N0eWxlLm1pdGVyTGltaXQ9MTBdIHtudW1iZXJ9IFRoZSBtaXRlciBsaW1pdCB0byB1c2Ugd2hlbiB1c2luZyB0aGUgJ21pdGVyJyBsaW5lSm9pbiBtb2RlLiBUaGlzIGNhbiByZWR1Y2VcbiAqICAgICAgb3IgaW5jcmVhc2UgdGhlIHNwaWtpbmVzcyBvZiByZW5kZXJlZCB0ZXh0LlxuICovXG5mdW5jdGlvbiBDb2Nvb25UZXh0KHRleHQsIHN0eWxlLCByZXNvbHV0aW9uKVxue1xuICAgIC8qKlxuICAgICAqIFRoZSBjYW52YXMgZWxlbWVudCB0aGF0IGV2ZXJ5dGhpbmcgaXMgZHJhd24gdG9cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY2FudmFzID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYW52YXMgMmQgY29udGV4dCB0aGF0IGV2ZXJ5dGhpbmcgaXMgZHJhd24gd2l0aFxuICAgICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcmVzb2x1dGlvbiBvZiB0aGUgY2FudmFzLlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnJlc29sdXRpb24gPSByZXNvbHV0aW9uIHx8IENPTlNULlRFWFRfUkVTT0xVVElPTiB8fCBQSVhJLlJFU09MVVRJT047XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBjdXJyZW50IHRleHQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgdHJhY2tlciBmb3IgdGhlIGN1cnJlbnQgc3R5bGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtvYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9zdHlsZSA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBnZW5lcmF0ZWQgc3R5bGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtvYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9nZW5lcmF0ZWRTdHlsZSA9IG51bGw7XG5cbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0K0pTT04uc3RyaW5naWZ5KHN0eWxlKSt0aGlzLnJlc29sdXRpb247XG5cbiAgICB2YXIgYmFzZVRleHR1cmUgPSBQSVhJLnV0aWxzLkJhc2VUZXh0dXJlQ2FjaGVbdGhpcy5fcGl4aUlkXTtcbiAgICBpZiAoIWJhc2VUZXh0dXJlKVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5jYW52YXMuX3BpeGlJZCA9IHRoaXMuX3BpeGlJZDtcbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBiYXNlVGV4dHVyZS5zb3VyY2U7XG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB2YXIgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICB0ZXh0dXJlLnRyaW0gPSBuZXcgUElYSS5SZWN0YW5nbGUoKTtcbiAgICBQSVhJLlNwcml0ZS5jYWxsKHRoaXMsIHRleHR1cmUpO1xuXG4gICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgICB0aGlzLnN0eWxlID0gc3R5bGU7XG5cbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IGZhbHNlO1xufVxuXG4vLyBjb25zdHJ1Y3RvclxuQ29jb29uVGV4dC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBJWEkuU3ByaXRlLnByb3RvdHlwZSk7XG5Db2Nvb25UZXh0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvY29vblRleHQ7XG5tb2R1bGUuZXhwb3J0cyA9IENvY29vblRleHQ7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKENvY29vblRleHQucHJvdG90eXBlLCB7XG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIG9mIHRoZSBDb2Nvb25UZXh0LCBzZXR0aW5nIHRoaXMgd2lsbCBhY3R1YWxseSBtb2RpZnkgdGhlIHNjYWxlIHRvIGFjaGlldmUgdGhlIHZhbHVlIHNldFxuICAgICAqXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHdpZHRoOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjYWxlLnggKiB0aGlzLl90ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUueCA9IHZhbHVlIC8gdGhpcy5fdGV4dHVyZS5fZnJhbWUud2lkdGg7XG4gICAgICAgICAgICB0aGlzLl93aWR0aCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgb2YgdGhlIENvY29vblRleHQsIHNldHRpbmcgdGhpcyB3aWxsIGFjdHVhbGx5IG1vZGlmeSB0aGUgc2NhbGUgdG8gYWNoaWV2ZSB0aGUgdmFsdWUgc2V0XG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgaGVpZ2h0OiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAgdGhpcy5zY2FsZS55ICogdGhpcy5fdGV4dHVyZS5fZnJhbWUuaGVpZ2h0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS55ID0gdmFsdWUgLyB0aGlzLl90ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9oZWlnaHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHN0eWxlIG9mIHRoZSB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0gW3ZhbHVlXSB7b2JqZWN0fSBUaGUgc3R5bGUgcGFyYW1ldGVyc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZm9udD0nYm9sZCAyMHB0IEFyaWFsJ10ge3N0cmluZ30gVGhlIHN0eWxlIGFuZCBzaXplIG9mIHRoZSBmb250XG4gICAgICogQHBhcmFtIFt2YWx1ZS5maWxsPSdibGFjayddIHtvYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBlZyAncmVkJywgJyMwMEZGMDAnXG4gICAgICogQHBhcmFtIFt2YWx1ZS5hbGlnbj0nbGVmdCddIHtzdHJpbmd9IEFsaWdubWVudCBmb3IgbXVsdGlsaW5lIHRleHQgKCdsZWZ0JywgJ2NlbnRlcicgb3IgJ3JpZ2h0JyksIGRvZXMgbm90IGFmZmVjdCBzaW5nbGUgbGluZSB0ZXh0XG4gICAgICogQHBhcmFtIFt2YWx1ZS5zdHJva2U9J2JsYWNrJ10ge3N0cmluZ30gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IHN0cm9rZSBlZyAnYmx1ZScsICcjRkNGRjAwJ1xuICAgICAqIEBwYXJhbSBbdmFsdWUuc3Ryb2tlVGhpY2tuZXNzPTBdIHtudW1iZXJ9IEEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdGhpY2tuZXNzIG9mIHRoZSBzdHJva2UuIERlZmF1bHQgaXMgMCAobm8gc3Ryb2tlKVxuICAgICAqIEBwYXJhbSBbdmFsdWUud29yZFdyYXA9ZmFsc2VdIHtib29sZWFufSBJbmRpY2F0ZXMgaWYgd29yZCB3cmFwIHNob3VsZCBiZSB1c2VkXG4gICAgICogQHBhcmFtIFt2YWx1ZS53b3JkV3JhcFdpZHRoPTEwMF0ge251bWJlcn0gVGhlIHdpZHRoIGF0IHdoaWNoIHRleHQgd2lsbCB3cmFwXG4gICAgICogQHBhcmFtIFt2YWx1ZS5saW5lSGVpZ2h0XSB7bnVtYmVyfSBUaGUgbGluZSBoZWlnaHQsIGEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdmVydGljYWwgc3BhY2UgdGhhdCBhIGxldHRlciB1c2VzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93PWZhbHNlXSB7Ym9vbGVhbn0gU2V0IGEgZHJvcCBzaGFkb3cgZm9yIHRoZSB0ZXh0XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93Q29sb3I9JyMwMDAwMDAnXSB7c3RyaW5nfSBBIGZpbGwgc3R5bGUgdG8gYmUgdXNlZCBvbiB0aGUgZHJvcHNoYWRvdyBlLmcgJ3JlZCcsICcjMDBGRjAwJ1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0FuZ2xlPU1hdGguUEkvNl0ge251bWJlcn0gU2V0IGEgYW5nbGUgb2YgdGhlIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93RGlzdGFuY2U9NV0ge251bWJlcn0gU2V0IGEgZGlzdGFuY2Ugb2YgdGhlIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5wYWRkaW5nPTBdIHtudW1iZXJ9IE9jY2FzaW9uYWxseSBzb21lIGZvbnRzIGFyZSBjcm9wcGVkLiBBZGRpbmcgc29tZSBwYWRkaW5nIHdpbGwgcHJldmVudCB0aGlzIGZyb20gaGFwcGVuaW5nXG4gICAgICogQHBhcmFtIFt2YWx1ZS50ZXh0QmFzZWxpbmU9J2FscGhhYmV0aWMnXSB7c3RyaW5nfSBUaGUgYmFzZWxpbmUgb2YgdGhlIHRleHQgdGhhdCBpcyByZW5kZXJlZC5cbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmxpbmVKb2luPSdtaXRlciddIHtzdHJpbmd9IFRoZSBsaW5lSm9pbiBwcm9wZXJ0eSBzZXRzIHRoZSB0eXBlIG9mIGNvcm5lciBjcmVhdGVkLCBpdCBjYW4gcmVzb2x2ZVxuICAgICAqICAgICAgc3Bpa2VkIHRleHQgaXNzdWVzLiBEZWZhdWx0IGlzICdtaXRlcicgKGNyZWF0ZXMgYSBzaGFycCBjb3JuZXIpLlxuICAgICAqIEBwYXJhbSBbdmFsdWUubWl0ZXJMaW1pdD0xMF0ge251bWJlcn0gVGhlIG1pdGVyIGxpbWl0IHRvIHVzZSB3aGVuIHVzaW5nIHRoZSAnbWl0ZXInIGxpbmVKb2luIG1vZGUuIFRoaXMgY2FuIHJlZHVjZVxuICAgICAqICAgICAgb3IgaW5jcmVhc2UgdGhlIHNwaWtpbmVzcyBvZiByZW5kZXJlZCB0ZXh0LlxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHN0eWxlOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0eWxlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHN0eWxlID0ge307XG4gICAgICAgICAgICBzdHlsZS5mb250ID0gdmFsdWUuZm9udCB8fCAnYm9sZCAyMHB4IEFyaWFsJztcbiAgICAgICAgICAgIHN0eWxlLmZpbGwgPSB2YWx1ZS5maWxsIHx8ICdibGFjayc7XG4gICAgICAgICAgICBzdHlsZS5hbGlnbiA9IHZhbHVlLmFsaWduIHx8ICdsZWZ0JztcbiAgICAgICAgICAgIHN0eWxlLnN0cm9rZSA9IHZhbHVlLnN0cm9rZSB8fCAnYmxhY2snOyAvL3Byb3ZpZGUgYSBkZWZhdWx0LCBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9Hb29kQm95RGlnaXRhbC9waXhpLmpzL2lzc3Vlcy8xMzZcbiAgICAgICAgICAgIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyA9IHZhbHVlLnN0cm9rZVRoaWNrbmVzcyB8fCAwO1xuICAgICAgICAgICAgc3R5bGUud29yZFdyYXAgPSB2YWx1ZS53b3JkV3JhcCB8fCBmYWxzZTtcbiAgICAgICAgICAgIHN0eWxlLndvcmRXcmFwV2lkdGggPSB2YWx1ZS53b3JkV3JhcFdpZHRoIHx8IDEwMDtcblxuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvdyA9IHZhbHVlLmRyb3BTaGFkb3cgfHwgZmFsc2U7XG4gICAgICAgICAgICBzdHlsZS5kcm9wU2hhZG93Q29sb3IgPSB2YWx1ZS5kcm9wU2hhZG93Q29sb3IgfHwgJyMwMDAwMDAnO1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0FuZ2xlID0gdmFsdWUuZHJvcFNoYWRvd0FuZ2xlIHx8IE1hdGguUEkgLyA2O1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlID0gdmFsdWUuZHJvcFNoYWRvd0Rpc3RhbmNlIHx8IDU7XG5cbiAgICAgICAgICAgIHN0eWxlLnBhZGRpbmcgPSB2YWx1ZS5wYWRkaW5nIHx8IDA7XG5cbiAgICAgICAgICAgIHN0eWxlLnRleHRCYXNlbGluZSA9IHZhbHVlLnRleHRCYXNlbGluZSB8fCAnYWxwaGFiZXRpYyc7XG5cbiAgICAgICAgICAgIHN0eWxlLmxpbmVKb2luID0gdmFsdWUubGluZUpvaW4gfHwgJ21pdGVyJztcbiAgICAgICAgICAgIHN0eWxlLm1pdGVyTGltaXQgPSB2YWx1ZS5taXRlckxpbWl0IHx8IDEwO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmZpbGwgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc3R5bGUuZmlsbCA9IHRoaXMuZ3JhZGllbnRGaWxsKHN0eWxlLmZpbGwpO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuc3Ryb2tlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHN0eWxlLnN0cm9rZSA9IHRoaXMuZ3JhZGllbnRGaWxsKHN0eWxlLnN0cm9rZSk7XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5kcm9wU2hhZG93Q29sb3IgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0NvbG9yID0gdGhpcy5ncmFkaWVudEZpbGwoc3R5bGUuZHJvcFNoYWRvd0NvbG9yKTtcbiAgICAgICAgICAgIH0gXG5cbiAgICAgICAgICAgIC8vbXVsdGlwbHkgdGhlIGZvbnQgc3R5bGUgYnkgdGhlIHJlc29sdXRpb25cbiAgICAgICAgICAgIC8vVE9ETyA6IHdhcm4gaWYgZm9udCBzaXplIG5vdCBpbiBweCB1bml0XG4gICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZWRTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICBmb250IDogc3R5bGUuZm9udC5yZXBsYWNlKC9bMC05XSsvLE1hdGgucm91bmQocGFyc2VJbnQoc3R5bGUuZm9udC5tYXRjaCgvWzAtOV0rLylbMF0sMTApKnRoaXMucmVzb2x1dGlvbikpLFxuICAgICAgICAgICAgICAgIGZpbGwgOiBzdHlsZS5maWxsLFxuICAgICAgICAgICAgICAgIGFsaWduIDogc3R5bGUuYWxpZ24sXG4gICAgICAgICAgICAgICAgc3Ryb2tlIDogc3R5bGUuc3Ryb2tlLFxuICAgICAgICAgICAgICAgIHN0cm9rZVRoaWNrbmVzcyA6IE1hdGgucm91bmQoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgd29yZFdyYXAgOiBzdHlsZS53b3JkV3JhcCxcbiAgICAgICAgICAgICAgICB3b3JkV3JhcFdpZHRoIDogTWF0aC5yb3VuZChzdHlsZS53b3JkV3JhcFdpZHRoKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvdyA6IHN0eWxlLmRyb3BTaGFkb3csXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd0NvbG9yIDogc3R5bGUuZHJvcFNoYWRvd0NvbG9yLFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3dBbmdsZSA6IHN0eWxlLmRyb3BTaGFkb3dBbmdsZSxcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93RGlzdGFuY2UgOiBNYXRoLnJvdW5kKHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIHBhZGRpbmcgOiBNYXRoLnJvdW5kKHN0eWxlLnBhZGRpbmcqdGhpcy5yZXNvbHV0aW9uKSxcbiAgICAgICAgICAgICAgICB0ZXh0QmFzZWxpbmUgOiBzdHlsZS50ZXh0QmFzZWxpbmUsXG4gICAgICAgICAgICAgICAgbGluZUpvaW4gOiBzdHlsZS5saW5lSm9pbixcbiAgICAgICAgICAgICAgICBtaXRlckxpbWl0IDogc3R5bGUubWl0ZXJMaW1pdFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3N0eWxlICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZVVwZGF0ZVRleHQodGhpcy5fdGV4dCx2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3N0eWxlID0gc3R5bGU7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGNvcHkgZm9yIHRoZSB0ZXh0IG9iamVjdC4gVG8gc3BsaXQgYSBsaW5lIHlvdSBjYW4gdXNlICdcXG4nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQge3N0cmluZ30gVGhlIGNvcHkgdGhhdCB5b3Ugd291bGQgbGlrZSB0aGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgdGV4dDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpe1xuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9TdHJpbmcoKSB8fCAnICc7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCA9PT0gdGV4dClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRleHQsdGhpcy5fc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdGV4dCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFByZXBhcmUgdGhlIGNhbnZhcyBmb3IgYW4gdXBkYXRlIGFuZCB0cnkgdG8gZ2V0IGEgY2FjaGVkIHRleHQgZmlyc3QuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUucHJlcGFyZVVwZGF0ZVRleHQgPSBmdW5jdGlvbiAodGV4dCxzdHlsZSlcbntcbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0K0pTT04uc3RyaW5naWZ5KHN0eWxlKSt0aGlzLnJlc29sdXRpb247XG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnN3aXRjaENhbnZhcyA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIGJhc2VUZXh0dXJlID0gUElYSS51dGlscy5CYXNlVGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF07XG4gICAgaWYgKGJhc2VUZXh0dXJlKVxuICAgIHtcbiAgICAgICAgLy90aGVyZSBpcyBhIGNhY2hlZCB0ZXh0IGZvciB0aGVzZSBwYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuY2FudmFzID0gYmFzZVRleHR1cmUuc291cmNlO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHZhciB0ZXh0dXJlID0gUElYSS5UZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXMpO1xuICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgIHRoaXMudGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5fdGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0ZXh0IGFuZCB1cGRhdGVzIGl0IHdoZW4gbmVlZGVkXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUudXBkYXRlVGV4dCA9IGZ1bmN0aW9uICgpXG57XG4gICAgaWYgKHRoaXMuc3dpdGNoTmVlZGVkKVxuICAgIHtcbiAgICAgICAgdGhpcy5zd2l0Y2hDYW52YXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMuX2dlbmVyYXRlZFN0eWxlO1xuICAgICAgICB0aGlzLmNvbnRleHQuZm9udCA9IHN0eWxlLmZvbnQ7XG5cbiAgICAgICAgLy8gd29yZCB3cmFwXG4gICAgICAgIC8vIHByZXNlcnZlIG9yaWdpbmFsIHRleHRcbiAgICAgICAgdmFyIG91dHB1dFRleHQgPSBzdHlsZS53b3JkV3JhcCA/IHRoaXMud29yZFdyYXAodGhpcy5fdGV4dCkgOiB0aGlzLl90ZXh0O1xuXG4gICAgICAgIC8vIHNwbGl0IHRleHQgaW50byBsaW5lc1xuICAgICAgICB2YXIgbGluZXMgPSBvdXRwdXRUZXh0LnNwbGl0KC8oPzpcXHJcXG58XFxyfFxcbikvKTtcblxuICAgICAgICAvLyBjYWxjdWxhdGUgdGV4dCB3aWR0aFxuICAgICAgICB2YXIgbGluZVdpZHRocyA9IG5ldyBBcnJheShsaW5lcy5sZW5ndGgpO1xuICAgICAgICB2YXIgbWF4TGluZVdpZHRoID0gMDtcbiAgICAgICAgdmFyIGZvbnRQcm9wZXJ0aWVzID0gdGhpcy5kZXRlcm1pbmVGb250UHJvcGVydGllcyhzdHlsZS5mb250KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGxpbmVXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChsaW5lc1tpXSkud2lkdGg7XG4gICAgICAgICAgICBsaW5lV2lkdGhzW2ldID0gbGluZVdpZHRoO1xuICAgICAgICAgICAgbWF4TGluZVdpZHRoID0gTWF0aC5tYXgobWF4TGluZVdpZHRoLCBsaW5lV2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZHRoID0gbWF4TGluZVdpZHRoICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzO1xuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgd2lkdGggKz0gc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAoIHdpZHRoICsgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCApO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0ZXh0IGhlaWdodFxuICAgICAgICB2YXIgbGluZUhlaWdodCA9IHRoaXMuc3R5bGUubGluZUhlaWdodCB8fCBmb250UHJvcGVydGllcy5mb250U2l6ZSArIHN0eWxlLnN0cm9rZVRoaWNrbmVzcztcblxuICAgICAgICB2YXIgaGVpZ2h0ID0gbGluZUhlaWdodCAqIGxpbmVzLmxlbmd0aDtcbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAoIGhlaWdodCArIHN0eWxlLnBhZGRpbmcgKiAyICk7XG5cbiAgICAgICAgaWYgKG5hdmlnYXRvci5pc0NvY29vbkpTKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmZvbnQgPSBzdHlsZS5mb250O1xuICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBzdHlsZS5zdHJva2U7XG4gICAgICAgIHRoaXMuY29udGV4dC5saW5lV2lkdGggPSBzdHlsZS5zdHJva2VUaGlja25lc3M7XG4gICAgICAgIHRoaXMuY29udGV4dC50ZXh0QmFzZWxpbmUgPSBzdHlsZS50ZXh0QmFzZWxpbmU7XG4gICAgICAgIHRoaXMuY29udGV4dC5saW5lSm9pbiA9IHN0eWxlLmxpbmVKb2luO1xuICAgICAgICB0aGlzLmNvbnRleHQubWl0ZXJMaW1pdCA9IHN0eWxlLm1pdGVyTGltaXQ7XG5cbiAgICAgICAgdmFyIGxpbmVQb3NpdGlvblg7XG4gICAgICAgIHZhciBsaW5lUG9zaXRpb25ZO1xuXG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gc3R5bGUuZHJvcFNoYWRvd0NvbG9yO1xuXG4gICAgICAgICAgICB2YXIgeFNoYWRvd09mZnNldCA9IE1hdGguY29zKHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgICAgICB2YXIgeVNoYWRvd09mZnNldCA9IE1hdGguc2luKHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMjtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25ZID0gKHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAvIDIgKyBpICogbGluZUhlaWdodCkgKyBmb250UHJvcGVydGllcy5hc2NlbnQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuYWxpZ24gPT09ICdyaWdodCcpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YICs9IG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlLmFsaWduID09PSAnY2VudGVyJylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gKG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV0pIC8gMjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuZmlsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChsaW5lc1tpXSwgbGluZVBvc2l0aW9uWCArIHhTaGFkb3dPZmZzZXQsIGxpbmVQb3NpdGlvblkgKyB5U2hhZG93T2Zmc2V0ICsgc3R5bGUucGFkZGluZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9zZXQgY2FudmFzIHRleHQgc3R5bGVzXG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBzdHlsZS5maWxsO1xuXG4gICAgICAgIC8vZHJhdyBsaW5lcyBsaW5lIGJ5IGxpbmVcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBsaW5lUG9zaXRpb25YID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMjtcbiAgICAgICAgICAgIGxpbmVQb3NpdGlvblkgPSAoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMiArIGkgKiBsaW5lSGVpZ2h0KSArIGZvbnRQcm9wZXJ0aWVzLmFzY2VudDtcblxuICAgICAgICAgICAgaWYgKHN0eWxlLmFsaWduID09PSAncmlnaHQnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gbWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlLmFsaWduID09PSAnY2VudGVyJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YICs9IChtYXhMaW5lV2lkdGggLSBsaW5lV2lkdGhzW2ldKSAvIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5zdHJva2UgJiYgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YLCBsaW5lUG9zaXRpb25ZICsgc3R5bGUucGFkZGluZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5maWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChsaW5lc1tpXSwgbGluZVBvc2l0aW9uWCwgbGluZVBvc2l0aW9uWSArIHN0eWxlLnBhZGRpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVUZXh0dXJlKCk7XG59O1xuXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5ncmFkaWVudEZpbGwgPSBmdW5jdGlvbiAob3B0aW9ucykgXG57XG4gICAgdmFyIHdpZHRoID0gdGhpcy5jYW52YXMud2lkdGggLyB0aGlzLnJlc29sdXRpb24sXG4gICAgICAgIGhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICBpZiAob3B0aW9ucy52ZXJ0aWNhbCkge1xuICAgICAgICBoZWlnaHQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZHRoID0gMDtcbiAgICB9XG5cbiAgICB2YXIgZ3JhZGllbnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgaUxlbiA9IG9wdGlvbnMuc3RvcHMubGVuZ3RoOyBpIDwgaUxlbjsgaSsrKSB7XG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChvcHRpb25zLnN0b3BzW2ldLnN0b3AsIG9wdGlvbnMuc3RvcHNbaV0uY29sb3IpO1xuICAgIH1cblxuICAgIHJldHVybiBncmFkaWVudDtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0ZXh0dXJlIHNpemUgYmFzZWQgb24gY2FudmFzIHNpemVcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS51cGRhdGVUZXh0dXJlID0gZnVuY3Rpb24gKClcbntcbiAgICB2YXIgdGV4dHVyZSA9IHRoaXMuX3RleHR1cmU7XG5cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5oYXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLnJlc29sdXRpb24gPSB0aGlzLnJlc29sdXRpb247XG5cbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB9XG5cbiAgICB0ZXh0dXJlLmNyb3Aud2lkdGggPSB0ZXh0dXJlLl9mcmFtZS53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRleHR1cmUuY3JvcC5oZWlnaHQgPSB0ZXh0dXJlLl9mcmFtZS5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0ZXh0dXJlLnRyaW0ueCA9IDA7XG4gICAgdGV4dHVyZS50cmltLnkgPSAtdGhpcy5fc3R5bGUucGFkZGluZztcblxuICAgIHRleHR1cmUudHJpbS53aWR0aCA9IHRleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgIHRleHR1cmUudHJpbS5oZWlnaHQgPSB0ZXh0dXJlLl9mcmFtZS5oZWlnaHQgLSB0aGlzLl9zdHlsZS5wYWRkaW5nKjI7XG5cbiAgICB0aGlzLl93aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcblxuICAgIHRoaXMuc2NhbGUueCA9IDE7XG4gICAgdGhpcy5zY2FsZS55ID0gMTtcblxuICAgIGlmICh0aGlzLmNhY2hlRGlydHkpXG4gICAge1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmVtaXQoJ3VwZGF0ZScsICB0ZXh0dXJlLmJhc2VUZXh0dXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGFzY2VudCwgZGVzY2VudCBhbmQgZm9udFNpemUgb2YgYSBnaXZlbiBmb250U3R5bGVcbiAqXG4gKiBAcGFyYW0gZm9udFN0eWxlIHtvYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5kZXRlcm1pbmVGb250UHJvcGVydGllcyA9IGZ1bmN0aW9uIChmb250U3R5bGUpXG57XG4gICAgdmFyIHByb3BlcnRpZXMgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYWNoZVtmb250U3R5bGVdO1xuXG4gICAgaWYgKCFwcm9wZXJ0aWVzKVxuICAgIHtcbiAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuXG4gICAgICAgIHZhciBjYW52YXMgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYW52YXM7XG4gICAgICAgIHZhciBjb250ZXh0ID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ29udGV4dDtcblxuICAgICAgICBjb250ZXh0LmZvbnQgPSBmb250U3R5bGU7XG5cbiAgICAgICAgdmFyIHdpZHRoID0gTWF0aC5jZWlsKGNvbnRleHQubWVhc3VyZVRleHQoJ3xNw4lxJykud2lkdGgpO1xuICAgICAgICB2YXIgYmFzZWxpbmUgPSBNYXRoLmNlaWwoY29udGV4dC5tZWFzdXJlVGV4dCgnTScpLndpZHRoKTtcbiAgICAgICAgdmFyIGhlaWdodCA9IDIgKiBiYXNlbGluZTtcblxuICAgICAgICAvLyBiYXNlbGluZSBmYWN0b3IgZGVwZW5kcyBhIGxvdCBvZiB0aGUgZm9udC4gdG9kbyA6IGxldCB1c2VyIHNwZWNpZnkgYSBmYWN0b3IgcGVyIGZvbnQgbmFtZSA/XG4gICAgICAgIGJhc2VsaW5lID0gYmFzZWxpbmUgKiAxLjIgfCAwO1xuXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmMDAnO1xuICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICAgIGNvbnRleHQuZm9udCA9IGZvbnRTdHlsZTtcblxuICAgICAgICBjb250ZXh0LnRleHRCYXNlbGluZSA9ICdhbHBoYWJldGljJztcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnIzAwMCc7XG4gICAgICAgIGNvbnRleHQuZmlsbFRleHQoJ3xNw4lxJywgMCwgYmFzZWxpbmUpO1xuXG4gICAgICAgIHZhciBpbWFnZWRhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KS5kYXRhO1xuICAgICAgICB2YXIgcGl4ZWxzID0gaW1hZ2VkYXRhLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpbmUgPSB3aWR0aCAqIDQ7XG5cbiAgICAgICAgdmFyIGksIGo7XG5cbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBzdG9wID0gZmFsc2U7XG5cbiAgICAgICAgLy8gYXNjZW50LiBzY2FuIGZyb20gdG9wIHRvIGJvdHRvbSB1bnRpbCB3ZSBmaW5kIGEgbm9uIHJlZCBwaXhlbFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYmFzZWxpbmU7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxpbmU7IGogKz0gNClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VkYXRhW2lkeCArIGpdICE9PSAyNTUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdG9wKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkeCArPSBsaW5lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvcGVydGllcy5hc2NlbnQgPSBiYXNlbGluZSAtIGk7XG5cbiAgICAgICAgaWR4ID0gcGl4ZWxzIC0gbGluZTtcbiAgICAgICAgc3RvcCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlc2NlbnQuIHNjYW4gZnJvbSBib3R0b20gdG8gdG9wIHVudGlsIHdlIGZpbmQgYSBub24gcmVkIHBpeGVsXG4gICAgICAgIGZvciAoaSA9IGhlaWdodDsgaSA+IGJhc2VsaW5lOyBpLS0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsaW5lOyBqICs9IDQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGltYWdlZGF0YVtpZHggKyBqXSAhPT0gMjU1KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RvcClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZHggLT0gbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BlcnRpZXMuZGVzY2VudCA9IGkgLSBiYXNlbGluZTtcbiAgICAgICAgcHJvcGVydGllcy5mb250U2l6ZSA9IHByb3BlcnRpZXMuYXNjZW50ICsgcHJvcGVydGllcy5kZXNjZW50O1xuXG4gICAgICAgIFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NhY2hlW2ZvbnRTdHlsZV0gPSBwcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIG5ld2xpbmVzIHRvIGEgc3RyaW5nIHRvIGhhdmUgaXQgb3B0aW1hbGx5IGZpdCBpbnRvIHRoZSBob3Jpem9udGFsXG4gKiBib3VuZHMgc2V0IGJ5IHRoZSBUZXh0IG9iamVjdCdzIHdvcmRXcmFwV2lkdGggcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHRleHQge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLndvcmRXcmFwID0gZnVuY3Rpb24gKHRleHQpXG57XG4gICAgLy8gR3JlZWR5IHdyYXBwaW5nIGFsZ29yaXRobSB0aGF0IHdpbGwgd3JhcCB3b3JkcyBhcyB0aGUgbGluZSBncm93cyBsb25nZXJcbiAgICAvLyB0aGFuIGl0cyBob3Jpem9udGFsIGJvdW5kcy5cbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgdmFyIGxpbmVzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gICAgdmFyIHdvcmRXcmFwV2lkdGggPSB0aGlzLl9nZW5lcmF0ZWRTdHlsZS53b3JkV3JhcFdpZHRoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgICB2YXIgc3BhY2VMZWZ0ID0gd29yZFdyYXBXaWR0aDtcbiAgICAgICAgdmFyIHdvcmRzID0gbGluZXNbaV0uc3BsaXQoJyAnKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB3b3Jkcy5sZW5ndGg7IGorKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHdvcmRXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dCh3b3Jkc1tqXSkud2lkdGg7XG4gICAgICAgICAgICB2YXIgd29yZFdpZHRoV2l0aFNwYWNlID0gd29yZFdpZHRoICsgdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KCcgJykud2lkdGg7XG4gICAgICAgICAgICBpZiAoaiA9PT0gMCB8fCB3b3JkV2lkdGhXaXRoU3BhY2UgPiBzcGFjZUxlZnQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBwcmludGluZyB0aGUgbmV3bGluZSBpZiBpdCdzIHRoZSBmaXJzdCB3b3JkIG9mIHRoZSBsaW5lIHRoYXQgaXNcbiAgICAgICAgICAgICAgICAvLyBncmVhdGVyIHRoYW4gdGhlIHdvcmQgd3JhcCB3aWR0aC5cbiAgICAgICAgICAgICAgICBpZiAoaiA+IDApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB3b3Jkc1tqXTtcbiAgICAgICAgICAgICAgICBzcGFjZUxlZnQgPSB3b3JkV3JhcFdpZHRoIC0gd29yZFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNwYWNlTGVmdCAtPSB3b3JkV2lkdGhXaXRoU3BhY2U7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcgJyArIHdvcmRzW2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPCBsaW5lcy5sZW5ndGgtMSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIG9iamVjdCB1c2luZyB0aGUgV2ViR0wgcmVuZGVyZXJcbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIge1dlYkdMUmVuZGVyZXJ9XG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnJlbmRlcldlYkdMID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgUElYSS5TcHJpdGUucHJvdG90eXBlLnJlbmRlcldlYkdMLmNhbGwodGhpcywgcmVuZGVyZXIpO1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBvYmplY3QgdXNpbmcgdGhlIENhbnZhcyByZW5kZXJlclxuICpcbiAqIEBwYXJhbSByZW5kZXJlciB7Q2FudmFzUmVuZGVyZXJ9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5fcmVuZGVyQ2FudmFzID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgUElYSS5TcHJpdGUucHJvdG90eXBlLl9yZW5kZXJDYW52YXMuY2FsbCh0aGlzLCByZW5kZXJlcik7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiB0aGUgVGV4dCBhcyBhIHJlY3RhbmdsZS4gVGhlIGJvdW5kcyBjYWxjdWxhdGlvbiB0YWtlcyB0aGUgd29ybGRUcmFuc2Zvcm0gaW50byBhY2NvdW50LlxuICpcbiAqIEBwYXJhbSBtYXRyaXgge01hdHJpeH0gdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBvZiB0aGUgVGV4dFxuICogQHJldHVybiB7UmVjdGFuZ2xlfSB0aGUgZnJhbWluZyByZWN0YW5nbGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZ2V0Qm91bmRzID0gZnVuY3Rpb24gKG1hdHJpeClcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIHJldHVybiBQSVhJLlNwcml0ZS5wcm90b3R5cGUuZ2V0Qm91bmRzLmNhbGwodGhpcywgbWF0cml4KTtcbn07XG5cbi8qKlxuICogRGVzdHJveXMgdGhpcyB0ZXh0IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gW2Rlc3Ryb3lCYXNlVGV4dHVyZT10cnVlXSB7Ym9vbGVhbn0gd2hldGhlciB0byBkZXN0cm95IHRoZSBiYXNlIHRleHR1cmUgYXMgd2VsbFxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKGRlc3Ryb3lCYXNlVGV4dHVyZSlcbntcbiAgICAvLyBtYWtlIHN1cmUgdG8gcmVzZXQgdGhlIHRoZSBjb250ZXh0IGFuZCBjYW52YXMuLiBkb250IHdhbnQgdGhpcyBoYW5naW5nIGFyb3VuZCBpbiBtZW1vcnkhXG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICB0aGlzLmNhbnZhcyA9IG51bGw7XG5cbiAgICB0aGlzLl9zdHlsZSA9IG51bGw7XG5cbiAgICB0aGlzLl90ZXh0dXJlLmRlc3Ryb3koZGVzdHJveUJhc2VUZXh0dXJlID09PSB1bmRlZmluZWQgPyB0cnVlIDogZGVzdHJveUJhc2VUZXh0dXJlKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gVEVYVF9SRVNPTFVUSU9OIC0gRGVmYXVsdCByZXNvbHV0aW9uIG9mIGEgbmV3IENvY29vblRleHRcbiAgICAgKiBAY29uc3RhbnRcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgVEVYVF9SRVNPTFVUSU9OOjFcbn07XG4iXX0=
