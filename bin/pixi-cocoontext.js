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

            var oldStyle = this._style;

            var style = style || {};
            if (value instanceof PIXI.TextStyle)
            {
                this._style = value;
            }
            else
            {
                this._style = new PIXI.TextStyle(style);
            }

            if (oldStyle !== this._style || this._style.styleID !== this._styleID) {
                this._styleID = this._style.styleID;

                if (this._style !== null)
                {
                    this.prepareUpdateText(this._text,this._style);
                }

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
        if (typeof textureCache[this._pixiId] !== 'undefined') {
            texture = textureCache[this._pixiId];
        } else {
            texture = PIXI.Texture.fromCanvas(this.canvas);
            texture.trim = new PIXI.Rectangle();
            textureCache[this._pixiId] = texture;
        }

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
        var style = this._style;
        var fontSizeString = (typeof style.fontSize === 'number') ? style.fontSize * this.resolution + 'px' : style.fontSize;
        var fontStyle = style.fontStyle + ' ' + style.fontVariant + ' ' + style.fontWeight + ' ' + fontSizeString + ' ' + style.fontFamily;
        this.context.font = fontStyle;

        // word wrap
        // preserve original text
        var outputText = style.wordWrap ? this.wordWrap(this._text) : this._text;

        // split text into lines
        var lines = outputText.split(/(?:\r\n|\r|\n)/);

        // calculate text width
        var lineWidths = new Array(lines.length);
        var maxLineWidth = 0;
        var fontProperties = this.determineFontProperties(style);
        for (var i = 0; i < lines.length; i++)
        {
            var lineWidth = this.context.measureText(lines[i]).width;
            lineWidths[i] = lineWidth;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
        }

        var width = maxLineWidth + style.strokeThickness * this.resolution;
        if (style.dropShadow)
        {
            width += style.dropShadowDistance * this.resolution;
        }

        this.canvas.width = ( width + this.context.lineWidth );

        // calculate text height
        var lineHeight = this.style.lineHeight  * this.resolution || fontProperties.fontSize + style.strokeThickness * this.resolution;

        var height = lineHeight * lines.length;
        if (style.dropShadow)
        {
            height += style.dropShadowDistance * this.resolution;
        }

        this.canvas.height = ( height + style.padding * 2 * this.resolution );

        if (navigator.isCocoonJS)
        {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        fontSizeString = (typeof style.fontSize === 'number') ? style.fontSize * this.resolution + 'px' : style.fontSize;
        fontStyle = style.fontStyle + ' ' + style.fontVariant + ' ' + style.fontWeight + ' ' + fontSizeString + ' ' + style.fontFamily;

        this.context.font = fontStyle;
        this.context.textBaseline = style.textBaseline;
        this.context.lineJoin = style.lineJoin;
        this.context.miterLimit = style.miterLimit;

        var linePositionX;
        var linePositionY;

        if (style.dropShadow)
        {
            var dropShadowColor = style.dropShadowColor;
            if (typeof dropShadowColor === 'object') {
                dropShadowColor = this.gradientFill(
                    dropShadowColor,
                    width,
                    lineHeight + style.strokeThickness * this.resolution + style.dropShadowDistance * this.resolution
                );
            }

            var xShadowOffset = Math.cos(style.dropShadowAngle) * style.dropShadowDistance;
            var yShadowOffset = Math.sin(style.dropShadowAngle) * style.dropShadowDistance;

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
            stroke = this.gradientFill(stroke, width, lineHeight + style.strokeThickness * this.resolution);
        }

        this.context.strokeStyle = stroke;
        this.context.lineWidth = style.strokeThickness * this.resolution;


        var fill = style.fill;
        if (typeof fill === 'object') {
            fill = this.gradientFill(
                fill,
                width,
                lineHeight,
                style.strokeThickness * this.resolution + style.padding * this.resolution
            );
        }

        //set canvas text styles
        this.context.fillStyle = fill;

        //draw lines line by line
        for (i = 0; i < lines.length; i++)
        {
            linePositionX = style.strokeThickness * this.resolution / 2;
            linePositionY = (style.strokeThickness * this.resolution / 2 + i * lineHeight) + fontProperties.ascent;

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
                this.context.strokeText(lines[i], linePositionX, linePositionY + style.padding * this.resolution);
            }

            if (style.fill)
            {
                this.context.fillText(lines[i], linePositionX, linePositionY + style.padding * this.resolution);
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

    var i, iLen;

    if (typeof options.stops !== 'undefined') {
        for (i = 0, iLen = options.stops.length; i < iLen; i++) {
            gradient.addColorStop(options.stops[i].stop, options.stops[i].color);
        }
    } else {
        for (i = 0, iLen = options.stops.length; i < iLen; i++) {
            var stop = i / iLen;
            gradient.addColorStop(stop, options.stops[i]);
        }
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
    texture.trim.y = 0; //-this._style.padding * this.resolution;

    texture.trim.width = texture._frame.width;
    texture.trim.height = texture._frame.height;// - this._style.padding * 2 * this.resolution;

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
CocoonText.prototype.determineFontProperties = function (style)
{
    var fontSizeString = (typeof style.fontSize === 'number') ? style.fontSize * this.resolution + 'px' : style.fontSize;
    var fontStyle = style.fontStyle + ' ' + style.fontVariant + ' ' + style.fontWeight + ' ' + fontSizeString + ' ' + style.fontFamily;

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
    var wordWrapWidth = this._style.wordWrapWidth * this.resolution;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyIsInNyYy9Db2Nvb25UZXh0VXRpbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL3dCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAbmFtZXNwYWNlIFBJWEkuY29jb29uVGV4dFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFBJWEkuY29jb29udGV4dCA9IHtcbiAgICBDb2Nvb25UZXh0OiAgICByZXF1aXJlKCcuL0NvY29vblRleHQnKSxcbiAgICBDT05TVDogICAgcmVxdWlyZSgnLi9Db2Nvb25UZXh0VXRpbCcpXG59O1xuIiwidmFyIENPTlNUID0gcmVxdWlyZSgnLi4vQ29jb29uVGV4dFV0aWwnKTtcblxuLyoqXG4gKiBBIENvY29vblRleHQgT2JqZWN0IHdpbGwgY3JlYXRlIGEgbGluZSBvciBtdWx0aXBsZSBsaW5lcyBvZiB0ZXh0LiBUbyBzcGxpdCBhIGxpbmUgeW91IGNhbiB1c2UgJ1xcbicgaW4geW91ciB0ZXh0IHN0cmluZyxcbiAqIG9yIGFkZCBhIHdvcmRXcmFwIHByb3BlcnR5IHNldCB0byB0cnVlIGFuZCBhbmQgd29yZFdyYXBXaWR0aCBwcm9wZXJ0eSB3aXRoIGEgdmFsdWUgaW4gdGhlIHN0eWxlIG9iamVjdC5cbiAqXG4gKiBPbmNlIGEgQ29jb29uVGV4dCBpcyBnZW5lcmF0ZWQsIGl0IGlzIHN0b3JlZCBhcyBhIEJhc2VUZXh0dXJlIGFuZCB3aWxsIGJlIHVzZWQgaWYgYSBuZXcgVGV4dCBpc1xuICogY3JlYXRlZCB3aXRoIHRoZSBleGFjdCBzYW1lIHBhcmFtZXRlcnMuXG4gKlxuICogQSBDb2Nvb25UZXh0IGNhbiBiZSBjcmVhdGVkIGRpcmVjdGx5IGZyb20gYSBzdHJpbmcgYW5kIGEgc3R5bGUgb2JqZWN0XG4gKlxuICogYGBganNcbiAqIHZhciB0ZXh0ID0gbmV3IFBJWEkuZXh0cmFzLkNvY29vblRleHQoJ1RoaXMgaXMgYSBDb2Nvb25UZXh0Jyx7Zm9udCA6ICcyNHB4IEFyaWFsJywgZmlsbCA6IDB4ZmYxMDEwLCBhbGlnbiA6ICdjZW50ZXInfSk7XG4gKiBgYGBcbiAqXG4gKiBAY2xhc3NcbiAqIEBleHRlbmRzIFNwcml0ZVxuICogQG1lbWJlcm9mIFBJWEkuZXh0cmFzXG4gKiBAcGFyYW0gdGV4dCB7c3RyaW5nfSBUaGUgY29weSB0aGF0IHlvdSB3b3VsZCBsaWtlIHRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAqIEBwYXJhbSBbc3R5bGVdIHtvYmplY3R9IFRoZSBzdHlsZSBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gW3N0eWxlLmZvbnRdIHtzdHJpbmd9IGRlZmF1bHQgJ2JvbGQgMjBweCBBcmlhbCcgVGhlIHN0eWxlIGFuZCBzaXplIG9mIHRoZSBmb250XG4gKiBAcGFyYW0gW3N0eWxlLmZpbGw9J2JsYWNrJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgZS5nICdyZWQnLCAnIzAwRkYwMCcsXG4gKiAgICAgIG9yIG9iamVjdCBmb3IgZ3JhZGllbnRzICd7dmVydGljYWw6IGZhbHNlLCBzdG9wcyA6IFt7c3RvcDogMCAsIGNvbG9yOiAnIzAwMCd9LCB7c3RvcDogMSwgY29sb3I6ICcjRkZGJ119J1xuICogQHBhcmFtIFtzdHlsZS5hbGlnbj0nbGVmdCddIHtzdHJpbmd9IEFsaWdubWVudCBmb3IgbXVsdGlsaW5lIHRleHQgKCdsZWZ0JywgJ2NlbnRlcicgb3IgJ3JpZ2h0JyksIGRvZXMgbm90IGFmZmVjdCBzaW5nbGUgbGluZSB0ZXh0XG4gKiBAcGFyYW0gW3N0eWxlLnN0cm9rZV0ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgc3Ryb2tlLCBzZWUgJ2ZpbGwnIGZvciBkZXRhaWxzXG4gKiBAcGFyYW0gW3N0eWxlLnN0cm9rZVRoaWNrbmVzcz0wXSB7bnVtYmVyfSBBIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHRoaWNrbmVzcyBvZiB0aGUgc3Ryb2tlLiBEZWZhdWx0IGlzIDAgKG5vIHN0cm9rZSlcbiAqIEBwYXJhbSBbc3R5bGUud29yZFdyYXA9ZmFsc2VdIHtib29sZWFufSBJbmRpY2F0ZXMgaWYgd29yZCB3cmFwIHNob3VsZCBiZSB1c2VkXG4gKiBAcGFyYW0gW3N0eWxlLndvcmRXcmFwV2lkdGg9MTAwXSB7bnVtYmVyfSBUaGUgd2lkdGggYXQgd2hpY2ggdGV4dCB3aWxsIHdyYXAsIGl0IG5lZWRzIHdvcmRXcmFwIHRvIGJlIHNldCB0byB0cnVlXG4gKiBAcGFyYW0gW3N0eWxlLmxpbmVIZWlnaHRdIHtudW1iZXJ9IFRoZSBsaW5lIGhlaWdodCwgYSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB2ZXJ0aWNhbCBzcGFjZSB0aGF0IGEgbGV0dGVyIHVzZXNcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvdz1mYWxzZV0ge2Jvb2xlYW59IFNldCBhIGRyb3Agc2hhZG93IGZvciB0aGUgdGV4dFxuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93Q29sb3I9JyMwMDAwMDAnXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgZmlsbCBzdHlsZSB0byBiZSB1c2VkIG9uIHRoZSBkcm9wc2hhZG93LCBzZWUgJ2ZpbGwnIGZvciBkZXRhaWxzXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dBbmdsZT1NYXRoLlBJLzRdIHtudW1iZXJ9IFNldCBhIGFuZ2xlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U9NV0ge251bWJlcn0gU2V0IGEgZGlzdGFuY2Ugb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dCbHVyPTBdIHtudW1iZXJ9IEhvdyBtdWNoIGRyb3Agc2hhZG93IHNob3VsZCBiZSBibHVycmVkLCAwIGRpc2FibGVzIGJsdXJcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd1N0cmVuZ3RoPTFdIHtudW1iZXJ9IFNldCB0aGUgb3BhY2l0eSBvZiBkcm9wIHNoYWRvdyB3aGVuIGJsdXJyaW5nXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dTdHJva2U9MV0ge251bWJlcn0gU2V0IHRoZSBzdHJva2Ugd2lkdGggb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLnBhZGRpbmc9MF0ge251bWJlcn0gT2NjYXNpb25hbGx5IHNvbWUgZm9udHMgYXJlIGNyb3BwZWQuIEFkZGluZyBzb21lIHBhZGRpbmcgd2lsbCBwcmV2ZW50IHRoaXMgZnJvbSBoYXBwZW5pbmdcbiAqIEBwYXJhbSBbc3R5bGUudGV4dEJhc2VsaW5lPSdhbHBoYWJldGljJ10ge3N0cmluZ30gVGhlIGJhc2VsaW5lIG9mIHRoZSB0ZXh0IHRoYXQgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gW3N0eWxlLmxpbmVKb2luPSdtaXRlciddIHtzdHJpbmd9IFRoZSBsaW5lSm9pbiBwcm9wZXJ0eSBzZXRzIHRoZSB0eXBlIG9mIGNvcm5lciBjcmVhdGVkLCBpdCBjYW4gcmVzb2x2ZVxuICogICAgICBzcGlrZWQgdGV4dCBpc3N1ZXMuIERlZmF1bHQgaXMgJ21pdGVyJyAoY3JlYXRlcyBhIHNoYXJwIGNvcm5lcikuXG4gKiBAcGFyYW0gW3N0eWxlLm1pdGVyTGltaXQ9MTBdIHtudW1iZXJ9IFRoZSBtaXRlciBsaW1pdCB0byB1c2Ugd2hlbiB1c2luZyB0aGUgJ21pdGVyJyBsaW5lSm9pbiBtb2RlLiBUaGlzIGNhbiByZWR1Y2VcbiAqICAgICAgb3IgaW5jcmVhc2UgdGhlIHNwaWtpbmVzcyBvZiByZW5kZXJlZCB0ZXh0LlxuICovXG5mdW5jdGlvbiBDb2Nvb25UZXh0KHRleHQsIHN0eWxlLCByZXNvbHV0aW9uKVxue1xuICAgIC8qKlxuICAgICAqIFRoZSBjYW52YXMgZWxlbWVudCB0aGF0IGV2ZXJ5dGhpbmcgaXMgZHJhd24gdG9cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY2FudmFzID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYW52YXMgMmQgY29udGV4dCB0aGF0IGV2ZXJ5dGhpbmcgaXMgZHJhd24gd2l0aFxuICAgICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcmVzb2x1dGlvbiBvZiB0aGUgY2FudmFzLlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnJlc29sdXRpb24gPSByZXNvbHV0aW9uIHx8IENPTlNULlRFWFRfUkVTT0xVVElPTiB8fCBQSVhJLlJFU09MVVRJT047XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBjdXJyZW50IHRleHQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgdHJhY2tlciBmb3IgdGhlIGN1cnJlbnQgc3R5bGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtvYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9zdHlsZSA9IG51bGw7XG5cbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0ICsgSlNPTi5zdHJpbmdpZnkoc3R5bGUpICsgdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdmFyIGJhc2VUZXh0dXJlID0gUElYSS51dGlscy5CYXNlVGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF07XG5cbiAgICBpZiAodHlwZW9mIGJhc2VUZXh0dXJlID09PSAndW5kZWZpbmVkJylcbiAgICB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHRoaXMuY2FudmFzLl9waXhpSWQgPSB0aGlzLl9waXhpSWQ7XG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gYmFzZVRleHR1cmUuc291cmNlO1xuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdmFyIHRleHR1cmUgPSBQSVhJLlRleHR1cmUuZnJvbUNhbnZhcyh0aGlzLmNhbnZhcyk7XG4gICAgdGV4dHVyZS50cmltID0gbmV3IFBJWEkuUmVjdGFuZ2xlKCk7XG4gICAgUElYSS5TcHJpdGUuY2FsbCh0aGlzLCB0ZXh0dXJlKTtcblxuICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgdGhpcy5zdHlsZSA9IHN0eWxlO1xuXG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSBmYWxzZTtcbn1cblxuLy8gY29uc3RydWN0b3JcbkNvY29vblRleHQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQSVhJLlNwcml0ZS5wcm90b3R5cGUpO1xuQ29jb29uVGV4dC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb2Nvb25UZXh0O1xubW9kdWxlLmV4cG9ydHMgPSBDb2Nvb25UZXh0O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhDb2Nvb25UZXh0LnByb3RvdHlwZSwge1xuICAgIC8qKlxuICAgICAqIFRoZSB3aWR0aCBvZiB0aGUgQ29jb29uVGV4dCwgc2V0dGluZyB0aGlzIHdpbGwgYWN0dWFsbHkgbW9kaWZ5IHRoZSBzY2FsZSB0byBhY2hpZXZlIHRoZSB2YWx1ZSBzZXRcbiAgICAgKlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKiBAbWVtYmVyb2YgQ29jb29uVGV4dCNcbiAgICAgKi9cbiAgICB3aWR0aDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRpcnR5KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zY2FsZS54ICogdGhpcy5fdGV4dHVyZS5fZnJhbWUud2lkdGg7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNjYWxlLnggPSB2YWx1ZSAvIHRoaXMuX3RleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgICAgICAgICAgdGhpcy5fd2lkdGggPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUaGUgaGVpZ2h0IG9mIHRoZSBDb2Nvb25UZXh0LCBzZXR0aW5nIHRoaXMgd2lsbCBhY3R1YWxseSBtb2RpZnkgdGhlIHNjYWxlIHRvIGFjaGlldmUgdGhlIHZhbHVlIHNldFxuICAgICAqXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIGhlaWdodDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRpcnR5KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gIHRoaXMuc2NhbGUueSAqIHRoaXMuX3RleHR1cmUuX2ZyYW1lLmhlaWdodDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUueSA9IHZhbHVlIC8gdGhpcy5fdGV4dHVyZS5fZnJhbWUuaGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5faGVpZ2h0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzdHlsZSBvZiB0aGUgdGV4dFxuICAgICAqXG4gICAgICogQHBhcmFtIFt2YWx1ZV0ge29iamVjdH0gVGhlIHN0eWxlIHBhcmFtZXRlcnNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmZvbnQ9J2JvbGQgMjBwdCBBcmlhbCddIHtzdHJpbmd9IFRoZSBzdHlsZSBhbmQgc2l6ZSBvZiB0aGUgZm9udFxuICAgICAqIEBwYXJhbSBbdmFsdWUuZmlsbD0nYmxhY2snXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBlLmcgJ3JlZCcsICcjMDBGRjAwJyxcbiAgICAgKiAgICAgIG9yIG9iamVjdCBmb3IgZ3JhZGllbnRzICd7dmVydGljYWw6IGZhbHNlLCBzdG9wcyA6IFt7c3RvcDogMCAsIGNvbG9yOiAnIzAwMCd9LCB7c3RvcDogMSwgY29sb3I6ICcjRkZGJ119J1xuICAgICAqIEBwYXJhbSBbdmFsdWUuYWxpZ249J2xlZnQnXSB7c3RyaW5nfSBBbGlnbm1lbnQgZm9yIG11bHRpbGluZSB0ZXh0ICgnbGVmdCcsICdjZW50ZXInIG9yICdyaWdodCcpLCBkb2VzIG5vdCBhZmZlY3Qgc2luZ2xlIGxpbmUgdGV4dFxuICAgICAqIEBwYXJhbSBbdmFsdWUuc3Ryb2tlPSdibGFjayddIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IHN0cm9rZSwgc2VlICdmaWxsJyBmb3IgZGV0YWlsc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuc3Ryb2tlVGhpY2tuZXNzPTBdIHtudW1iZXJ9IEEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdGhpY2tuZXNzIG9mIHRoZSBzdHJva2UuIERlZmF1bHQgaXMgMCAobm8gc3Ryb2tlKVxuICAgICAqIEBwYXJhbSBbdmFsdWUud29yZFdyYXA9ZmFsc2VdIHtib29sZWFufSBJbmRpY2F0ZXMgaWYgd29yZCB3cmFwIHNob3VsZCBiZSB1c2VkXG4gICAgICogQHBhcmFtIFt2YWx1ZS53b3JkV3JhcFdpZHRoPTEwMF0ge251bWJlcn0gVGhlIHdpZHRoIGF0IHdoaWNoIHRleHQgd2lsbCB3cmFwXG4gICAgICogQHBhcmFtIFt2YWx1ZS5saW5lSGVpZ2h0XSB7bnVtYmVyfSBUaGUgbGluZSBoZWlnaHQsIGEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdmVydGljYWwgc3BhY2UgdGhhdCBhIGxldHRlciB1c2VzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93PWZhbHNlXSB7Ym9vbGVhbn0gU2V0IGEgZHJvcCBzaGFkb3cgZm9yIHRoZSB0ZXh0XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93Q29sb3I9JyMwMDAwMDAnXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgZmlsbCBzdHlsZSB0byBiZSB1c2VkIG9uIHRoZSBkcm9wc2hhZG93LCBzZWUgJ2ZpbGwnIGZvciBkZXRhaWxzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93QW5nbGU9TWF0aC5QSS82XSB7bnVtYmVyfSBTZXQgYSBhbmdsZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dEaXN0YW5jZT01XSB7bnVtYmVyfSBTZXQgYSBkaXN0YW5jZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dCbHVyPTBdIHtudW1iZXJ9IEhvdyBtdWNoIGRyb3Agc2hhZG93IHNob3VsZCBiZSBibHVycmVkLCAwIGRpc2FibGVzIGJsdXJcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dTdHJlbmd0aD0xXSB7bnVtYmVyfSBTZXQgdGhlIG9wYWNpdHkgb2YgZHJvcCBzaGFkb3cgd2hlbiBibHVycmluZ1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd1N0cm9rZT0wXSB7bnVtYmVyfSBTZXQgdGhlIHN0cm9rZSB3aWR0aCBvZiBkcm9wIHNoYWRvd1xuICAgICAqIEBwYXJhbSBbdmFsdWUucGFkZGluZz0wXSB7bnVtYmVyfSBPY2Nhc2lvbmFsbHkgc29tZSBmb250cyBhcmUgY3JvcHBlZC4gQWRkaW5nIHNvbWUgcGFkZGluZyB3aWxsIHByZXZlbnQgdGhpcyBmcm9tIGhhcHBlbmluZ1xuICAgICAqIEBwYXJhbSBbdmFsdWUudGV4dEJhc2VsaW5lPSdhbHBoYWJldGljJ10ge3N0cmluZ30gVGhlIGJhc2VsaW5lIG9mIHRoZSB0ZXh0IHRoYXQgaXMgcmVuZGVyZWQuXG4gICAgICogQHBhcmFtIFt2YWx1ZS5saW5lSm9pbj0nbWl0ZXInXSB7c3RyaW5nfSBUaGUgbGluZUpvaW4gcHJvcGVydHkgc2V0cyB0aGUgdHlwZSBvZiBjb3JuZXIgY3JlYXRlZCwgaXQgY2FuIHJlc29sdmVcbiAgICAgKiAgICAgIHNwaWtlZCB0ZXh0IGlzc3Vlcy4gRGVmYXVsdCBpcyAnbWl0ZXInIChjcmVhdGVzIGEgc2hhcnAgY29ybmVyKS5cbiAgICAgKiBAcGFyYW0gW3ZhbHVlLm1pdGVyTGltaXQ9MTBdIHtudW1iZXJ9IFRoZSBtaXRlciBsaW1pdCB0byB1c2Ugd2hlbiB1c2luZyB0aGUgJ21pdGVyJyBsaW5lSm9pbiBtb2RlLiBUaGlzIGNhbiByZWR1Y2VcbiAgICAgKiAgICAgIG9yIGluY3JlYXNlIHRoZSBzcGlraW5lc3Mgb2YgcmVuZGVyZWQgdGV4dC5cbiAgICAgKiBAbWVtYmVyb2YgQ29jb29uVGV4dCNcbiAgICAgKi9cbiAgICBzdHlsZToge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zdHlsZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpXG4gICAgICAgIHtcblxuICAgICAgICAgICAgdmFyIG9sZFN0eWxlID0gdGhpcy5fc3R5bGU7XG5cbiAgICAgICAgICAgIHZhciBzdHlsZSA9IHN0eWxlIHx8IHt9O1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUElYSS5UZXh0U3R5bGUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3R5bGUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdHlsZSA9IG5ldyBQSVhJLlRleHRTdHlsZShzdHlsZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvbGRTdHlsZSAhPT0gdGhpcy5fc3R5bGUgfHwgdGhpcy5fc3R5bGUuc3R5bGVJRCAhPT0gdGhpcy5fc3R5bGVJRCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0eWxlSUQgPSB0aGlzLl9zdHlsZS5zdHlsZUlEO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0eWxlICE9PSBudWxsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmVwYXJlVXBkYXRlVGV4dCh0aGlzLl90ZXh0LHRoaXMuX3N0eWxlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGNvcHkgZm9yIHRoZSB0ZXh0IG9iamVjdC4gVG8gc3BsaXQgYSBsaW5lIHlvdSBjYW4gdXNlICdcXG4nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQge3N0cmluZ30gVGhlIGNvcHkgdGhhdCB5b3Ugd291bGQgbGlrZSB0aGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgdGV4dDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpe1xuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9TdHJpbmcoKSB8fCAnICc7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCA9PT0gdGV4dClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRleHQsIHRoaXMuX3N0eWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3RleHQgPSB0ZXh0O1xuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnByZXBhcmVVcGRhdGVUZXh0ID0gZnVuY3Rpb24gKHRleHQsc3R5bGUpXG57XG4gICAgdGhpcy5fcGl4aUlkID0gdGV4dCArIEpTT04uc3RyaW5naWZ5KHN0eWxlKSArIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IHRydWU7XG59O1xuXG52YXIgdGV4dHVyZUNhY2hlID0ge307XG5cbi8qKlxuICogUHJlcGFyZSB0aGUgY2FudmFzIGZvciBhbiB1cGRhdGUgYW5kIHRyeSB0byBnZXQgYSBjYWNoZWQgdGV4dCBmaXJzdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5zd2l0Y2hDYW52YXMgPSBmdW5jdGlvbiAoKVxue1xuICAgIHZhciBiYXNlVGV4dHVyZSA9IFBJWEkudXRpbHMuQmFzZVRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuICAgIHZhciB0ZXh0dXJlO1xuICAgIGlmIChiYXNlVGV4dHVyZSlcbiAgICB7XG4gICAgICAgIC8vdGhlcmUgaXMgYSBjYWNoZWQgdGV4dCBmb3IgdGhlc2UgcGFyYW1ldGVyc1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGJhc2VUZXh0dXJlLnNvdXJjZTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0ZXh0dXJlQ2FjaGVbdGhpcy5fcGl4aUlkXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRleHR1cmUgPSB0ZXh0dXJlQ2FjaGVbdGhpcy5fcGl4aUlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHR1cmUgPSBQSVhJLlRleHR1cmUuZnJvbUNhbnZhcyh0aGlzLmNhbnZhcyk7XG4gICAgICAgICAgICB0ZXh0dXJlLnRyaW0gPSBuZXcgUElYSS5SZWN0YW5nbGUoKTtcbiAgICAgICAgICAgIHRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdID0gdGV4dHVyZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuXG4gICAgICAgIHRleHR1cmUgPSBQSVhJLlRleHR1cmUuZnJvbUNhbnZhcyh0aGlzLmNhbnZhcyk7XG4gICAgICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgICAgICB0ZXh0dXJlQ2FjaGVbdGhpcy5fcGl4aUlkXSA9IHRleHR1cmU7XG5cbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy50ZXh0dXJlID0gdGV4dHVyZTtcbiAgICB0aGlzLl90ZXh0dXJlID0gdGV4dHVyZTtcbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRleHQgYW5kIHVwZGF0ZXMgaXQgd2hlbiBuZWVkZWRcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS51cGRhdGVUZXh0ID0gZnVuY3Rpb24gKClcbntcbiAgICBpZiAodGhpcy5zd2l0Y2hOZWVkZWQpXG4gICAge1xuICAgICAgICB0aGlzLnN3aXRjaENhbnZhcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdmFyIHN0eWxlID0gdGhpcy5fc3R5bGU7XG4gICAgICAgIHZhciBmb250U2l6ZVN0cmluZyA9ICh0eXBlb2Ygc3R5bGUuZm9udFNpemUgPT09ICdudW1iZXInKSA/IHN0eWxlLmZvbnRTaXplICogdGhpcy5yZXNvbHV0aW9uICsgJ3B4JyA6IHN0eWxlLmZvbnRTaXplO1xuICAgICAgICB2YXIgZm9udFN0eWxlID0gc3R5bGUuZm9udFN0eWxlICsgJyAnICsgc3R5bGUuZm9udFZhcmlhbnQgKyAnICcgKyBzdHlsZS5mb250V2VpZ2h0ICsgJyAnICsgZm9udFNpemVTdHJpbmcgKyAnICcgKyBzdHlsZS5mb250RmFtaWx5O1xuICAgICAgICB0aGlzLmNvbnRleHQuZm9udCA9IGZvbnRTdHlsZTtcblxuICAgICAgICAvLyB3b3JkIHdyYXBcbiAgICAgICAgLy8gcHJlc2VydmUgb3JpZ2luYWwgdGV4dFxuICAgICAgICB2YXIgb3V0cHV0VGV4dCA9IHN0eWxlLndvcmRXcmFwID8gdGhpcy53b3JkV3JhcCh0aGlzLl90ZXh0KSA6IHRoaXMuX3RleHQ7XG5cbiAgICAgICAgLy8gc3BsaXQgdGV4dCBpbnRvIGxpbmVzXG4gICAgICAgIHZhciBsaW5lcyA9IG91dHB1dFRleHQuc3BsaXQoLyg/OlxcclxcbnxcXHJ8XFxuKS8pO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0ZXh0IHdpZHRoXG4gICAgICAgIHZhciBsaW5lV2lkdGhzID0gbmV3IEFycmF5KGxpbmVzLmxlbmd0aCk7XG4gICAgICAgIHZhciBtYXhMaW5lV2lkdGggPSAwO1xuICAgICAgICB2YXIgZm9udFByb3BlcnRpZXMgPSB0aGlzLmRldGVybWluZUZvbnRQcm9wZXJ0aWVzKHN0eWxlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGxpbmVXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChsaW5lc1tpXSkud2lkdGg7XG4gICAgICAgICAgICBsaW5lV2lkdGhzW2ldID0gbGluZVdpZHRoO1xuICAgICAgICAgICAgbWF4TGluZVdpZHRoID0gTWF0aC5tYXgobWF4TGluZVdpZHRoLCBsaW5lV2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZHRoID0gbWF4TGluZVdpZHRoICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICogdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgd2lkdGggKz0gc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlICogdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAoIHdpZHRoICsgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCApO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0ZXh0IGhlaWdodFxuICAgICAgICB2YXIgbGluZUhlaWdodCA9IHRoaXMuc3R5bGUubGluZUhlaWdodCAgKiB0aGlzLnJlc29sdXRpb24gfHwgZm9udFByb3BlcnRpZXMuZm9udFNpemUgKyBzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb247XG5cbiAgICAgICAgdmFyIGhlaWdodCA9IGxpbmVIZWlnaHQgKiBsaW5lcy5sZW5ndGg7XG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICBoZWlnaHQgKz0gc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlICogdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gKCBoZWlnaHQgKyBzdHlsZS5wYWRkaW5nICogMiAqIHRoaXMucmVzb2x1dGlvbiApO1xuXG4gICAgICAgIGlmIChuYXZpZ2F0b3IuaXNDb2Nvb25KUylcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvbnRTaXplU3RyaW5nID0gKHR5cGVvZiBzdHlsZS5mb250U2l6ZSA9PT0gJ251bWJlcicpID8gc3R5bGUuZm9udFNpemUgKiB0aGlzLnJlc29sdXRpb24gKyAncHgnIDogc3R5bGUuZm9udFNpemU7XG4gICAgICAgIGZvbnRTdHlsZSA9IHN0eWxlLmZvbnRTdHlsZSArICcgJyArIHN0eWxlLmZvbnRWYXJpYW50ICsgJyAnICsgc3R5bGUuZm9udFdlaWdodCArICcgJyArIGZvbnRTaXplU3RyaW5nICsgJyAnICsgc3R5bGUuZm9udEZhbWlseTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZm9udCA9IGZvbnRTdHlsZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnRleHRCYXNlbGluZSA9IHN0eWxlLnRleHRCYXNlbGluZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVKb2luID0gc3R5bGUubGluZUpvaW47XG4gICAgICAgIHRoaXMuY29udGV4dC5taXRlckxpbWl0ID0gc3R5bGUubWl0ZXJMaW1pdDtcblxuICAgICAgICB2YXIgbGluZVBvc2l0aW9uWDtcbiAgICAgICAgdmFyIGxpbmVQb3NpdGlvblk7XG5cbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBkcm9wU2hhZG93Q29sb3IgPSBzdHlsZS5kcm9wU2hhZG93Q29sb3I7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRyb3BTaGFkb3dDb2xvciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93Q29sb3IgPSB0aGlzLmdyYWRpZW50RmlsbChcbiAgICAgICAgICAgICAgICAgICAgZHJvcFNoYWRvd0NvbG9yLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgbGluZUhlaWdodCArIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAqIHRoaXMucmVzb2x1dGlvbiArIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSAqIHRoaXMucmVzb2x1dGlvblxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB4U2hhZG93T2Zmc2V0ID0gTWF0aC5jb3Moc3R5bGUuZHJvcFNoYWRvd0FuZ2xlKSAqIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZTtcbiAgICAgICAgICAgIHZhciB5U2hhZG93T2Zmc2V0ID0gTWF0aC5zaW4oc3R5bGUuZHJvcFNoYWRvd0FuZ2xlKSAqIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZTtcblxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNoYWRvd0NvbG9yID0gZHJvcFNoYWRvd0NvbG9yO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNoYWRvd09mZnNldFggPSB4U2hhZG93T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNoYWRvd09mZnNldFkgPSB5U2hhZG93T2Zmc2V0O1xuXG4gICAgICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvd0JsdXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Qmx1ciA9IHN0eWxlLmRyb3BTaGFkb3dCbHVyICogdGhpcy5yZXNvbHV0aW9uICogMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNoYWRvd0NvbG9yID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0cm9rZSA9IHN0eWxlLnN0cm9rZTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHJva2UgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBzdHJva2UgPSB0aGlzLmdyYWRpZW50RmlsbChzdHJva2UsIHdpZHRoLCBsaW5lSGVpZ2h0ICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICogdGhpcy5yZXNvbHV0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHN0cm9rZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAqIHRoaXMucmVzb2x1dGlvbjtcblxuXG4gICAgICAgIHZhciBmaWxsID0gc3R5bGUuZmlsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBmaWxsID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZmlsbCA9IHRoaXMuZ3JhZGllbnRGaWxsKFxuICAgICAgICAgICAgICAgIGZpbGwsXG4gICAgICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICAgICAgbGluZUhlaWdodCxcbiAgICAgICAgICAgICAgICBzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb24gKyBzdHlsZS5wYWRkaW5nICogdGhpcy5yZXNvbHV0aW9uXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9zZXQgY2FudmFzIHRleHQgc3R5bGVzXG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBmaWxsO1xuXG4gICAgICAgIC8vZHJhdyBsaW5lcyBsaW5lIGJ5IGxpbmVcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBsaW5lUG9zaXRpb25YID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICogdGhpcy5yZXNvbHV0aW9uIC8gMjtcbiAgICAgICAgICAgIGxpbmVQb3NpdGlvblkgPSAoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICogdGhpcy5yZXNvbHV0aW9uIC8gMiArIGkgKiBsaW5lSGVpZ2h0KSArIGZvbnRQcm9wZXJ0aWVzLmFzY2VudDtcblxuICAgICAgICAgICAgaWYgKHN0eWxlLmFsaWduID09PSAncmlnaHQnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gbWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlLmFsaWduID09PSAnY2VudGVyJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YICs9IChtYXhMaW5lV2lkdGggLSBsaW5lV2lkdGhzW2ldKSAvIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5zdHJva2UgJiYgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YLCBsaW5lUG9zaXRpb25ZICsgc3R5bGUucGFkZGluZyAqIHRoaXMucmVzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5maWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChsaW5lc1tpXSwgbGluZVBvc2l0aW9uWCwgbGluZVBvc2l0aW9uWSArIHN0eWxlLnBhZGRpbmcgKiB0aGlzLnJlc29sdXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVUZXh0dXJlKCk7XG59O1xuXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5ncmFkaWVudEZpbGwgPSBmdW5jdGlvbiAob3B0aW9ucywgd2lkdGgsIGhlaWdodCwgcGFkZGluZylcbntcbiAgICBwYWRkaW5nID0gcGFkZGluZyB8fCAwO1xuICAgIHdpZHRoID0gd2lkdGggKyBwYWRkaW5nO1xuICAgIGhlaWdodCA9IGhlaWdodCArIHBhZGRpbmc7XG5cbiAgICB2YXIgcGFkZGluZ1gsIHBhZGRpbmdZO1xuICAgIHBhZGRpbmdYID0gcGFkZGluZ1kgPSBwYWRkaW5nO1xuXG4gICAgaWYgKG9wdGlvbnMudmVydGljYWwpIHtcbiAgICAgICAgaGVpZ2h0ID0gMDtcbiAgICAgICAgcGFkZGluZ1kgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZHRoID0gMDtcbiAgICAgICAgcGFkZGluZ1ggPSAwO1xuICAgIH1cblxuICAgIHZhciBncmFkaWVudCA9IHRoaXMuY29udGV4dC5jcmVhdGVMaW5lYXJHcmFkaWVudChwYWRkaW5nWCwgcGFkZGluZ1ksIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgdmFyIGksIGlMZW47XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3RvcHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGlMZW4gPSBvcHRpb25zLnN0b3BzLmxlbmd0aDsgaSA8IGlMZW47IGkrKykge1xuICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKG9wdGlvbnMuc3RvcHNbaV0uc3RvcCwgb3B0aW9ucy5zdG9wc1tpXS5jb2xvcik7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwLCBpTGVuID0gb3B0aW9ucy5zdG9wcy5sZW5ndGg7IGkgPCBpTGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzdG9wID0gaSAvIGlMZW47XG4gICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3Aoc3RvcCwgb3B0aW9ucy5zdG9wc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ3JhZGllbnQ7XG59O1xuXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5ibHVyID0gZnVuY3Rpb24gKGl0ZXJhdGlvbnMsIHN0cmVuZ3RoLCBhbHBoYSkge1xuICAgIHZhciB4ID0gMDtcbiAgICB2YXIgeSA9IDA7XG5cbiAgICAvLyBDb3B5IHRoZSBjdXJyZW50IHBpeGVscyB0byBiZSB1c2VkIGFzIGEgc3RlbmNpbFxuICAgIHZhciBuZXdDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgY29udGV4dCA9IG5ld0NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIG5ld0NhbnZhcy53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoO1xuICAgIG5ld0NhbnZhcy5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQ7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIDAsIDApO1xuXG4gICAgdmFyIG9sZEFscGhhID0gdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhO1xuICAgIHRoaXMuY29udGV4dC5nbG9iYWxBbHBoYSA9IGFscGhhIC8gKGl0ZXJhdGlvbnMgKiA0KTtcbiAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuXG4gICAgLy8gQXBwbHkgYmx1clxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlcmF0aW9ucyAqIDQ7ICsraSkge1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gaSAlIDQ7XG4gICAgICAgIHZhciBvZmZzZXQgPSAoKGkgKyAxKSAvIDQpICogdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAwOiAgLy8gVXAuXG4gICAgICAgICAgICAgICAgeSAtPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMTogIC8vIFJpZ2h0LlxuICAgICAgICAgICAgICAgIHggKz0gb2Zmc2V0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6ICAvLyBEb3duLlxuICAgICAgICAgICAgICAgIHkgKz0gb2Zmc2V0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM6ICAvLyBMZWZ0LlxuICAgICAgICAgICAgICAgIHggLT0gb2Zmc2V0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZShuZXdDYW52YXMsIHgsIHkpO1xuICAgIH1cblxuICAgIHRoaXMuY29udGV4dC5nbG9iYWxBbHBoYSA9IG9sZEFscGhhO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRleHR1cmUgc2l6ZSBiYXNlZCBvbiBjYW52YXMgc2l6ZVxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnVwZGF0ZVRleHR1cmUgPSBmdW5jdGlvbiAoKVxue1xuICAgIHZhciB0ZXh0dXJlID0gdGhpcy5fdGV4dHVyZTtcblxuICAgIGlmICh0aGlzLmNhY2hlRGlydHkpXG4gICAge1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmhhc0xvYWRlZCA9IHRydWU7XG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUucmVzb2x1dGlvbiA9IHRoaXMucmVzb2x1dGlvbjtcblxuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGggLyB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIH1cblxuICAgIHRleHR1cmUub3JpZy53aWR0aCA9IHRleHR1cmUuX2ZyYW1lLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGggLyB0aGlzLnJlc29sdXRpb247XG4gICAgdGV4dHVyZS5vcmlnLmhlaWdodCA9IHRleHR1cmUuX2ZyYW1lLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcblxuICAgIHRleHR1cmUudHJpbS54ID0gMDtcbiAgICB0ZXh0dXJlLnRyaW0ueSA9IDA7IC8vLXRoaXMuX3N0eWxlLnBhZGRpbmcgKiB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0ZXh0dXJlLnRyaW0ud2lkdGggPSB0ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICB0ZXh0dXJlLnRyaW0uaGVpZ2h0ID0gdGV4dHVyZS5fZnJhbWUuaGVpZ2h0Oy8vIC0gdGhpcy5fc3R5bGUucGFkZGluZyAqIDIgKiB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0aGlzLl93aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcblxuICAgIHRoaXMuc2NhbGUueCA9IDE7XG4gICAgdGhpcy5zY2FsZS55ID0gMTtcblxuICAgIGlmICh0aGlzLmNhY2hlRGlydHkpXG4gICAge1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmVtaXQoJ3VwZGF0ZScsICB0ZXh0dXJlLmJhc2VUZXh0dXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGFzY2VudCwgZGVzY2VudCBhbmQgZm9udFNpemUgb2YgYSBnaXZlbiBmb250U3R5bGVcbiAqXG4gKiBAcGFyYW0gZm9udFN0eWxlIHtvYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5kZXRlcm1pbmVGb250UHJvcGVydGllcyA9IGZ1bmN0aW9uIChzdHlsZSlcbntcbiAgICB2YXIgZm9udFNpemVTdHJpbmcgPSAodHlwZW9mIHN0eWxlLmZvbnRTaXplID09PSAnbnVtYmVyJykgPyBzdHlsZS5mb250U2l6ZSAqIHRoaXMucmVzb2x1dGlvbiArICdweCcgOiBzdHlsZS5mb250U2l6ZTtcbiAgICB2YXIgZm9udFN0eWxlID0gc3R5bGUuZm9udFN0eWxlICsgJyAnICsgc3R5bGUuZm9udFZhcmlhbnQgKyAnICcgKyBzdHlsZS5mb250V2VpZ2h0ICsgJyAnICsgZm9udFNpemVTdHJpbmcgKyAnICcgKyBzdHlsZS5mb250RmFtaWx5O1xuXG4gICAgdmFyIHByb3BlcnRpZXMgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYWNoZVtmb250U3R5bGVdO1xuXG4gICAgaWYgKCFwcm9wZXJ0aWVzKVxuICAgIHtcbiAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuXG4gICAgICAgIHZhciBjYW52YXMgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYW52YXM7XG4gICAgICAgIHZhciBjb250ZXh0ID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ29udGV4dDtcblxuICAgICAgICBjb250ZXh0LmZvbnQgPSBmb250U3R5bGU7XG5cbiAgICAgICAgdmFyIHdpZHRoID0gTWF0aC5jZWlsKGNvbnRleHQubWVhc3VyZVRleHQoJ3xNw4lxJykud2lkdGgpO1xuICAgICAgICB2YXIgYmFzZWxpbmUgPSBNYXRoLmNlaWwoY29udGV4dC5tZWFzdXJlVGV4dCgnTScpLndpZHRoKTtcbiAgICAgICAgdmFyIGhlaWdodCA9IDIgKiBiYXNlbGluZTtcblxuICAgICAgICAvLyBiYXNlbGluZSBmYWN0b3IgZGVwZW5kcyBhIGxvdCBvZiB0aGUgZm9udC4gdG9kbyA6IGxldCB1c2VyIHNwZWNpZnkgYSBmYWN0b3IgcGVyIGZvbnQgbmFtZSA/XG4gICAgICAgIGJhc2VsaW5lID0gYmFzZWxpbmUgKiAxLjIgfCAwO1xuXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmMDAnO1xuICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICAgIGNvbnRleHQuZm9udCA9IGZvbnRTdHlsZTtcblxuICAgICAgICBjb250ZXh0LnRleHRCYXNlbGluZSA9ICdhbHBoYWJldGljJztcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnIzAwMCc7XG4gICAgICAgIGNvbnRleHQuZmlsbFRleHQoJ3xNw4lxJywgMCwgYmFzZWxpbmUpO1xuXG4gICAgICAgIHZhciBpbWFnZWRhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KS5kYXRhO1xuICAgICAgICB2YXIgcGl4ZWxzID0gaW1hZ2VkYXRhLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpbmUgPSB3aWR0aCAqIDQ7XG5cbiAgICAgICAgdmFyIGksIGo7XG5cbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBzdG9wID0gZmFsc2U7XG5cbiAgICAgICAgLy8gYXNjZW50LiBzY2FuIGZyb20gdG9wIHRvIGJvdHRvbSB1bnRpbCB3ZSBmaW5kIGEgbm9uIHJlZCBwaXhlbFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYmFzZWxpbmU7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxpbmU7IGogKz0gNClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VkYXRhW2lkeCArIGpdICE9PSAyNTUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdG9wKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkeCArPSBsaW5lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvcGVydGllcy5hc2NlbnQgPSBiYXNlbGluZSAtIGk7XG5cbiAgICAgICAgaWR4ID0gcGl4ZWxzIC0gbGluZTtcbiAgICAgICAgc3RvcCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlc2NlbnQuIHNjYW4gZnJvbSBib3R0b20gdG8gdG9wIHVudGlsIHdlIGZpbmQgYSBub24gcmVkIHBpeGVsXG4gICAgICAgIGZvciAoaSA9IGhlaWdodDsgaSA+IGJhc2VsaW5lOyBpLS0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsaW5lOyBqICs9IDQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGltYWdlZGF0YVtpZHggKyBqXSAhPT0gMjU1KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RvcClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZHggLT0gbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BlcnRpZXMuZGVzY2VudCA9IGkgLSBiYXNlbGluZTtcbiAgICAgICAgcHJvcGVydGllcy5mb250U2l6ZSA9IHByb3BlcnRpZXMuYXNjZW50ICsgcHJvcGVydGllcy5kZXNjZW50O1xuXG4gICAgICAgIFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NhY2hlW2ZvbnRTdHlsZV0gPSBwcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIG5ld2xpbmVzIHRvIGEgc3RyaW5nIHRvIGhhdmUgaXQgb3B0aW1hbGx5IGZpdCBpbnRvIHRoZSBob3Jpem9udGFsXG4gKiBib3VuZHMgc2V0IGJ5IHRoZSBUZXh0IG9iamVjdCdzIHdvcmRXcmFwV2lkdGggcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHRleHQge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLndvcmRXcmFwID0gZnVuY3Rpb24gKHRleHQpXG57XG4gICAgLy8gR3JlZWR5IHdyYXBwaW5nIGFsZ29yaXRobSB0aGF0IHdpbGwgd3JhcCB3b3JkcyBhcyB0aGUgbGluZSBncm93cyBsb25nZXJcbiAgICAvLyB0aGFuIGl0cyBob3Jpem9udGFsIGJvdW5kcy5cbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgdmFyIGxpbmVzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gICAgdmFyIHdvcmRXcmFwV2lkdGggPSB0aGlzLl9zdHlsZS53b3JkV3JhcFdpZHRoICogdGhpcy5yZXNvbHV0aW9uO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgICB2YXIgc3BhY2VMZWZ0ID0gd29yZFdyYXBXaWR0aDtcbiAgICAgICAgdmFyIHdvcmRzID0gbGluZXNbaV0uc3BsaXQoJyAnKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB3b3Jkcy5sZW5ndGg7IGorKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHdvcmRXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dCh3b3Jkc1tqXSkud2lkdGg7XG4gICAgICAgICAgICB2YXIgd29yZFdpZHRoV2l0aFNwYWNlID0gd29yZFdpZHRoICsgdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KCcgJykud2lkdGg7XG4gICAgICAgICAgICBpZiAoaiA9PT0gMCB8fCB3b3JkV2lkdGhXaXRoU3BhY2UgPiBzcGFjZUxlZnQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBwcmludGluZyB0aGUgbmV3bGluZSBpZiBpdCdzIHRoZSBmaXJzdCB3b3JkIG9mIHRoZSBsaW5lIHRoYXQgaXNcbiAgICAgICAgICAgICAgICAvLyBncmVhdGVyIHRoYW4gdGhlIHdvcmQgd3JhcCB3aWR0aC5cbiAgICAgICAgICAgICAgICBpZiAoaiA+IDApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB3b3Jkc1tqXTtcbiAgICAgICAgICAgICAgICBzcGFjZUxlZnQgPSB3b3JkV3JhcFdpZHRoIC0gd29yZFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNwYWNlTGVmdCAtPSB3b3JkV2lkdGhXaXRoU3BhY2U7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcgJyArIHdvcmRzW2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPCBsaW5lcy5sZW5ndGgtMSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIG9iamVjdCB1c2luZyB0aGUgV2ViR0wgcmVuZGVyZXJcbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIge1dlYkdMUmVuZGVyZXJ9XG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnJlbmRlcldlYkdMID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgUElYSS5TcHJpdGUucHJvdG90eXBlLnJlbmRlcldlYkdMLmNhbGwodGhpcywgcmVuZGVyZXIpO1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBvYmplY3QgdXNpbmcgdGhlIENhbnZhcyByZW5kZXJlclxuICpcbiAqIEBwYXJhbSByZW5kZXJlciB7Q2FudmFzUmVuZGVyZXJ9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5fcmVuZGVyQ2FudmFzID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgUElYSS5TcHJpdGUucHJvdG90eXBlLl9yZW5kZXJDYW52YXMuY2FsbCh0aGlzLCByZW5kZXJlcik7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiB0aGUgVGV4dCBhcyBhIHJlY3RhbmdsZS4gVGhlIGJvdW5kcyBjYWxjdWxhdGlvbiB0YWtlcyB0aGUgd29ybGRUcmFuc2Zvcm0gaW50byBhY2NvdW50LlxuICpcbiAqIEBwYXJhbSBtYXRyaXgge01hdHJpeH0gdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBvZiB0aGUgVGV4dFxuICogQHJldHVybiB7UmVjdGFuZ2xlfSB0aGUgZnJhbWluZyByZWN0YW5nbGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZ2V0Qm91bmRzID0gZnVuY3Rpb24gKG1hdHJpeClcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIHJldHVybiBQSVhJLlNwcml0ZS5wcm90b3R5cGUuZ2V0Qm91bmRzLmNhbGwodGhpcywgbWF0cml4KTtcbn07XG5cbi8qKlxuICogRGVzdHJveXMgdGhpcyB0ZXh0IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gW2Rlc3Ryb3lCYXNlVGV4dHVyZT10cnVlXSB7Ym9vbGVhbn0gd2hldGhlciB0byBkZXN0cm95IHRoZSBiYXNlIHRleHR1cmUgYXMgd2VsbFxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKGRlc3Ryb3lCYXNlVGV4dHVyZSlcbntcbiAgICAvLyBtYWtlIHN1cmUgdG8gcmVzZXQgdGhlIHRoZSBjb250ZXh0IGFuZCBjYW52YXMuLiBkb250IHdhbnQgdGhpcyBoYW5naW5nIGFyb3VuZCBpbiBtZW1vcnkhXG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICB0aGlzLmNhbnZhcyA9IG51bGw7XG5cbiAgICB0aGlzLl9zdHlsZSA9IG51bGw7XG5cbiAgICB0aGlzLl90ZXh0dXJlLmRlc3Ryb3koZGVzdHJveUJhc2VUZXh0dXJlID09PSB1bmRlZmluZWQgPyB0cnVlIDogZGVzdHJveUJhc2VUZXh0dXJlKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gVEVYVF9SRVNPTFVUSU9OIC0gRGVmYXVsdCByZXNvbHV0aW9uIG9mIGEgbmV3IENvY29vblRleHRcbiAgICAgKiBAY29uc3RhbnRcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgVEVYVF9SRVNPTFVUSU9OOjFcbn07XG4iXX0=
