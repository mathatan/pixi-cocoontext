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

            if (style.strikeThrough)
            {

                var textWidth = this.context.measureText(lines[i]);
                var y = Math.round(linePositionY - lineHeight / 4);

                this.context.fillRect(linePositionX, y, Math.round(textWidth.width), this.resolution);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyIsInNyYy9Db2Nvb25UZXh0VXRpbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6eEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBuYW1lc3BhY2UgUElYSS5jb2Nvb25UZXh0XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUElYSS5jb2Nvb250ZXh0ID0ge1xuICAgIENvY29vblRleHQ6ICAgIHJlcXVpcmUoJy4vQ29jb29uVGV4dCcpLFxuICAgIENPTlNUOiAgICByZXF1aXJlKCcuL0NvY29vblRleHRVdGlsJylcbn07XG4iLCJ2YXIgQ09OU1QgPSByZXF1aXJlKCcuLi9Db2Nvb25UZXh0VXRpbCcpO1xuXG4vKipcbiAqIEEgQ29jb29uVGV4dCBPYmplY3Qgd2lsbCBjcmVhdGUgYSBsaW5lIG9yIG11bHRpcGxlIGxpbmVzIG9mIHRleHQuIFRvIHNwbGl0IGEgbGluZSB5b3UgY2FuIHVzZSAnXFxuJyBpbiB5b3VyIHRleHQgc3RyaW5nLFxuICogb3IgYWRkIGEgd29yZFdyYXAgcHJvcGVydHkgc2V0IHRvIHRydWUgYW5kIGFuZCB3b3JkV3JhcFdpZHRoIHByb3BlcnR5IHdpdGggYSB2YWx1ZSBpbiB0aGUgc3R5bGUgb2JqZWN0LlxuICpcbiAqIE9uY2UgYSBDb2Nvb25UZXh0IGlzIGdlbmVyYXRlZCwgaXQgaXMgc3RvcmVkIGFzIGEgQmFzZVRleHR1cmUgYW5kIHdpbGwgYmUgdXNlZCBpZiBhIG5ldyBUZXh0IGlzXG4gKiBjcmVhdGVkIHdpdGggdGhlIGV4YWN0IHNhbWUgcGFyYW1ldGVycy5cbiAqXG4gKiBBIENvY29vblRleHQgY2FuIGJlIGNyZWF0ZWQgZGlyZWN0bHkgZnJvbSBhIHN0cmluZyBhbmQgYSBzdHlsZSBvYmplY3RcbiAqXG4gKiBgYGBqc1xuICogdmFyIHRleHQgPSBuZXcgUElYSS5leHRyYXMuQ29jb29uVGV4dCgnVGhpcyBpcyBhIENvY29vblRleHQnLHtmb250IDogJzI0cHggQXJpYWwnLCBmaWxsIDogMHhmZjEwMTAsIGFsaWduIDogJ2NlbnRlcid9KTtcbiAqIGBgYFxuICpcbiAqIEBjbGFzc1xuICogQGV4dGVuZHMgU3ByaXRlXG4gKiBAbWVtYmVyb2YgUElYSS5leHRyYXNcbiAqIEBwYXJhbSB0ZXh0IHtzdHJpbmd9IFRoZSBjb3B5IHRoYXQgeW91IHdvdWxkIGxpa2UgdGhlIHRleHQgdG8gZGlzcGxheVxuICogQHBhcmFtIFtzdHlsZV0ge29iamVjdH0gVGhlIHN0eWxlIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBbc3R5bGUuZm9udF0ge3N0cmluZ30gZGVmYXVsdCAnYm9sZCAyMHB4IEFyaWFsJyBUaGUgc3R5bGUgYW5kIHNpemUgb2YgdGhlIGZvbnRcbiAqIEBwYXJhbSBbc3R5bGUuZmlsbD0nYmxhY2snXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBlLmcgJ3JlZCcsICcjMDBGRjAwJyxcbiAqICAgICAgb3Igb2JqZWN0IGZvciBncmFkaWVudHMgJ3t2ZXJ0aWNhbDogZmFsc2UsIHN0b3BzIDogW3tzdG9wOiAwICwgY29sb3I6ICcjMDAwJ30sIHtzdG9wOiAxLCBjb2xvcjogJyNGRkYnXX0nXG4gKiBAcGFyYW0gW3N0eWxlLmFsaWduPSdsZWZ0J10ge3N0cmluZ30gQWxpZ25tZW50IGZvciBtdWx0aWxpbmUgdGV4dCAoJ2xlZnQnLCAnY2VudGVyJyBvciAncmlnaHQnKSwgZG9lcyBub3QgYWZmZWN0IHNpbmdsZSBsaW5lIHRleHRcbiAqIEBwYXJhbSBbc3R5bGUuc3Ryb2tlXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBzdHJva2UsIHNlZSAnZmlsbCcgZm9yIGRldGFpbHNcbiAqIEBwYXJhbSBbc3R5bGUuc3Ryb2tlVGhpY2tuZXNzPTBdIHtudW1iZXJ9IEEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdGhpY2tuZXNzIG9mIHRoZSBzdHJva2UuIERlZmF1bHQgaXMgMCAobm8gc3Ryb2tlKVxuICogQHBhcmFtIFtzdHlsZS53b3JkV3JhcD1mYWxzZV0ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB3b3JkIHdyYXAgc2hvdWxkIGJlIHVzZWRcbiAqIEBwYXJhbSBbc3R5bGUud29yZFdyYXBXaWR0aD0xMDBdIHtudW1iZXJ9IFRoZSB3aWR0aCBhdCB3aGljaCB0ZXh0IHdpbGwgd3JhcCwgaXQgbmVlZHMgd29yZFdyYXAgdG8gYmUgc2V0IHRvIHRydWVcbiAqIEBwYXJhbSBbc3R5bGUubGluZUhlaWdodF0ge251bWJlcn0gVGhlIGxpbmUgaGVpZ2h0LCBhIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHZlcnRpY2FsIHNwYWNlIHRoYXQgYSBsZXR0ZXIgdXNlc1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93PWZhbHNlXSB7Ym9vbGVhbn0gU2V0IGEgZHJvcCBzaGFkb3cgZm9yIHRoZSB0ZXh0XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dDb2xvcj0nIzAwMDAwMCddIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBmaWxsIHN0eWxlIHRvIGJlIHVzZWQgb24gdGhlIGRyb3BzaGFkb3csIHNlZSAnZmlsbCcgZm9yIGRldGFpbHNcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0FuZ2xlPU1hdGguUEkvNF0ge251bWJlcn0gU2V0IGEgYW5nbGUgb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZT01XSB7bnVtYmVyfSBTZXQgYSBkaXN0YW5jZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0JsdXI9MF0ge251bWJlcn0gSG93IG11Y2ggZHJvcCBzaGFkb3cgc2hvdWxkIGJlIGJsdXJyZWQsIDAgZGlzYWJsZXMgYmx1clxuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93U3RyZW5ndGg9MV0ge251bWJlcn0gU2V0IHRoZSBvcGFjaXR5IG9mIGRyb3Agc2hhZG93IHdoZW4gYmx1cnJpbmdcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd1N0cm9rZT0xXSB7bnVtYmVyfSBTZXQgdGhlIHN0cm9rZSB3aWR0aCBvZiB0aGUgZHJvcCBzaGFkb3dcbiAqIEBwYXJhbSBbc3R5bGUucGFkZGluZz0wXSB7bnVtYmVyfSBPY2Nhc2lvbmFsbHkgc29tZSBmb250cyBhcmUgY3JvcHBlZC4gQWRkaW5nIHNvbWUgcGFkZGluZyB3aWxsIHByZXZlbnQgdGhpcyBmcm9tIGhhcHBlbmluZ1xuICogQHBhcmFtIFtzdHlsZS50ZXh0QmFzZWxpbmU9J2FscGhhYmV0aWMnXSB7c3RyaW5nfSBUaGUgYmFzZWxpbmUgb2YgdGhlIHRleHQgdGhhdCBpcyByZW5kZXJlZC5cbiAqIEBwYXJhbSBbc3R5bGUubGluZUpvaW49J21pdGVyJ10ge3N0cmluZ30gVGhlIGxpbmVKb2luIHByb3BlcnR5IHNldHMgdGhlIHR5cGUgb2YgY29ybmVyIGNyZWF0ZWQsIGl0IGNhbiByZXNvbHZlXG4gKiAgICAgIHNwaWtlZCB0ZXh0IGlzc3Vlcy4gRGVmYXVsdCBpcyAnbWl0ZXInIChjcmVhdGVzIGEgc2hhcnAgY29ybmVyKS5cbiAqIEBwYXJhbSBbc3R5bGUubWl0ZXJMaW1pdD0xMF0ge251bWJlcn0gVGhlIG1pdGVyIGxpbWl0IHRvIHVzZSB3aGVuIHVzaW5nIHRoZSAnbWl0ZXInIGxpbmVKb2luIG1vZGUuIFRoaXMgY2FuIHJlZHVjZVxuICogICAgICBvciBpbmNyZWFzZSB0aGUgc3Bpa2luZXNzIG9mIHJlbmRlcmVkIHRleHQuXG4gKi9cbmZ1bmN0aW9uIENvY29vblRleHQodGV4dCwgc3R5bGUsIHJlc29sdXRpb24pXG57XG4gICAgLyoqXG4gICAgICogVGhlIGNhbnZhcyBlbGVtZW50IHRoYXQgZXZlcnl0aGluZyBpcyBkcmF3biB0b1xuICAgICAqXG4gICAgICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5jYW52YXMgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGNhbnZhcyAyZCBjb250ZXh0IHRoYXQgZXZlcnl0aGluZyBpcyBkcmF3biB3aXRoXG4gICAgICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSByZXNvbHV0aW9uIG9mIHRoZSBjYW52YXMuXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucmVzb2x1dGlvbiA9IHJlc29sdXRpb24gfHwgQ09OU1QuVEVYVF9SRVNPTFVUSU9OIHx8IFBJWEkuUkVTT0xVVElPTjtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgdHJhY2tlciBmb3IgdGhlIGN1cnJlbnQgdGV4dC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX3RleHQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSB0cmFja2VyIGZvciB0aGUgY3VycmVudCBzdHlsZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge29iamVjdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX3N0eWxlID0gbnVsbDtcblxuICAgIHRoaXMuX3BpeGlJZCA9IHRleHQgKyBKU09OLnN0cmluZ2lmeShzdHlsZSkgKyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB2YXIgYmFzZVRleHR1cmUgPSBQSVhJLnV0aWxzLkJhc2VUZXh0dXJlQ2FjaGVbdGhpcy5fcGl4aUlkXTtcblxuICAgIGlmICh0eXBlb2YgYmFzZVRleHR1cmUgPT09ICd1bmRlZmluZWQnKVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5jYW52YXMuX3BpeGlJZCA9IHRoaXMuX3BpeGlJZDtcbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBiYXNlVGV4dHVyZS5zb3VyY2U7XG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB2YXIgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICB0ZXh0dXJlLnRyaW0gPSBuZXcgUElYSS5SZWN0YW5nbGUoKTtcbiAgICBQSVhJLlNwcml0ZS5jYWxsKHRoaXMsIHRleHR1cmUpO1xuXG4gICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgICB0aGlzLnN0eWxlID0gc3R5bGU7XG5cbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IGZhbHNlO1xufVxuXG4vLyBjb25zdHJ1Y3RvclxuQ29jb29uVGV4dC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBJWEkuU3ByaXRlLnByb3RvdHlwZSk7XG5Db2Nvb25UZXh0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvY29vblRleHQ7XG5tb2R1bGUuZXhwb3J0cyA9IENvY29vblRleHQ7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKENvY29vblRleHQucHJvdG90eXBlLCB7XG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIG9mIHRoZSBDb2Nvb25UZXh0LCBzZXR0aW5nIHRoaXMgd2lsbCBhY3R1YWxseSBtb2RpZnkgdGhlIHNjYWxlIHRvIGFjaGlldmUgdGhlIHZhbHVlIHNldFxuICAgICAqXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHdpZHRoOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjYWxlLnggKiB0aGlzLl90ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUueCA9IHZhbHVlIC8gdGhpcy5fdGV4dHVyZS5fZnJhbWUud2lkdGg7XG4gICAgICAgICAgICB0aGlzLl93aWR0aCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgb2YgdGhlIENvY29vblRleHQsIHNldHRpbmcgdGhpcyB3aWxsIGFjdHVhbGx5IG1vZGlmeSB0aGUgc2NhbGUgdG8gYWNoaWV2ZSB0aGUgdmFsdWUgc2V0XG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgaGVpZ2h0OiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAgdGhpcy5zY2FsZS55ICogdGhpcy5fdGV4dHVyZS5fZnJhbWUuaGVpZ2h0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS55ID0gdmFsdWUgLyB0aGlzLl90ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9oZWlnaHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHN0eWxlIG9mIHRoZSB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0gW3ZhbHVlXSB7b2JqZWN0fSBUaGUgc3R5bGUgcGFyYW1ldGVyc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZm9udD0nYm9sZCAyMHB0IEFyaWFsJ10ge3N0cmluZ30gVGhlIHN0eWxlIGFuZCBzaXplIG9mIHRoZSBmb250XG4gICAgICogQHBhcmFtIFt2YWx1ZS5maWxsPSdibGFjayddIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IGUuZyAncmVkJywgJyMwMEZGMDAnLFxuICAgICAqICAgICAgb3Igb2JqZWN0IGZvciBncmFkaWVudHMgJ3t2ZXJ0aWNhbDogZmFsc2UsIHN0b3BzIDogW3tzdG9wOiAwICwgY29sb3I6ICcjMDAwJ30sIHtzdG9wOiAxLCBjb2xvcjogJyNGRkYnXX0nXG4gICAgICogQHBhcmFtIFt2YWx1ZS5hbGlnbj0nbGVmdCddIHtzdHJpbmd9IEFsaWdubWVudCBmb3IgbXVsdGlsaW5lIHRleHQgKCdsZWZ0JywgJ2NlbnRlcicgb3IgJ3JpZ2h0JyksIGRvZXMgbm90IGFmZmVjdCBzaW5nbGUgbGluZSB0ZXh0XG4gICAgICogQHBhcmFtIFt2YWx1ZS5zdHJva2U9J2JsYWNrJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgc3Ryb2tlLCBzZWUgJ2ZpbGwnIGZvciBkZXRhaWxzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5zdHJva2VUaGlja25lc3M9MF0ge251bWJlcn0gQSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB0aGlja25lc3Mgb2YgdGhlIHN0cm9rZS4gRGVmYXVsdCBpcyAwIChubyBzdHJva2UpXG4gICAgICogQHBhcmFtIFt2YWx1ZS53b3JkV3JhcD1mYWxzZV0ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB3b3JkIHdyYXAgc2hvdWxkIGJlIHVzZWRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLndvcmRXcmFwV2lkdGg9MTAwXSB7bnVtYmVyfSBUaGUgd2lkdGggYXQgd2hpY2ggdGV4dCB3aWxsIHdyYXBcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmxpbmVIZWlnaHRdIHtudW1iZXJ9IFRoZSBsaW5lIGhlaWdodCwgYSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB2ZXJ0aWNhbCBzcGFjZSB0aGF0IGEgbGV0dGVyIHVzZXNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3c9ZmFsc2VdIHtib29sZWFufSBTZXQgYSBkcm9wIHNoYWRvdyBmb3IgdGhlIHRleHRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dDb2xvcj0nIzAwMDAwMCddIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBmaWxsIHN0eWxlIHRvIGJlIHVzZWQgb24gdGhlIGRyb3BzaGFkb3csIHNlZSAnZmlsbCcgZm9yIGRldGFpbHNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dBbmdsZT1NYXRoLlBJLzZdIHtudW1iZXJ9IFNldCBhIGFuZ2xlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0Rpc3RhbmNlPTVdIHtudW1iZXJ9IFNldCBhIGRpc3RhbmNlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0JsdXI9MF0ge251bWJlcn0gSG93IG11Y2ggZHJvcCBzaGFkb3cgc2hvdWxkIGJlIGJsdXJyZWQsIDAgZGlzYWJsZXMgYmx1clxuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd1N0cmVuZ3RoPTFdIHtudW1iZXJ9IFNldCB0aGUgb3BhY2l0eSBvZiBkcm9wIHNoYWRvdyB3aGVuIGJsdXJyaW5nXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93U3Ryb2tlPTBdIHtudW1iZXJ9IFNldCB0aGUgc3Ryb2tlIHdpZHRoIG9mIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5wYWRkaW5nPTBdIHtudW1iZXJ9IE9jY2FzaW9uYWxseSBzb21lIGZvbnRzIGFyZSBjcm9wcGVkLiBBZGRpbmcgc29tZSBwYWRkaW5nIHdpbGwgcHJldmVudCB0aGlzIGZyb20gaGFwcGVuaW5nXG4gICAgICogQHBhcmFtIFt2YWx1ZS50ZXh0QmFzZWxpbmU9J2FscGhhYmV0aWMnXSB7c3RyaW5nfSBUaGUgYmFzZWxpbmUgb2YgdGhlIHRleHQgdGhhdCBpcyByZW5kZXJlZC5cbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmxpbmVKb2luPSdtaXRlciddIHtzdHJpbmd9IFRoZSBsaW5lSm9pbiBwcm9wZXJ0eSBzZXRzIHRoZSB0eXBlIG9mIGNvcm5lciBjcmVhdGVkLCBpdCBjYW4gcmVzb2x2ZVxuICAgICAqICAgICAgc3Bpa2VkIHRleHQgaXNzdWVzLiBEZWZhdWx0IGlzICdtaXRlcicgKGNyZWF0ZXMgYSBzaGFycCBjb3JuZXIpLlxuICAgICAqIEBwYXJhbSBbdmFsdWUubWl0ZXJMaW1pdD0xMF0ge251bWJlcn0gVGhlIG1pdGVyIGxpbWl0IHRvIHVzZSB3aGVuIHVzaW5nIHRoZSAnbWl0ZXInIGxpbmVKb2luIG1vZGUuIFRoaXMgY2FuIHJlZHVjZVxuICAgICAqICAgICAgb3IgaW5jcmVhc2UgdGhlIHNwaWtpbmVzcyBvZiByZW5kZXJlZCB0ZXh0LlxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHN0eWxlOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0eWxlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuXG4gICAgICAgICAgICB2YXIgb2xkU3R5bGUgPSB0aGlzLl9zdHlsZTtcblxuICAgICAgICAgICAgdmFyIHN0eWxlID0gc3R5bGUgfHwge307XG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQSVhJLlRleHRTdHlsZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdHlsZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0eWxlID0gbmV3IFBJWEkuVGV4dFN0eWxlKHN0eWxlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9sZFN0eWxlICE9PSB0aGlzLl9zdHlsZSB8fCB0aGlzLl9zdHlsZS5zdHlsZUlEICE9PSB0aGlzLl9zdHlsZUlEKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3R5bGVJRCA9IHRoaXMuX3N0eWxlLnN0eWxlSUQ7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3R5bGUgIT09IG51bGwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRoaXMuX3RleHQsdGhpcy5fc3R5bGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgY29weSBmb3IgdGhlIHRleHQgb2JqZWN0LiBUbyBzcGxpdCBhIGxpbmUgeW91IGNhbiB1c2UgJ1xcbicuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCB7c3RyaW5nfSBUaGUgY29weSB0aGF0IHlvdSB3b3VsZCBsaWtlIHRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAbWVtYmVyb2YgQ29jb29uVGV4dCNcbiAgICAgKi9cbiAgICB0ZXh0OiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodGV4dCl7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC50b1N0cmluZygpIHx8ICcgJztcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZXh0ID09PSB0ZXh0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl90ZXh0ICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZVVwZGF0ZVRleHQodGV4dCwgdGhpcy5fc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdGV4dCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFByZXBhcmUgdGhlIGNhbnZhcyBmb3IgYW4gdXBkYXRlIGFuZCB0cnkgdG8gZ2V0IGEgY2FjaGVkIHRleHQgZmlyc3QuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUucHJlcGFyZVVwZGF0ZVRleHQgPSBmdW5jdGlvbiAodGV4dCxzdHlsZSlcbntcbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0ICsgSlNPTi5zdHJpbmdpZnkoc3R5bGUpICsgdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gdHJ1ZTtcbn07XG5cbnZhciB0ZXh0dXJlQ2FjaGUgPSB7fTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnN3aXRjaENhbnZhcyA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIGJhc2VUZXh0dXJlID0gUElYSS51dGlscy5CYXNlVGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF07XG4gICAgdmFyIHRleHR1cmU7XG4gICAgaWYgKGJhc2VUZXh0dXJlKVxuICAgIHtcbiAgICAgICAgLy90aGVyZSBpcyBhIGNhY2hlZCB0ZXh0IGZvciB0aGVzZSBwYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuY2FudmFzID0gYmFzZVRleHR1cmUuc291cmNlO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBpZiAodHlwZW9mIHRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGV4dHVyZSA9IHRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICAgICAgICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgICAgICAgICAgdGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF0gPSB0ZXh0dXJlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRoaXMuY2FudmFzLl9waXhpSWQgPSB0aGlzLl9waXhpSWQ7XG5cbiAgICAgICAgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICAgICAgdGV4dHVyZS50cmltID0gbmV3IFBJWEkuUmVjdGFuZ2xlKCk7XG4gICAgICAgIHRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdID0gdGV4dHVyZTtcblxuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgIHRoaXMuX3RleHR1cmUgPSB0ZXh0dXJlO1xuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgdGV4dCBhbmQgdXBkYXRlcyBpdCB3aGVuIG5lZWRlZFxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnVwZGF0ZVRleHQgPSBmdW5jdGlvbiAoKVxue1xuICAgIGlmICh0aGlzLnN3aXRjaE5lZWRlZClcbiAgICB7XG4gICAgICAgIHRoaXMuc3dpdGNoQ2FudmFzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNhY2hlRGlydHkpXG4gICAge1xuICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLl9zdHlsZTtcbiAgICAgICAgdmFyIGZvbnRTaXplU3RyaW5nID0gKHR5cGVvZiBzdHlsZS5mb250U2l6ZSA9PT0gJ251bWJlcicpID8gc3R5bGUuZm9udFNpemUgKiB0aGlzLnJlc29sdXRpb24gKyAncHgnIDogc3R5bGUuZm9udFNpemU7XG4gICAgICAgIHZhciBmb250U3R5bGUgPSBzdHlsZS5mb250U3R5bGUgKyAnICcgKyBzdHlsZS5mb250VmFyaWFudCArICcgJyArIHN0eWxlLmZvbnRXZWlnaHQgKyAnICcgKyBmb250U2l6ZVN0cmluZyArICcgJyArIHN0eWxlLmZvbnRGYW1pbHk7XG4gICAgICAgIHRoaXMuY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuXG4gICAgICAgIC8vIHdvcmQgd3JhcFxuICAgICAgICAvLyBwcmVzZXJ2ZSBvcmlnaW5hbCB0ZXh0XG4gICAgICAgIHZhciBvdXRwdXRUZXh0ID0gc3R5bGUud29yZFdyYXAgPyB0aGlzLndvcmRXcmFwKHRoaXMuX3RleHQpIDogdGhpcy5fdGV4dDtcblxuICAgICAgICAvLyBzcGxpdCB0ZXh0IGludG8gbGluZXNcbiAgICAgICAgdmFyIGxpbmVzID0gb3V0cHV0VGV4dC5zcGxpdCgvKD86XFxyXFxufFxccnxcXG4pLyk7XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHRleHQgd2lkdGhcbiAgICAgICAgdmFyIGxpbmVXaWR0aHMgPSBuZXcgQXJyYXkobGluZXMubGVuZ3RoKTtcbiAgICAgICAgdmFyIG1heExpbmVXaWR0aCA9IDA7XG4gICAgICAgIHZhciBmb250UHJvcGVydGllcyA9IHRoaXMuZGV0ZXJtaW5lRm9udFByb3BlcnRpZXMoc3R5bGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgbGluZVdpZHRoID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KGxpbmVzW2ldKS53aWR0aDtcbiAgICAgICAgICAgIGxpbmVXaWR0aHNbaV0gPSBsaW5lV2lkdGg7XG4gICAgICAgICAgICBtYXhMaW5lV2lkdGggPSBNYXRoLm1heChtYXhMaW5lV2lkdGgsIGxpbmVXaWR0aCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd2lkdGggPSBtYXhMaW5lV2lkdGggKyBzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB3aWR0aCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9ICggd2lkdGggKyB0aGlzLmNvbnRleHQubGluZVdpZHRoICk7XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHRleHQgaGVpZ2h0XG4gICAgICAgIHZhciBsaW5lSGVpZ2h0ID0gdGhpcy5zdHlsZS5saW5lSGVpZ2h0ICAqIHRoaXMucmVzb2x1dGlvbiB8fCBmb250UHJvcGVydGllcy5mb250U2l6ZSArIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAqIHRoaXMucmVzb2x1dGlvbjtcblxuICAgICAgICB2YXIgaGVpZ2h0ID0gbGluZUhlaWdodCAqIGxpbmVzLmxlbmd0aDtcbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAoIGhlaWdodCArIHN0eWxlLnBhZGRpbmcgKiAyICogdGhpcy5yZXNvbHV0aW9uICk7XG5cbiAgICAgICAgaWYgKG5hdmlnYXRvci5pc0NvY29vbkpTKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9udFNpemVTdHJpbmcgPSAodHlwZW9mIHN0eWxlLmZvbnRTaXplID09PSAnbnVtYmVyJykgPyBzdHlsZS5mb250U2l6ZSAqIHRoaXMucmVzb2x1dGlvbiArICdweCcgOiBzdHlsZS5mb250U2l6ZTtcbiAgICAgICAgZm9udFN0eWxlID0gc3R5bGUuZm9udFN0eWxlICsgJyAnICsgc3R5bGUuZm9udFZhcmlhbnQgKyAnICcgKyBzdHlsZS5mb250V2VpZ2h0ICsgJyAnICsgZm9udFNpemVTdHJpbmcgKyAnICcgKyBzdHlsZS5mb250RmFtaWx5O1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuICAgICAgICB0aGlzLmNvbnRleHQudGV4dEJhc2VsaW5lID0gc3R5bGUudGV4dEJhc2VsaW5lO1xuICAgICAgICB0aGlzLmNvbnRleHQubGluZUpvaW4gPSBzdHlsZS5saW5lSm9pbjtcbiAgICAgICAgdGhpcy5jb250ZXh0Lm1pdGVyTGltaXQgPSBzdHlsZS5taXRlckxpbWl0O1xuXG4gICAgICAgIHZhciBsaW5lUG9zaXRpb25YO1xuICAgICAgICB2YXIgbGluZVBvc2l0aW9uWTtcblxuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGRyb3BTaGFkb3dDb2xvciA9IHN0eWxlLmRyb3BTaGFkb3dDb2xvcjtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZHJvcFNoYWRvd0NvbG9yID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3dDb2xvciA9IHRoaXMuZ3JhZGllbnRGaWxsKFxuICAgICAgICAgICAgICAgICAgICBkcm9wU2hhZG93Q29sb3IsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0ICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICogdGhpcy5yZXNvbHV0aW9uICsgc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlICogdGhpcy5yZXNvbHV0aW9uXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHhTaGFkb3dPZmZzZXQgPSBNYXRoLmNvcyhzdHlsZS5kcm9wU2hhZG93QW5nbGUpICogc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlO1xuICAgICAgICAgICAgdmFyIHlTaGFkb3dPZmZzZXQgPSBNYXRoLnNpbihzdHlsZS5kcm9wU2hhZG93QW5nbGUpICogc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Q29sb3IgPSBkcm9wU2hhZG93Q29sb3I7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHhTaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHlTaGFkb3dPZmZzZXQ7XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93Qmx1cikge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zaGFkb3dCbHVyID0gc3R5bGUuZHJvcFNoYWRvd0JsdXIgKiB0aGlzLnJlc29sdXRpb24gKiAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Q29sb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3Ryb2tlID0gc3R5bGUuc3Ryb2tlO1xuICAgICAgICBpZiAodHlwZW9mIHN0cm9rZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHN0cm9rZSA9IHRoaXMuZ3JhZGllbnRGaWxsKHN0cm9rZSwgd2lkdGgsIGxpbmVIZWlnaHQgKyBzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gc3Ryb2tlO1xuICAgICAgICB0aGlzLmNvbnRleHQubGluZVdpZHRoID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICogdGhpcy5yZXNvbHV0aW9uO1xuXG5cbiAgICAgICAgdmFyIGZpbGwgPSBzdHlsZS5maWxsO1xuICAgICAgICBpZiAodHlwZW9mIGZpbGwgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBmaWxsID0gdGhpcy5ncmFkaWVudEZpbGwoXG4gICAgICAgICAgICAgICAgZmlsbCxcbiAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0LFxuICAgICAgICAgICAgICAgIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAqIHRoaXMucmVzb2x1dGlvbiArIHN0eWxlLnBhZGRpbmcgKiB0aGlzLnJlc29sdXRpb25cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCBjYW52YXMgdGV4dCBzdHlsZXNcbiAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IGZpbGw7XG5cbiAgICAgICAgLy9kcmF3IGxpbmVzIGxpbmUgYnkgbGluZVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxpbmVQb3NpdGlvblggPSBzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb24gLyAyO1xuICAgICAgICAgICAgbGluZVBvc2l0aW9uWSA9IChzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb24gLyAyICsgaSAqIGxpbmVIZWlnaHQpICsgZm9udFByb3BlcnRpZXMuYXNjZW50O1xuXG4gICAgICAgICAgICBpZiAoc3R5bGUuYWxpZ24gPT09ICdyaWdodCcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGluZVBvc2l0aW9uWCArPSBtYXhMaW5lV2lkdGggLSBsaW5lV2lkdGhzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3R5bGUuYWxpZ24gPT09ICdjZW50ZXInKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gKG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV0pIC8gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0eWxlLnN0cm9rZSAmJiBzdHlsZS5zdHJva2VUaGlja25lc3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVRleHQobGluZXNbaV0sIGxpbmVQb3NpdGlvblgsIGxpbmVQb3NpdGlvblkgKyBzdHlsZS5wYWRkaW5nICogdGhpcy5yZXNvbHV0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0eWxlLmZpbGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YLCBsaW5lUG9zaXRpb25ZICsgc3R5bGUucGFkZGluZyAqIHRoaXMucmVzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5zdHJpa2VUaHJvdWdoKVxuICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgdmFyIHRleHRXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBNYXRoLnJvdW5kKGxpbmVQb3NpdGlvblkgLSBsaW5lSGVpZ2h0IC8gNCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFJlY3QobGluZVBvc2l0aW9uWCwgeSwgTWF0aC5yb3VuZCh0ZXh0V2lkdGgud2lkdGgpLCB0aGlzLnJlc29sdXRpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZVRleHR1cmUoKTtcbn07XG5cbkNvY29vblRleHQucHJvdG90eXBlLmdyYWRpZW50RmlsbCA9IGZ1bmN0aW9uIChvcHRpb25zLCB3aWR0aCwgaGVpZ2h0LCBwYWRkaW5nKVxue1xuICAgIHBhZGRpbmcgPSBwYWRkaW5nIHx8IDA7XG4gICAgd2lkdGggPSB3aWR0aCArIHBhZGRpbmc7XG4gICAgaGVpZ2h0ID0gaGVpZ2h0ICsgcGFkZGluZztcblxuICAgIHZhciBwYWRkaW5nWCwgcGFkZGluZ1k7XG4gICAgcGFkZGluZ1ggPSBwYWRkaW5nWSA9IHBhZGRpbmc7XG5cbiAgICBpZiAob3B0aW9ucy52ZXJ0aWNhbCkge1xuICAgICAgICBoZWlnaHQgPSAwO1xuICAgICAgICBwYWRkaW5nWSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2lkdGggPSAwO1xuICAgICAgICBwYWRkaW5nWCA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGdyYWRpZW50ID0gdGhpcy5jb250ZXh0LmNyZWF0ZUxpbmVhckdyYWRpZW50KHBhZGRpbmdYLCBwYWRkaW5nWSwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICB2YXIgaSwgaUxlbjtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zdG9wcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9yIChpID0gMCwgaUxlbiA9IG9wdGlvbnMuc3RvcHMubGVuZ3RoOyBpIDwgaUxlbjsgaSsrKSB7XG4gICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3Aob3B0aW9ucy5zdG9wc1tpXS5zdG9wLCBvcHRpb25zLnN0b3BzW2ldLmNvbG9yKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGlMZW4gPSBvcHRpb25zLnN0b3BzLmxlbmd0aDsgaSA8IGlMZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIHN0b3AgPSBpIC8gaUxlbjtcbiAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChzdG9wLCBvcHRpb25zLnN0b3BzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBncmFkaWVudDtcbn07XG5cbkNvY29vblRleHQucHJvdG90eXBlLmJsdXIgPSBmdW5jdGlvbiAoaXRlcmF0aW9ucywgc3RyZW5ndGgsIGFscGhhKSB7XG4gICAgdmFyIHggPSAwO1xuICAgIHZhciB5ID0gMDtcblxuICAgIC8vIENvcHkgdGhlIGN1cnJlbnQgcGl4ZWxzIHRvIGJlIHVzZWQgYXMgYSBzdGVuY2lsXG4gICAgdmFyIG5ld0NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBjb250ZXh0ID0gbmV3Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgbmV3Q2FudmFzLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGg7XG4gICAgbmV3Q2FudmFzLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcbiAgICBjb250ZXh0LmRyYXdJbWFnZSh0aGlzLmNhbnZhcywgMCwgMCk7XG5cbiAgICB2YXIgb2xkQWxwaGEgPSB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGE7XG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhID0gYWxwaGEgLyAoaXRlcmF0aW9ucyAqIDQpO1xuICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgICAvLyBBcHBseSBibHVyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVyYXRpb25zICogNDsgKytpKSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBpICUgNDtcbiAgICAgICAgdmFyIG9mZnNldCA9ICgoaSArIDEpIC8gNCkgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIDA6ICAvLyBVcC5cbiAgICAgICAgICAgICAgICB5IC09IG9mZnNldDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOiAgLy8gUmlnaHQuXG4gICAgICAgICAgICAgICAgeCArPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjogIC8vIERvd24uXG4gICAgICAgICAgICAgICAgeSArPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzogIC8vIExlZnQuXG4gICAgICAgICAgICAgICAgeCAtPSBvZmZzZXQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKG5ld0NhbnZhcywgeCwgeSk7XG4gICAgfVxuXG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhID0gb2xkQWxwaGE7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGV4dHVyZSBzaXplIGJhc2VkIG9uIGNhbnZhcyBzaXplXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUudXBkYXRlVGV4dHVyZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIHRleHR1cmUgPSB0aGlzLl90ZXh0dXJlO1xuXG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUuaGFzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5yZXNvbHV0aW9uID0gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG4gICAgfVxuXG4gICAgdGV4dHVyZS5vcmlnLndpZHRoID0gdGV4dHVyZS5fZnJhbWUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0ZXh0dXJlLm9yaWcuaGVpZ2h0ID0gdGV4dHVyZS5fZnJhbWUuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdGV4dHVyZS50cmltLnggPSAwO1xuICAgIHRleHR1cmUudHJpbS55ID0gMDsgLy8tdGhpcy5fc3R5bGUucGFkZGluZyAqIHRoaXMucmVzb2x1dGlvbjtcblxuICAgIHRleHR1cmUudHJpbS53aWR0aCA9IHRleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgIHRleHR1cmUudHJpbS5oZWlnaHQgPSB0ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7Ly8gLSB0aGlzLl9zdHlsZS5wYWRkaW5nICogMiAqIHRoaXMucmVzb2x1dGlvbjtcblxuICAgIHRoaXMuX3dpZHRoID0gdGhpcy5jYW52YXMud2lkdGggLyB0aGlzLnJlc29sdXRpb247XG4gICAgdGhpcy5faGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdGhpcy5zY2FsZS54ID0gMTtcbiAgICB0aGlzLnNjYWxlLnkgPSAxO1xuXG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUuZW1pdCgndXBkYXRlJywgIHRleHR1cmUuYmFzZVRleHR1cmUpO1xuICAgIH1cblxuICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICB0aGlzLmNhY2hlRGlydHkgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYXNjZW50LCBkZXNjZW50IGFuZCBmb250U2l6ZSBvZiBhIGdpdmVuIGZvbnRTdHlsZVxuICpcbiAqIEBwYXJhbSBmb250U3R5bGUge29iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLmRldGVybWluZUZvbnRQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKHN0eWxlKVxue1xuICAgIHZhciBmb250U2l6ZVN0cmluZyA9ICh0eXBlb2Ygc3R5bGUuZm9udFNpemUgPT09ICdudW1iZXInKSA/IHN0eWxlLmZvbnRTaXplICogdGhpcy5yZXNvbHV0aW9uICsgJ3B4JyA6IHN0eWxlLmZvbnRTaXplO1xuICAgIHZhciBmb250U3R5bGUgPSBzdHlsZS5mb250U3R5bGUgKyAnICcgKyBzdHlsZS5mb250VmFyaWFudCArICcgJyArIHN0eWxlLmZvbnRXZWlnaHQgKyAnICcgKyBmb250U2l6ZVN0cmluZyArICcgJyArIHN0eWxlLmZvbnRGYW1pbHk7XG5cbiAgICB2YXIgcHJvcGVydGllcyA9IFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NhY2hlW2ZvbnRTdHlsZV07XG5cbiAgICBpZiAoIXByb3BlcnRpZXMpXG4gICAge1xuICAgICAgICBwcm9wZXJ0aWVzID0ge307XG5cbiAgICAgICAgdmFyIGNhbnZhcyA9IFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NhbnZhcztcbiAgICAgICAgdmFyIGNvbnRleHQgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDb250ZXh0O1xuXG4gICAgICAgIGNvbnRleHQuZm9udCA9IGZvbnRTdHlsZTtcblxuICAgICAgICB2YXIgd2lkdGggPSBNYXRoLmNlaWwoY29udGV4dC5tZWFzdXJlVGV4dCgnfE3DiXEnKS53aWR0aCk7XG4gICAgICAgIHZhciBiYXNlbGluZSA9IE1hdGguY2VpbChjb250ZXh0Lm1lYXN1cmVUZXh0KCdNJykud2lkdGgpO1xuICAgICAgICB2YXIgaGVpZ2h0ID0gMiAqIGJhc2VsaW5lO1xuXG4gICAgICAgIC8vIGJhc2VsaW5lIGZhY3RvciBkZXBlbmRzIGEgbG90IG9mIHRoZSBmb250LiB0b2RvIDogbGV0IHVzZXIgc3BlY2lmeSBhIGZhY3RvciBwZXIgZm9udCBuYW1lID9cbiAgICAgICAgYmFzZWxpbmUgPSBiYXNlbGluZSAqIDEuMiB8IDA7XG5cbiAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnI2YwMCc7XG4gICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICAgICAgY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuXG4gICAgICAgIGNvbnRleHQudGV4dEJhc2VsaW5lID0gJ2FscGhhYmV0aWMnO1xuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjMDAwJztcbiAgICAgICAgY29udGV4dC5maWxsVGV4dCgnfE3DiXEnLCAwLCBiYXNlbGluZSk7XG5cbiAgICAgICAgdmFyIGltYWdlZGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpLmRhdGE7XG4gICAgICAgIHZhciBwaXhlbHMgPSBpbWFnZWRhdGEubGVuZ3RoO1xuICAgICAgICB2YXIgbGluZSA9IHdpZHRoICogNDtcblxuICAgICAgICB2YXIgaSwgajtcblxuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIHN0b3AgPSBmYWxzZTtcblxuICAgICAgICAvLyBhc2NlbnQuIHNjYW4gZnJvbSB0b3AgdG8gYm90dG9tIHVudGlsIHdlIGZpbmQgYSBub24gcmVkIHBpeGVsXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBiYXNlbGluZTsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbGluZTsgaiArPSA0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChpbWFnZWRhdGFbaWR4ICsgal0gIT09IDI1NSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXN0b3ApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWR4ICs9IGxpbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wZXJ0aWVzLmFzY2VudCA9IGJhc2VsaW5lIC0gaTtcblxuICAgICAgICBpZHggPSBwaXhlbHMgLSBsaW5lO1xuICAgICAgICBzdG9wID0gZmFsc2U7XG5cbiAgICAgICAgLy8gZGVzY2VudC4gc2NhbiBmcm9tIGJvdHRvbSB0byB0b3AgdW50aWwgd2UgZmluZCBhIG5vbiByZWQgcGl4ZWxcbiAgICAgICAgZm9yIChpID0gaGVpZ2h0OyBpID4gYmFzZWxpbmU7IGktLSlcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxpbmU7IGogKz0gNClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VkYXRhW2lkeCArIGpdICE9PSAyNTUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdG9wKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkeCAtPSBsaW5lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvcGVydGllcy5kZXNjZW50ID0gaSAtIGJhc2VsaW5lO1xuICAgICAgICBwcm9wZXJ0aWVzLmZvbnRTaXplID0gcHJvcGVydGllcy5hc2NlbnQgKyBwcm9wZXJ0aWVzLmRlc2NlbnQ7XG5cbiAgICAgICAgUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FjaGVbZm9udFN0eWxlXSA9IHByb3BlcnRpZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgbmV3bGluZXMgdG8gYSBzdHJpbmcgdG8gaGF2ZSBpdCBvcHRpbWFsbHkgZml0IGludG8gdGhlIGhvcml6b250YWxcbiAqIGJvdW5kcyBzZXQgYnkgdGhlIFRleHQgb2JqZWN0J3Mgd29yZFdyYXBXaWR0aCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gdGV4dCB7c3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUud29yZFdyYXAgPSBmdW5jdGlvbiAodGV4dClcbntcbiAgICAvLyBHcmVlZHkgd3JhcHBpbmcgYWxnb3JpdGhtIHRoYXQgd2lsbCB3cmFwIHdvcmRzIGFzIHRoZSBsaW5lIGdyb3dzIGxvbmdlclxuICAgIC8vIHRoYW4gaXRzIGhvcml6b250YWwgYm91bmRzLlxuICAgIHZhciByZXN1bHQgPSAnJztcbiAgICB2YXIgbGluZXMgPSB0ZXh0LnNwbGl0KCdcXG4nKTtcbiAgICB2YXIgd29yZFdyYXBXaWR0aCA9IHRoaXMuX3N0eWxlLndvcmRXcmFwV2lkdGggKiB0aGlzLnJlc29sdXRpb247XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICB7XG4gICAgICAgIHZhciBzcGFjZUxlZnQgPSB3b3JkV3JhcFdpZHRoO1xuICAgICAgICB2YXIgd29yZHMgPSBsaW5lc1tpXS5zcGxpdCgnICcpO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHdvcmRzLmxlbmd0aDsgaisrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgd29yZFdpZHRoID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KHdvcmRzW2pdKS53aWR0aDtcbiAgICAgICAgICAgIHZhciB3b3JkV2lkdGhXaXRoU3BhY2UgPSB3b3JkV2lkdGggKyB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQoJyAnKS53aWR0aDtcbiAgICAgICAgICAgIGlmIChqID09PSAwIHx8IHdvcmRXaWR0aFdpdGhTcGFjZSA+IHNwYWNlTGVmdClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHByaW50aW5nIHRoZSBuZXdsaW5lIGlmIGl0J3MgdGhlIGZpcnN0IHdvcmQgb2YgdGhlIGxpbmUgdGhhdCBpc1xuICAgICAgICAgICAgICAgIC8vIGdyZWF0ZXIgdGhhbiB0aGUgd29yZCB3cmFwIHdpZHRoLlxuICAgICAgICAgICAgICAgIGlmIChqID4gMClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnXFxuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHdvcmRzW2pdO1xuICAgICAgICAgICAgICAgIHNwYWNlTGVmdCA9IHdvcmRXcmFwV2lkdGggLSB3b3JkV2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3BhY2VMZWZ0IC09IHdvcmRXaWR0aFdpdGhTcGFjZTtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJyAnICsgd29yZHNbal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaSA8IGxpbmVzLmxlbmd0aC0xKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcbic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0aGUgb2JqZWN0IHVzaW5nIHRoZSBXZWJHTCByZW5kZXJlclxuICpcbiAqIEBwYXJhbSByZW5kZXJlciB7V2ViR0xSZW5kZXJlcn1cbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUucmVuZGVyV2ViR0wgPSBmdW5jdGlvbiAocmVuZGVyZXIpXG57XG4gICAgaWYgKHRoaXMuZGlydHkpXG4gICAge1xuICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICB9XG5cbiAgICBQSVhJLlNwcml0ZS5wcm90b3R5cGUucmVuZGVyV2ViR0wuY2FsbCh0aGlzLCByZW5kZXJlcik7XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIG9iamVjdCB1c2luZyB0aGUgQ2FudmFzIHJlbmRlcmVyXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIHtDYW52YXNSZW5kZXJlcn1cbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLl9yZW5kZXJDYW52YXMgPSBmdW5jdGlvbiAocmVuZGVyZXIpXG57XG4gICAgaWYgKHRoaXMuZGlydHkpXG4gICAge1xuICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICB9XG5cbiAgICBQSVhJLlNwcml0ZS5wcm90b3R5cGUuX3JlbmRlckNhbnZhcy5jYWxsKHRoaXMsIHJlbmRlcmVyKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYm91bmRzIG9mIHRoZSBUZXh0IGFzIGEgcmVjdGFuZ2xlLiBUaGUgYm91bmRzIGNhbGN1bGF0aW9uIHRha2VzIHRoZSB3b3JsZFRyYW5zZm9ybSBpbnRvIGFjY291bnQuXG4gKlxuICogQHBhcmFtIG1hdHJpeCB7TWF0cml4fSB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4IG9mIHRoZSBUZXh0XG4gKiBAcmV0dXJuIHtSZWN0YW5nbGV9IHRoZSBmcmFtaW5nIHJlY3RhbmdsZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5nZXRCb3VuZHMgPSBmdW5jdGlvbiAobWF0cml4KVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFBJWEkuU3ByaXRlLnByb3RvdHlwZS5nZXRCb3VuZHMuY2FsbCh0aGlzLCBtYXRyaXgpO1xufTtcblxuLyoqXG4gKiBEZXN0cm95cyB0aGlzIHRleHQgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSBbZGVzdHJveUJhc2VUZXh0dXJlPXRydWVdIHtib29sZWFufSB3aGV0aGVyIHRvIGRlc3Ryb3kgdGhlIGJhc2UgdGV4dHVyZSBhcyB3ZWxsXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoZGVzdHJveUJhc2VUZXh0dXJlKVxue1xuICAgIC8vIG1ha2Ugc3VyZSB0byByZXNldCB0aGUgdGhlIGNvbnRleHQgYW5kIGNhbnZhcy4uIGRvbnQgd2FudCB0aGlzIGhhbmdpbmcgYXJvdW5kIGluIG1lbW9yeSFcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIHRoaXMuY2FudmFzID0gbnVsbDtcblxuICAgIHRoaXMuX3N0eWxlID0gbnVsbDtcblxuICAgIHRoaXMuX3RleHR1cmUuZGVzdHJveShkZXN0cm95QmFzZVRleHR1cmUgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBkZXN0cm95QmFzZVRleHR1cmUpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBURVhUX1JFU09MVVRJT04gLSBEZWZhdWx0IHJlc29sdXRpb24gb2YgYSBuZXcgQ29jb29uVGV4dFxuICAgICAqIEBjb25zdGFudFxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBURVhUX1JFU09MVVRJT046MVxufTtcbiJdfQ==
