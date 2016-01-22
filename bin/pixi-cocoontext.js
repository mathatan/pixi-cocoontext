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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyIsInNyYy9Db2Nvb25UZXh0VXRpbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQG5hbWVzcGFjZSBQSVhJLmNvY29vblRleHRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBQSVhJLmNvY29vbnRleHQgPSB7XG4gICAgQ29jb29uVGV4dDogICAgcmVxdWlyZSgnLi9Db2Nvb25UZXh0JyksXG4gICAgQ09OU1Q6ICAgIHJlcXVpcmUoJy4vQ29jb29uVGV4dFV0aWwnKVxufTtcbiIsInZhciBDT05TVCA9IHJlcXVpcmUoJy4uL0NvY29vblRleHRVdGlsJyk7XG5cbi8qKlxuICogQSBDb2Nvb25UZXh0IE9iamVjdCB3aWxsIGNyZWF0ZSBhIGxpbmUgb3IgbXVsdGlwbGUgbGluZXMgb2YgdGV4dC4gVG8gc3BsaXQgYSBsaW5lIHlvdSBjYW4gdXNlICdcXG4nIGluIHlvdXIgdGV4dCBzdHJpbmcsXG4gKiBvciBhZGQgYSB3b3JkV3JhcCBwcm9wZXJ0eSBzZXQgdG8gdHJ1ZSBhbmQgYW5kIHdvcmRXcmFwV2lkdGggcHJvcGVydHkgd2l0aCBhIHZhbHVlIGluIHRoZSBzdHlsZSBvYmplY3QuXG4gKlxuICogT25jZSBhIENvY29vblRleHQgaXMgZ2VuZXJhdGVkLCBpdCBpcyBzdG9yZWQgYXMgYSBCYXNlVGV4dHVyZSBhbmQgd2lsbCBiZSB1c2VkIGlmIGEgbmV3IFRleHQgaXNcbiAqIGNyZWF0ZWQgd2l0aCB0aGUgZXhhY3Qgc2FtZSBwYXJhbWV0ZXJzLlxuICpcbiAqIEEgQ29jb29uVGV4dCBjYW4gYmUgY3JlYXRlZCBkaXJlY3RseSBmcm9tIGEgc3RyaW5nIGFuZCBhIHN0eWxlIG9iamVjdFxuICpcbiAqIGBgYGpzXG4gKiB2YXIgdGV4dCA9IG5ldyBQSVhJLmV4dHJhcy5Db2Nvb25UZXh0KCdUaGlzIGlzIGEgQ29jb29uVGV4dCcse2ZvbnQgOiAnMjRweCBBcmlhbCcsIGZpbGwgOiAweGZmMTAxMCwgYWxpZ24gOiAnY2VudGVyJ30pO1xuICogYGBgXG4gKlxuICogQGNsYXNzXG4gKiBAZXh0ZW5kcyBTcHJpdGVcbiAqIEBtZW1iZXJvZiBQSVhJLmV4dHJhc1xuICogQHBhcmFtIHRleHQge3N0cmluZ30gVGhlIGNvcHkgdGhhdCB5b3Ugd291bGQgbGlrZSB0aGUgdGV4dCB0byBkaXNwbGF5XG4gKiBAcGFyYW0gW3N0eWxlXSB7b2JqZWN0fSBUaGUgc3R5bGUgcGFyYW1ldGVyc1xuICogQHBhcmFtIFtzdHlsZS5mb250XSB7c3RyaW5nfSBkZWZhdWx0ICdib2xkIDIwcHggQXJpYWwnIFRoZSBzdHlsZSBhbmQgc2l6ZSBvZiB0aGUgZm9udFxuICogQHBhcmFtIFtzdHlsZS5maWxsPSdibGFjayddIHtTdHJpbmd8TnVtYmVyfSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgZS5nICdyZWQnLCAnIzAwRkYwMCdcbiAqIEBwYXJhbSBbc3R5bGUuYWxpZ249J2xlZnQnXSB7c3RyaW5nfSBBbGlnbm1lbnQgZm9yIG11bHRpbGluZSB0ZXh0ICgnbGVmdCcsICdjZW50ZXInIG9yICdyaWdodCcpLCBkb2VzIG5vdCBhZmZlY3Qgc2luZ2xlIGxpbmUgdGV4dFxuICogQHBhcmFtIFtzdHlsZS5zdHJva2VdIHtTdHJpbmd8TnVtYmVyfSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgc3Ryb2tlIGUuZyAnYmx1ZScsICcjRkNGRjAwJ1xuICogQHBhcmFtIFtzdHlsZS5zdHJva2VUaGlja25lc3M9MF0ge251bWJlcn0gQSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB0aGlja25lc3Mgb2YgdGhlIHN0cm9rZS4gRGVmYXVsdCBpcyAwIChubyBzdHJva2UpXG4gKiBAcGFyYW0gW3N0eWxlLndvcmRXcmFwPWZhbHNlXSB7Ym9vbGVhbn0gSW5kaWNhdGVzIGlmIHdvcmQgd3JhcCBzaG91bGQgYmUgdXNlZFxuICogQHBhcmFtIFtzdHlsZS53b3JkV3JhcFdpZHRoPTEwMF0ge251bWJlcn0gVGhlIHdpZHRoIGF0IHdoaWNoIHRleHQgd2lsbCB3cmFwLCBpdCBuZWVkcyB3b3JkV3JhcCB0byBiZSBzZXQgdG8gdHJ1ZVxuICogQHBhcmFtIFtzdHlsZS5saW5lSGVpZ2h0XSB7bnVtYmVyfSBUaGUgbGluZSBoZWlnaHQsIGEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdmVydGljYWwgc3BhY2UgdGhhdCBhIGxldHRlciB1c2VzXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3c9ZmFsc2VdIHtib29sZWFufSBTZXQgYSBkcm9wIHNoYWRvdyBmb3IgdGhlIHRleHRcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0NvbG9yPScjMDAwMDAwJ10ge3N0cmluZ30gQSBmaWxsIHN0eWxlIHRvIGJlIHVzZWQgb24gdGhlIGRyb3BzaGFkb3cgZS5nICdyZWQnLCAnIzAwRkYwMCdcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0FuZ2xlPU1hdGguUEkvNF0ge251bWJlcn0gU2V0IGEgYW5nbGUgb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZT01XSB7bnVtYmVyfSBTZXQgYSBkaXN0YW5jZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAqIEBwYXJhbSBbc3R5bGUucGFkZGluZz0wXSB7bnVtYmVyfSBPY2Nhc2lvbmFsbHkgc29tZSBmb250cyBhcmUgY3JvcHBlZC4gQWRkaW5nIHNvbWUgcGFkZGluZyB3aWxsIHByZXZlbnQgdGhpcyBmcm9tIGhhcHBlbmluZ1xuICogQHBhcmFtIFtzdHlsZS50ZXh0QmFzZWxpbmU9J2FscGhhYmV0aWMnXSB7c3RyaW5nfSBUaGUgYmFzZWxpbmUgb2YgdGhlIHRleHQgdGhhdCBpcyByZW5kZXJlZC5cbiAqIEBwYXJhbSBbc3R5bGUubGluZUpvaW49J21pdGVyJ10ge3N0cmluZ30gVGhlIGxpbmVKb2luIHByb3BlcnR5IHNldHMgdGhlIHR5cGUgb2YgY29ybmVyIGNyZWF0ZWQsIGl0IGNhbiByZXNvbHZlXG4gKiAgICAgIHNwaWtlZCB0ZXh0IGlzc3Vlcy4gRGVmYXVsdCBpcyAnbWl0ZXInIChjcmVhdGVzIGEgc2hhcnAgY29ybmVyKS5cbiAqIEBwYXJhbSBbc3R5bGUubWl0ZXJMaW1pdD0xMF0ge251bWJlcn0gVGhlIG1pdGVyIGxpbWl0IHRvIHVzZSB3aGVuIHVzaW5nIHRoZSAnbWl0ZXInIGxpbmVKb2luIG1vZGUuIFRoaXMgY2FuIHJlZHVjZVxuICogICAgICBvciBpbmNyZWFzZSB0aGUgc3Bpa2luZXNzIG9mIHJlbmRlcmVkIHRleHQuXG4gKi9cbmZ1bmN0aW9uIENvY29vblRleHQodGV4dCwgc3R5bGUsIHJlc29sdXRpb24pXG57XG4gICAgLyoqXG4gICAgICogVGhlIGNhbnZhcyBlbGVtZW50IHRoYXQgZXZlcnl0aGluZyBpcyBkcmF3biB0b1xuICAgICAqXG4gICAgICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5jYW52YXMgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGNhbnZhcyAyZCBjb250ZXh0IHRoYXQgZXZlcnl0aGluZyBpcyBkcmF3biB3aXRoXG4gICAgICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSByZXNvbHV0aW9uIG9mIHRoZSBjYW52YXMuXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucmVzb2x1dGlvbiA9IHJlc29sdXRpb24gfHwgQ09OU1QuVEVYVF9SRVNPTFVUSU9OIHx8IFBJWEkuUkVTT0xVVElPTjtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgdHJhY2tlciBmb3IgdGhlIGN1cnJlbnQgdGV4dC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX3RleHQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSB0cmFja2VyIGZvciB0aGUgY3VycmVudCBzdHlsZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge29iamVjdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX3N0eWxlID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgdHJhY2tlciBmb3IgdGhlIGdlbmVyYXRlZCBzdHlsZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge29iamVjdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX2dlbmVyYXRlZFN0eWxlID0gbnVsbDtcblxuICAgIHRoaXMuX3BpeGlJZCA9IHRleHQrSlNPTi5zdHJpbmdpZnkoc3R5bGUpK3RoaXMucmVzb2x1dGlvbjtcblxuICAgIHZhciBiYXNlVGV4dHVyZSA9IFBJWEkudXRpbHMuQmFzZVRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuICAgIGlmICghYmFzZVRleHR1cmUpXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGJhc2VUZXh0dXJlLnNvdXJjZTtcbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHZhciB0ZXh0dXJlID0gUElYSS5UZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXMpO1xuICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgIFBJWEkuU3ByaXRlLmNhbGwodGhpcywgdGV4dHVyZSk7XG5cbiAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgIHRoaXMuc3R5bGUgPSBzdHlsZTtcblxuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gZmFsc2U7XG59XG5cbi8vIGNvbnN0cnVjdG9yXG5Db2Nvb25UZXh0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUElYSS5TcHJpdGUucHJvdG90eXBlKTtcbkNvY29vblRleHQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29jb29uVGV4dDtcbm1vZHVsZS5leHBvcnRzID0gQ29jb29uVGV4dDtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoQ29jb29uVGV4dC5wcm90b3R5cGUsIHtcbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggb2YgdGhlIENvY29vblRleHQsIHNldHRpbmcgdGhpcyB3aWxsIGFjdHVhbGx5IG1vZGlmeSB0aGUgc2NhbGUgdG8gYWNoaWV2ZSB0aGUgdmFsdWUgc2V0XG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgd2lkdGg6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGUueCAqIHRoaXMuX3RleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS54ID0gdmFsdWUgLyB0aGlzLl90ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICAgICAgICAgIHRoaXMuX3dpZHRoID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgQ29jb29uVGV4dCwgc2V0dGluZyB0aGlzIHdpbGwgYWN0dWFsbHkgbW9kaWZ5IHRoZSBzY2FsZSB0byBhY2hpZXZlIHRoZSB2YWx1ZSBzZXRcbiAgICAgKlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKiBAbWVtYmVyb2YgQ29jb29uVGV4dCNcbiAgICAgKi9cbiAgICBoZWlnaHQ6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICB0aGlzLnNjYWxlLnkgKiB0aGlzLl90ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNjYWxlLnkgPSB2YWx1ZSAvIHRoaXMuX3RleHR1cmUuX2ZyYW1lLmhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuX2hlaWdodCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc3R5bGUgb2YgdGhlIHRleHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBbdmFsdWVdIHtvYmplY3R9IFRoZSBzdHlsZSBwYXJhbWV0ZXJzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5mb250PSdib2xkIDIwcHQgQXJpYWwnXSB7c3RyaW5nfSBUaGUgc3R5bGUgYW5kIHNpemUgb2YgdGhlIGZvbnRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmZpbGw9J2JsYWNrJ10ge29iamVjdH0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IGVnICdyZWQnLCAnIzAwRkYwMCdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmFsaWduPSdsZWZ0J10ge3N0cmluZ30gQWxpZ25tZW50IGZvciBtdWx0aWxpbmUgdGV4dCAoJ2xlZnQnLCAnY2VudGVyJyBvciAncmlnaHQnKSwgZG9lcyBub3QgYWZmZWN0IHNpbmdsZSBsaW5lIHRleHRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnN0cm9rZT0nYmxhY2snXSB7c3RyaW5nfSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgc3Ryb2tlIGVnICdibHVlJywgJyNGQ0ZGMDAnXG4gICAgICogQHBhcmFtIFt2YWx1ZS5zdHJva2VUaGlja25lc3M9MF0ge251bWJlcn0gQSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB0aGlja25lc3Mgb2YgdGhlIHN0cm9rZS4gRGVmYXVsdCBpcyAwIChubyBzdHJva2UpXG4gICAgICogQHBhcmFtIFt2YWx1ZS53b3JkV3JhcD1mYWxzZV0ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB3b3JkIHdyYXAgc2hvdWxkIGJlIHVzZWRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLndvcmRXcmFwV2lkdGg9MTAwXSB7bnVtYmVyfSBUaGUgd2lkdGggYXQgd2hpY2ggdGV4dCB3aWxsIHdyYXBcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmxpbmVIZWlnaHRdIHtudW1iZXJ9IFRoZSBsaW5lIGhlaWdodCwgYSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB2ZXJ0aWNhbCBzcGFjZSB0aGF0IGEgbGV0dGVyIHVzZXNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3c9ZmFsc2VdIHtib29sZWFufSBTZXQgYSBkcm9wIHNoYWRvdyBmb3IgdGhlIHRleHRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dDb2xvcj0nIzAwMDAwMCddIHtzdHJpbmd9IEEgZmlsbCBzdHlsZSB0byBiZSB1c2VkIG9uIHRoZSBkcm9wc2hhZG93IGUuZyAncmVkJywgJyMwMEZGMDAnXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93QW5nbGU9TWF0aC5QSS82XSB7bnVtYmVyfSBTZXQgYSBhbmdsZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dEaXN0YW5jZT01XSB7bnVtYmVyfSBTZXQgYSBkaXN0YW5jZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnBhZGRpbmc9MF0ge251bWJlcn0gT2NjYXNpb25hbGx5IHNvbWUgZm9udHMgYXJlIGNyb3BwZWQuIEFkZGluZyBzb21lIHBhZGRpbmcgd2lsbCBwcmV2ZW50IHRoaXMgZnJvbSBoYXBwZW5pbmdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnRleHRCYXNlbGluZT0nYWxwaGFiZXRpYyddIHtzdHJpbmd9IFRoZSBiYXNlbGluZSBvZiB0aGUgdGV4dCB0aGF0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSBbdmFsdWUubGluZUpvaW49J21pdGVyJ10ge3N0cmluZ30gVGhlIGxpbmVKb2luIHByb3BlcnR5IHNldHMgdGhlIHR5cGUgb2YgY29ybmVyIGNyZWF0ZWQsIGl0IGNhbiByZXNvbHZlXG4gICAgICogICAgICBzcGlrZWQgdGV4dCBpc3N1ZXMuIERlZmF1bHQgaXMgJ21pdGVyJyAoY3JlYXRlcyBhIHNoYXJwIGNvcm5lcikuXG4gICAgICogQHBhcmFtIFt2YWx1ZS5taXRlckxpbWl0PTEwXSB7bnVtYmVyfSBUaGUgbWl0ZXIgbGltaXQgdG8gdXNlIHdoZW4gdXNpbmcgdGhlICdtaXRlcicgbGluZUpvaW4gbW9kZS4gVGhpcyBjYW4gcmVkdWNlXG4gICAgICogICAgICBvciBpbmNyZWFzZSB0aGUgc3Bpa2luZXNzIG9mIHJlbmRlcmVkIHRleHQuXG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgc3R5bGU6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc3R5bGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB7fTtcbiAgICAgICAgICAgIHN0eWxlLmZvbnQgPSB2YWx1ZS5mb250IHx8ICdib2xkIDIwcHggQXJpYWwnO1xuICAgICAgICAgICAgc3R5bGUuZmlsbCA9IHZhbHVlLmZpbGwgfHwgJ2JsYWNrJztcbiAgICAgICAgICAgIHN0eWxlLmFsaWduID0gdmFsdWUuYWxpZ24gfHwgJ2xlZnQnO1xuICAgICAgICAgICAgc3R5bGUuc3Ryb2tlID0gdmFsdWUuc3Ryb2tlIHx8ICdibGFjayc7IC8vcHJvdmlkZSBhIGRlZmF1bHQsIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL0dvb2RCb3lEaWdpdGFsL3BpeGkuanMvaXNzdWVzLzEzNlxuICAgICAgICAgICAgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzID0gdmFsdWUuc3Ryb2tlVGhpY2tuZXNzIHx8IDA7XG4gICAgICAgICAgICBzdHlsZS53b3JkV3JhcCA9IHZhbHVlLndvcmRXcmFwIHx8IGZhbHNlO1xuICAgICAgICAgICAgc3R5bGUud29yZFdyYXBXaWR0aCA9IHZhbHVlLndvcmRXcmFwV2lkdGggfHwgMTAwO1xuXG4gICAgICAgICAgICBzdHlsZS5kcm9wU2hhZG93ID0gdmFsdWUuZHJvcFNoYWRvdyB8fCBmYWxzZTtcbiAgICAgICAgICAgIHN0eWxlLmRyb3BTaGFkb3dDb2xvciA9IHZhbHVlLmRyb3BTaGFkb3dDb2xvciB8fCAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzdHlsZS5kcm9wU2hhZG93QW5nbGUgPSB2YWx1ZS5kcm9wU2hhZG93QW5nbGUgfHwgTWF0aC5QSSAvIDY7XG4gICAgICAgICAgICBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgPSB2YWx1ZS5kcm9wU2hhZG93RGlzdGFuY2UgfHwgNTtcblxuICAgICAgICAgICAgc3R5bGUucGFkZGluZyA9IHZhbHVlLnBhZGRpbmcgfHwgMDtcblxuICAgICAgICAgICAgc3R5bGUudGV4dEJhc2VsaW5lID0gdmFsdWUudGV4dEJhc2VsaW5lIHx8ICdhbHBoYWJldGljJztcblxuICAgICAgICAgICAgc3R5bGUubGluZUpvaW4gPSB2YWx1ZS5saW5lSm9pbiB8fCAnbWl0ZXInO1xuICAgICAgICAgICAgc3R5bGUubWl0ZXJMaW1pdCA9IHZhbHVlLm1pdGVyTGltaXQgfHwgMTA7XG5cbiAgICAgICAgICAgIC8vbXVsdGlwbHkgdGhlIGZvbnQgc3R5bGUgYnkgdGhlIHJlc29sdXRpb25cbiAgICAgICAgICAgIC8vVE9ETyA6IHdhcm4gaWYgZm9udCBzaXplIG5vdCBpbiBweCB1bml0XG4gICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZWRTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICBmb250IDogc3R5bGUuZm9udC5yZXBsYWNlKC9bMC05XSsvLE1hdGgucm91bmQocGFyc2VJbnQoc3R5bGUuZm9udC5tYXRjaCgvWzAtOV0rLylbMF0sMTApKnRoaXMucmVzb2x1dGlvbikpLFxuICAgICAgICAgICAgICAgIGZpbGwgOiBzdHlsZS5maWxsLFxuICAgICAgICAgICAgICAgIGFsaWduIDogc3R5bGUuYWxpZ24sXG4gICAgICAgICAgICAgICAgc3Ryb2tlIDogc3R5bGUuc3Ryb2tlLFxuICAgICAgICAgICAgICAgIHN0cm9rZVRoaWNrbmVzcyA6IE1hdGgucm91bmQoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgd29yZFdyYXAgOiBzdHlsZS53b3JkV3JhcCxcbiAgICAgICAgICAgICAgICB3b3JkV3JhcFdpZHRoIDogTWF0aC5yb3VuZChzdHlsZS53b3JkV3JhcFdpZHRoKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvdyA6IHN0eWxlLmRyb3BTaGFkb3csXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd0NvbG9yIDogc3R5bGUuZHJvcFNoYWRvd0NvbG9yLFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3dBbmdsZSA6IHN0eWxlLmRyb3BTaGFkb3dBbmdsZSxcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93RGlzdGFuY2UgOiBNYXRoLnJvdW5kKHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIHBhZGRpbmcgOiBNYXRoLnJvdW5kKHN0eWxlLnBhZGRpbmcqdGhpcy5yZXNvbHV0aW9uKSxcbiAgICAgICAgICAgICAgICB0ZXh0QmFzZWxpbmUgOiBzdHlsZS50ZXh0QmFzZWxpbmUsXG4gICAgICAgICAgICAgICAgbGluZUpvaW4gOiBzdHlsZS5saW5lSm9pbixcbiAgICAgICAgICAgICAgICBtaXRlckxpbWl0IDogc3R5bGUubWl0ZXJMaW1pdFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3N0eWxlICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZVVwZGF0ZVRleHQodGhpcy5fdGV4dCx2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3N0eWxlID0gc3R5bGU7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGNvcHkgZm9yIHRoZSB0ZXh0IG9iamVjdC4gVG8gc3BsaXQgYSBsaW5lIHlvdSBjYW4gdXNlICdcXG4nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQge3N0cmluZ30gVGhlIGNvcHkgdGhhdCB5b3Ugd291bGQgbGlrZSB0aGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgdGV4dDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpe1xuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9TdHJpbmcoKSB8fCAnICc7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCA9PT0gdGV4dClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRleHQsdGhpcy5fc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdGV4dCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFByZXBhcmUgdGhlIGNhbnZhcyBmb3IgYW4gdXBkYXRlIGFuZCB0cnkgdG8gZ2V0IGEgY2FjaGVkIHRleHQgZmlyc3QuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUucHJlcGFyZVVwZGF0ZVRleHQgPSBmdW5jdGlvbiAodGV4dCxzdHlsZSlcbntcbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0K0pTT04uc3RyaW5naWZ5KHN0eWxlKSt0aGlzLnJlc29sdXRpb247XG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnN3aXRjaENhbnZhcyA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIGJhc2VUZXh0dXJlID0gUElYSS51dGlscy5CYXNlVGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF07XG4gICAgaWYgKGJhc2VUZXh0dXJlKVxuICAgIHtcbiAgICAgICAgLy90aGVyZSBpcyBhIGNhY2hlZCB0ZXh0IGZvciB0aGVzZSBwYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuY2FudmFzID0gYmFzZVRleHR1cmUuc291cmNlO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHZhciB0ZXh0dXJlID0gUElYSS5UZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXMpO1xuICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgIHRoaXMudGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5fdGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0ZXh0IGFuZCB1cGRhdGVzIGl0IHdoZW4gbmVlZGVkXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUudXBkYXRlVGV4dCA9IGZ1bmN0aW9uICgpXG57XG4gICAgaWYgKHRoaXMuc3dpdGNoTmVlZGVkKVxuICAgIHtcbiAgICAgICAgdGhpcy5zd2l0Y2hDYW52YXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMuX2dlbmVyYXRlZFN0eWxlO1xuICAgICAgICB0aGlzLmNvbnRleHQuZm9udCA9IHN0eWxlLmZvbnQ7XG5cbiAgICAgICAgLy8gd29yZCB3cmFwXG4gICAgICAgIC8vIHByZXNlcnZlIG9yaWdpbmFsIHRleHRcbiAgICAgICAgdmFyIG91dHB1dFRleHQgPSBzdHlsZS53b3JkV3JhcCA/IHRoaXMud29yZFdyYXAodGhpcy5fdGV4dCkgOiB0aGlzLl90ZXh0O1xuXG4gICAgICAgIC8vIHNwbGl0IHRleHQgaW50byBsaW5lc1xuICAgICAgICB2YXIgbGluZXMgPSBvdXRwdXRUZXh0LnNwbGl0KC8oPzpcXHJcXG58XFxyfFxcbikvKTtcblxuICAgICAgICAvLyBjYWxjdWxhdGUgdGV4dCB3aWR0aFxuICAgICAgICB2YXIgbGluZVdpZHRocyA9IG5ldyBBcnJheShsaW5lcy5sZW5ndGgpO1xuICAgICAgICB2YXIgbWF4TGluZVdpZHRoID0gMDtcbiAgICAgICAgdmFyIGZvbnRQcm9wZXJ0aWVzID0gdGhpcy5kZXRlcm1pbmVGb250UHJvcGVydGllcyhzdHlsZS5mb250KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGxpbmVXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChsaW5lc1tpXSkud2lkdGg7XG4gICAgICAgICAgICBsaW5lV2lkdGhzW2ldID0gbGluZVdpZHRoO1xuICAgICAgICAgICAgbWF4TGluZVdpZHRoID0gTWF0aC5tYXgobWF4TGluZVdpZHRoLCBsaW5lV2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZHRoID0gbWF4TGluZVdpZHRoICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzO1xuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgd2lkdGggKz0gc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAoIHdpZHRoICsgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCApO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0ZXh0IGhlaWdodFxuICAgICAgICB2YXIgbGluZUhlaWdodCA9IHRoaXMuc3R5bGUubGluZUhlaWdodCB8fCBmb250UHJvcGVydGllcy5mb250U2l6ZSArIHN0eWxlLnN0cm9rZVRoaWNrbmVzcztcblxuICAgICAgICB2YXIgaGVpZ2h0ID0gbGluZUhlaWdodCAqIGxpbmVzLmxlbmd0aDtcbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAoIGhlaWdodCArIHN0eWxlLnBhZGRpbmcgKiAyICk7XG5cbiAgICAgICAgaWYgKG5hdmlnYXRvci5pc0NvY29vbkpTKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmZvbnQgPSBzdHlsZS5mb250O1xuICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBzdHlsZS5zdHJva2U7XG4gICAgICAgIHRoaXMuY29udGV4dC5saW5lV2lkdGggPSBzdHlsZS5zdHJva2VUaGlja25lc3M7XG4gICAgICAgIHRoaXMuY29udGV4dC50ZXh0QmFzZWxpbmUgPSBzdHlsZS50ZXh0QmFzZWxpbmU7XG4gICAgICAgIHRoaXMuY29udGV4dC5saW5lSm9pbiA9IHN0eWxlLmxpbmVKb2luO1xuICAgICAgICB0aGlzLmNvbnRleHQubWl0ZXJMaW1pdCA9IHN0eWxlLm1pdGVyTGltaXQ7XG5cbiAgICAgICAgdmFyIGxpbmVQb3NpdGlvblg7XG4gICAgICAgIHZhciBsaW5lUG9zaXRpb25ZO1xuXG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gc3R5bGUuZHJvcFNoYWRvd0NvbG9yO1xuXG4gICAgICAgICAgICB2YXIgeFNoYWRvd09mZnNldCA9IE1hdGguY29zKHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgICAgICB2YXIgeVNoYWRvd09mZnNldCA9IE1hdGguc2luKHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMjtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25ZID0gKHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAvIDIgKyBpICogbGluZUhlaWdodCkgKyBmb250UHJvcGVydGllcy5hc2NlbnQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuYWxpZ24gPT09ICdyaWdodCcpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YICs9IG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlLmFsaWduID09PSAnY2VudGVyJylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gKG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV0pIC8gMjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuZmlsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChsaW5lc1tpXSwgbGluZVBvc2l0aW9uWCArIHhTaGFkb3dPZmZzZXQsIGxpbmVQb3NpdGlvblkgKyB5U2hhZG93T2Zmc2V0ICsgc3R5bGUucGFkZGluZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9zZXQgY2FudmFzIHRleHQgc3R5bGVzXG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBzdHlsZS5maWxsO1xuXG4gICAgICAgIC8vZHJhdyBsaW5lcyBsaW5lIGJ5IGxpbmVcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBsaW5lUG9zaXRpb25YID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMjtcbiAgICAgICAgICAgIGxpbmVQb3NpdGlvblkgPSAoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMiArIGkgKiBsaW5lSGVpZ2h0KSArIGZvbnRQcm9wZXJ0aWVzLmFzY2VudDtcblxuICAgICAgICAgICAgaWYgKHN0eWxlLmFsaWduID09PSAncmlnaHQnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gbWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlLmFsaWduID09PSAnY2VudGVyJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YICs9IChtYXhMaW5lV2lkdGggLSBsaW5lV2lkdGhzW2ldKSAvIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5zdHJva2UgJiYgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YLCBsaW5lUG9zaXRpb25ZICsgc3R5bGUucGFkZGluZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5maWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChsaW5lc1tpXSwgbGluZVBvc2l0aW9uWCwgbGluZVBvc2l0aW9uWSArIHN0eWxlLnBhZGRpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVUZXh0dXJlKCk7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGV4dHVyZSBzaXplIGJhc2VkIG9uIGNhbnZhcyBzaXplXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUudXBkYXRlVGV4dHVyZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIHRleHR1cmUgPSB0aGlzLl90ZXh0dXJlO1xuXG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUuaGFzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5yZXNvbHV0aW9uID0gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG4gICAgfVxuXG4gICAgdGV4dHVyZS5jcm9wLndpZHRoID0gdGV4dHVyZS5fZnJhbWUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0ZXh0dXJlLmNyb3AuaGVpZ2h0ID0gdGV4dHVyZS5fZnJhbWUuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdGV4dHVyZS50cmltLnggPSAwO1xuICAgIHRleHR1cmUudHJpbS55ID0gLXRoaXMuX3N0eWxlLnBhZGRpbmc7XG5cbiAgICB0ZXh0dXJlLnRyaW0ud2lkdGggPSB0ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICB0ZXh0dXJlLnRyaW0uaGVpZ2h0ID0gdGV4dHVyZS5fZnJhbWUuaGVpZ2h0IC0gdGhpcy5fc3R5bGUucGFkZGluZyoyO1xuXG4gICAgdGhpcy5fd2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0aGlzLnNjYWxlLnggPSAxO1xuICAgIHRoaXMuc2NhbGUueSA9IDE7XG5cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5lbWl0KCd1cGRhdGUnLCAgdGV4dHVyZS5iYXNlVGV4dHVyZSk7XG4gICAgfVxuXG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhc2NlbnQsIGRlc2NlbnQgYW5kIGZvbnRTaXplIG9mIGEgZ2l2ZW4gZm9udFN0eWxlXG4gKlxuICogQHBhcmFtIGZvbnRTdHlsZSB7b2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZGV0ZXJtaW5lRm9udFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoZm9udFN0eWxlKVxue1xuICAgIHZhciBwcm9wZXJ0aWVzID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FjaGVbZm9udFN0eWxlXTtcblxuICAgIGlmICghcHJvcGVydGllcylcbiAgICB7XG4gICAgICAgIHByb3BlcnRpZXMgPSB7fTtcblxuICAgICAgICB2YXIgY2FudmFzID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FudmFzO1xuICAgICAgICB2YXIgY29udGV4dCA9IFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NvbnRleHQ7XG5cbiAgICAgICAgY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuXG4gICAgICAgIHZhciB3aWR0aCA9IE1hdGguY2VpbChjb250ZXh0Lm1lYXN1cmVUZXh0KCd8TcOJcScpLndpZHRoKTtcbiAgICAgICAgdmFyIGJhc2VsaW5lID0gTWF0aC5jZWlsKGNvbnRleHQubWVhc3VyZVRleHQoJ00nKS53aWR0aCk7XG4gICAgICAgIHZhciBoZWlnaHQgPSAyICogYmFzZWxpbmU7XG5cbiAgICAgICAgLy8gYmFzZWxpbmUgZmFjdG9yIGRlcGVuZHMgYSBsb3Qgb2YgdGhlIGZvbnQuIHRvZG8gOiBsZXQgdXNlciBzcGVjaWZ5IGEgZmFjdG9yIHBlciBmb250IG5hbWUgP1xuICAgICAgICBiYXNlbGluZSA9IGJhc2VsaW5lICogMS4yIHwgMDtcblxuICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjZjAwJztcbiAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgICAgICBjb250ZXh0LmZvbnQgPSBmb250U3R5bGU7XG5cbiAgICAgICAgY29udGV4dC50ZXh0QmFzZWxpbmUgPSAnYWxwaGFiZXRpYyc7XG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyMwMDAnO1xuICAgICAgICBjb250ZXh0LmZpbGxUZXh0KCd8TcOJcScsIDAsIGJhc2VsaW5lKTtcblxuICAgICAgICB2YXIgaW1hZ2VkYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCkuZGF0YTtcbiAgICAgICAgdmFyIHBpeGVscyA9IGltYWdlZGF0YS5sZW5ndGg7XG4gICAgICAgIHZhciBsaW5lID0gd2lkdGggKiA0O1xuXG4gICAgICAgIHZhciBpLCBqO1xuXG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgc3RvcCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGFzY2VudC4gc2NhbiBmcm9tIHRvcCB0byBib3R0b20gdW50aWwgd2UgZmluZCBhIG5vbiByZWQgcGl4ZWxcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGJhc2VsaW5lOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsaW5lOyBqICs9IDQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGltYWdlZGF0YVtpZHggKyBqXSAhPT0gMjU1KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RvcClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZHggKz0gbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BlcnRpZXMuYXNjZW50ID0gYmFzZWxpbmUgLSBpO1xuXG4gICAgICAgIGlkeCA9IHBpeGVscyAtIGxpbmU7XG4gICAgICAgIHN0b3AgPSBmYWxzZTtcblxuICAgICAgICAvLyBkZXNjZW50LiBzY2FuIGZyb20gYm90dG9tIHRvIHRvcCB1bnRpbCB3ZSBmaW5kIGEgbm9uIHJlZCBwaXhlbFxuICAgICAgICBmb3IgKGkgPSBoZWlnaHQ7IGkgPiBiYXNlbGluZTsgaS0tKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbGluZTsgaiArPSA0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChpbWFnZWRhdGFbaWR4ICsgal0gIT09IDI1NSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXN0b3ApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWR4IC09IGxpbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wZXJ0aWVzLmRlc2NlbnQgPSBpIC0gYmFzZWxpbmU7XG4gICAgICAgIHByb3BlcnRpZXMuZm9udFNpemUgPSBwcm9wZXJ0aWVzLmFzY2VudCArIHByb3BlcnRpZXMuZGVzY2VudDtcblxuICAgICAgICBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYWNoZVtmb250U3R5bGVdID0gcHJvcGVydGllcztcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvcGVydGllcztcbn07XG5cbi8qKlxuICogQXBwbGllcyBuZXdsaW5lcyB0byBhIHN0cmluZyB0byBoYXZlIGl0IG9wdGltYWxseSBmaXQgaW50byB0aGUgaG9yaXpvbnRhbFxuICogYm91bmRzIHNldCBieSB0aGUgVGV4dCBvYmplY3QncyB3b3JkV3JhcFdpZHRoIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSB0ZXh0IHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS53b3JkV3JhcCA9IGZ1bmN0aW9uICh0ZXh0KVxue1xuICAgIC8vIEdyZWVkeSB3cmFwcGluZyBhbGdvcml0aG0gdGhhdCB3aWxsIHdyYXAgd29yZHMgYXMgdGhlIGxpbmUgZ3Jvd3MgbG9uZ2VyXG4gICAgLy8gdGhhbiBpdHMgaG9yaXpvbnRhbCBib3VuZHMuXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIHZhciBsaW5lcyA9IHRleHQuc3BsaXQoJ1xcbicpO1xuICAgIHZhciB3b3JkV3JhcFdpZHRoID0gdGhpcy5fZ2VuZXJhdGVkU3R5bGUud29yZFdyYXBXaWR0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgIHtcbiAgICAgICAgdmFyIHNwYWNlTGVmdCA9IHdvcmRXcmFwV2lkdGg7XG4gICAgICAgIHZhciB3b3JkcyA9IGxpbmVzW2ldLnNwbGl0KCcgJyk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgd29yZHMubGVuZ3RoOyBqKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciB3b3JkV2lkdGggPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQod29yZHNbal0pLndpZHRoO1xuICAgICAgICAgICAgdmFyIHdvcmRXaWR0aFdpdGhTcGFjZSA9IHdvcmRXaWR0aCArIHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dCgnICcpLndpZHRoO1xuICAgICAgICAgICAgaWYgKGogPT09IDAgfHwgd29yZFdpZHRoV2l0aFNwYWNlID4gc3BhY2VMZWZ0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIFNraXAgcHJpbnRpbmcgdGhlIG5ld2xpbmUgaWYgaXQncyB0aGUgZmlyc3Qgd29yZCBvZiB0aGUgbGluZSB0aGF0IGlzXG4gICAgICAgICAgICAgICAgLy8gZ3JlYXRlciB0aGFuIHRoZSB3b3JkIHdyYXAgd2lkdGguXG4gICAgICAgICAgICAgICAgaWYgKGogPiAwKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gd29yZHNbal07XG4gICAgICAgICAgICAgICAgc3BhY2VMZWZ0ID0gd29yZFdyYXBXaWR0aCAtIHdvcmRXaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzcGFjZUxlZnQgLT0gd29yZFdpZHRoV2l0aFNwYWNlO1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnICcgKyB3b3Jkc1tqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpIDwgbGluZXMubGVuZ3RoLTEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFxuJztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBvYmplY3QgdXNpbmcgdGhlIFdlYkdMIHJlbmRlcmVyXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIHtXZWJHTFJlbmRlcmVyfVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5yZW5kZXJXZWJHTCA9IGZ1bmN0aW9uIChyZW5kZXJlcilcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIFBJWEkuU3ByaXRlLnByb3RvdHlwZS5yZW5kZXJXZWJHTC5jYWxsKHRoaXMsIHJlbmRlcmVyKTtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0aGUgb2JqZWN0IHVzaW5nIHRoZSBDYW52YXMgcmVuZGVyZXJcbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIge0NhbnZhc1JlbmRlcmVyfVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuX3JlbmRlckNhbnZhcyA9IGZ1bmN0aW9uIChyZW5kZXJlcilcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIFBJWEkuU3ByaXRlLnByb3RvdHlwZS5fcmVuZGVyQ2FudmFzLmNhbGwodGhpcywgcmVuZGVyZXIpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBib3VuZHMgb2YgdGhlIFRleHQgYXMgYSByZWN0YW5nbGUuIFRoZSBib3VuZHMgY2FsY3VsYXRpb24gdGFrZXMgdGhlIHdvcmxkVHJhbnNmb3JtIGludG8gYWNjb3VudC5cbiAqXG4gKiBAcGFyYW0gbWF0cml4IHtNYXRyaXh9IHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggb2YgdGhlIFRleHRcbiAqIEByZXR1cm4ge1JlY3RhbmdsZX0gdGhlIGZyYW1pbmcgcmVjdGFuZ2xlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLmdldEJvdW5kcyA9IGZ1bmN0aW9uIChtYXRyaXgpXG57XG4gICAgaWYgKHRoaXMuZGlydHkpXG4gICAge1xuICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUElYSS5TcHJpdGUucHJvdG90eXBlLmdldEJvdW5kcy5jYWxsKHRoaXMsIG1hdHJpeCk7XG59O1xuXG4vKipcbiAqIERlc3Ryb3lzIHRoaXMgdGV4dCBvYmplY3QuXG4gKlxuICogQHBhcmFtIFtkZXN0cm95QmFzZVRleHR1cmU9dHJ1ZV0ge2Jvb2xlYW59IHdoZXRoZXIgdG8gZGVzdHJveSB0aGUgYmFzZSB0ZXh0dXJlIGFzIHdlbGxcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIChkZXN0cm95QmFzZVRleHR1cmUpXG57XG4gICAgLy8gbWFrZSBzdXJlIHRvIHJlc2V0IHRoZSB0aGUgY29udGV4dCBhbmQgY2FudmFzLi4gZG9udCB3YW50IHRoaXMgaGFuZ2luZyBhcm91bmQgaW4gbWVtb3J5IVxuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgdGhpcy5jYW52YXMgPSBudWxsO1xuXG4gICAgdGhpcy5fc3R5bGUgPSBudWxsO1xuXG4gICAgdGhpcy5fdGV4dHVyZS5kZXN0cm95KGRlc3Ryb3lCYXNlVGV4dHVyZSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGRlc3Ryb3lCYXNlVGV4dHVyZSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IFRFWFRfUkVTT0xVVElPTiAtIERlZmF1bHQgcmVzb2x1dGlvbiBvZiBhIG5ldyBDb2Nvb25UZXh0XG4gICAgICogQGNvbnN0YW50XG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIFRFWFRfUkVTT0xVVElPTjoxXG59O1xuIl19
