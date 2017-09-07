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
                var y = Math.round(linePositionY - lineHeight / 4 + style.padding);

                this.context.fillRect(linePositionX, y, Math.round(textWidth.width), 2 * this.resolution);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyIsInNyYy9Db2Nvb25UZXh0VXRpbC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6eEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBuYW1lc3BhY2UgUElYSS5jb2Nvb25UZXh0XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUElYSS5jb2Nvb250ZXh0ID0ge1xuICAgIENvY29vblRleHQ6ICAgIHJlcXVpcmUoJy4vQ29jb29uVGV4dCcpLFxuICAgIENPTlNUOiAgICByZXF1aXJlKCcuL0NvY29vblRleHRVdGlsJylcbn07XG4iLCJ2YXIgQ09OU1QgPSByZXF1aXJlKCcuLi9Db2Nvb25UZXh0VXRpbCcpO1xuXG4vKipcbiAqIEEgQ29jb29uVGV4dCBPYmplY3Qgd2lsbCBjcmVhdGUgYSBsaW5lIG9yIG11bHRpcGxlIGxpbmVzIG9mIHRleHQuIFRvIHNwbGl0IGEgbGluZSB5b3UgY2FuIHVzZSAnXFxuJyBpbiB5b3VyIHRleHQgc3RyaW5nLFxuICogb3IgYWRkIGEgd29yZFdyYXAgcHJvcGVydHkgc2V0IHRvIHRydWUgYW5kIGFuZCB3b3JkV3JhcFdpZHRoIHByb3BlcnR5IHdpdGggYSB2YWx1ZSBpbiB0aGUgc3R5bGUgb2JqZWN0LlxuICpcbiAqIE9uY2UgYSBDb2Nvb25UZXh0IGlzIGdlbmVyYXRlZCwgaXQgaXMgc3RvcmVkIGFzIGEgQmFzZVRleHR1cmUgYW5kIHdpbGwgYmUgdXNlZCBpZiBhIG5ldyBUZXh0IGlzXG4gKiBjcmVhdGVkIHdpdGggdGhlIGV4YWN0IHNhbWUgcGFyYW1ldGVycy5cbiAqXG4gKiBBIENvY29vblRleHQgY2FuIGJlIGNyZWF0ZWQgZGlyZWN0bHkgZnJvbSBhIHN0cmluZyBhbmQgYSBzdHlsZSBvYmplY3RcbiAqXG4gKiBgYGBqc1xuICogdmFyIHRleHQgPSBuZXcgUElYSS5leHRyYXMuQ29jb29uVGV4dCgnVGhpcyBpcyBhIENvY29vblRleHQnLHtmb250IDogJzI0cHggQXJpYWwnLCBmaWxsIDogMHhmZjEwMTAsIGFsaWduIDogJ2NlbnRlcid9KTtcbiAqIGBgYFxuICpcbiAqIEBjbGFzc1xuICogQGV4dGVuZHMgU3ByaXRlXG4gKiBAbWVtYmVyb2YgUElYSS5leHRyYXNcbiAqIEBwYXJhbSB0ZXh0IHtzdHJpbmd9IFRoZSBjb3B5IHRoYXQgeW91IHdvdWxkIGxpa2UgdGhlIHRleHQgdG8gZGlzcGxheVxuICogQHBhcmFtIFtzdHlsZV0ge29iamVjdH0gVGhlIHN0eWxlIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBbc3R5bGUuZm9udF0ge3N0cmluZ30gZGVmYXVsdCAnYm9sZCAyMHB4IEFyaWFsJyBUaGUgc3R5bGUgYW5kIHNpemUgb2YgdGhlIGZvbnRcbiAqIEBwYXJhbSBbc3R5bGUuZmlsbD0nYmxhY2snXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBlLmcgJ3JlZCcsICcjMDBGRjAwJyxcbiAqICAgICAgb3Igb2JqZWN0IGZvciBncmFkaWVudHMgJ3t2ZXJ0aWNhbDogZmFsc2UsIHN0b3BzIDogW3tzdG9wOiAwICwgY29sb3I6ICcjMDAwJ30sIHtzdG9wOiAxLCBjb2xvcjogJyNGRkYnXX0nXG4gKiBAcGFyYW0gW3N0eWxlLmFsaWduPSdsZWZ0J10ge3N0cmluZ30gQWxpZ25tZW50IGZvciBtdWx0aWxpbmUgdGV4dCAoJ2xlZnQnLCAnY2VudGVyJyBvciAncmlnaHQnKSwgZG9lcyBub3QgYWZmZWN0IHNpbmdsZSBsaW5lIHRleHRcbiAqIEBwYXJhbSBbc3R5bGUuc3Ryb2tlXSB7U3RyaW5nfE51bWJlcnxPYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBzdHJva2UsIHNlZSAnZmlsbCcgZm9yIGRldGFpbHNcbiAqIEBwYXJhbSBbc3R5bGUuc3Ryb2tlVGhpY2tuZXNzPTBdIHtudW1iZXJ9IEEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdGhpY2tuZXNzIG9mIHRoZSBzdHJva2UuIERlZmF1bHQgaXMgMCAobm8gc3Ryb2tlKVxuICogQHBhcmFtIFtzdHlsZS53b3JkV3JhcD1mYWxzZV0ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB3b3JkIHdyYXAgc2hvdWxkIGJlIHVzZWRcbiAqIEBwYXJhbSBbc3R5bGUud29yZFdyYXBXaWR0aD0xMDBdIHtudW1iZXJ9IFRoZSB3aWR0aCBhdCB3aGljaCB0ZXh0IHdpbGwgd3JhcCwgaXQgbmVlZHMgd29yZFdyYXAgdG8gYmUgc2V0IHRvIHRydWVcbiAqIEBwYXJhbSBbc3R5bGUubGluZUhlaWdodF0ge251bWJlcn0gVGhlIGxpbmUgaGVpZ2h0LCBhIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHZlcnRpY2FsIHNwYWNlIHRoYXQgYSBsZXR0ZXIgdXNlc1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93PWZhbHNlXSB7Ym9vbGVhbn0gU2V0IGEgZHJvcCBzaGFkb3cgZm9yIHRoZSB0ZXh0XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dDb2xvcj0nIzAwMDAwMCddIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBmaWxsIHN0eWxlIHRvIGJlIHVzZWQgb24gdGhlIGRyb3BzaGFkb3csIHNlZSAnZmlsbCcgZm9yIGRldGFpbHNcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0FuZ2xlPU1hdGguUEkvNF0ge251bWJlcn0gU2V0IGEgYW5nbGUgb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZT01XSB7bnVtYmVyfSBTZXQgYSBkaXN0YW5jZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0JsdXI9MF0ge251bWJlcn0gSG93IG11Y2ggZHJvcCBzaGFkb3cgc2hvdWxkIGJlIGJsdXJyZWQsIDAgZGlzYWJsZXMgYmx1clxuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93U3RyZW5ndGg9MV0ge251bWJlcn0gU2V0IHRoZSBvcGFjaXR5IG9mIGRyb3Agc2hhZG93IHdoZW4gYmx1cnJpbmdcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd1N0cm9rZT0xXSB7bnVtYmVyfSBTZXQgdGhlIHN0cm9rZSB3aWR0aCBvZiB0aGUgZHJvcCBzaGFkb3dcbiAqIEBwYXJhbSBbc3R5bGUucGFkZGluZz0wXSB7bnVtYmVyfSBPY2Nhc2lvbmFsbHkgc29tZSBmb250cyBhcmUgY3JvcHBlZC4gQWRkaW5nIHNvbWUgcGFkZGluZyB3aWxsIHByZXZlbnQgdGhpcyBmcm9tIGhhcHBlbmluZ1xuICogQHBhcmFtIFtzdHlsZS50ZXh0QmFzZWxpbmU9J2FscGhhYmV0aWMnXSB7c3RyaW5nfSBUaGUgYmFzZWxpbmUgb2YgdGhlIHRleHQgdGhhdCBpcyByZW5kZXJlZC5cbiAqIEBwYXJhbSBbc3R5bGUubGluZUpvaW49J21pdGVyJ10ge3N0cmluZ30gVGhlIGxpbmVKb2luIHByb3BlcnR5IHNldHMgdGhlIHR5cGUgb2YgY29ybmVyIGNyZWF0ZWQsIGl0IGNhbiByZXNvbHZlXG4gKiAgICAgIHNwaWtlZCB0ZXh0IGlzc3Vlcy4gRGVmYXVsdCBpcyAnbWl0ZXInIChjcmVhdGVzIGEgc2hhcnAgY29ybmVyKS5cbiAqIEBwYXJhbSBbc3R5bGUubWl0ZXJMaW1pdD0xMF0ge251bWJlcn0gVGhlIG1pdGVyIGxpbWl0IHRvIHVzZSB3aGVuIHVzaW5nIHRoZSAnbWl0ZXInIGxpbmVKb2luIG1vZGUuIFRoaXMgY2FuIHJlZHVjZVxuICogICAgICBvciBpbmNyZWFzZSB0aGUgc3Bpa2luZXNzIG9mIHJlbmRlcmVkIHRleHQuXG4gKi9cbmZ1bmN0aW9uIENvY29vblRleHQodGV4dCwgc3R5bGUsIHJlc29sdXRpb24pXG57XG4gICAgLyoqXG4gICAgICogVGhlIGNhbnZhcyBlbGVtZW50IHRoYXQgZXZlcnl0aGluZyBpcyBkcmF3biB0b1xuICAgICAqXG4gICAgICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5jYW52YXMgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGNhbnZhcyAyZCBjb250ZXh0IHRoYXQgZXZlcnl0aGluZyBpcyBkcmF3biB3aXRoXG4gICAgICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSByZXNvbHV0aW9uIG9mIHRoZSBjYW52YXMuXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucmVzb2x1dGlvbiA9IHJlc29sdXRpb24gfHwgQ09OU1QuVEVYVF9SRVNPTFVUSU9OIHx8IFBJWEkuUkVTT0xVVElPTjtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgdHJhY2tlciBmb3IgdGhlIGN1cnJlbnQgdGV4dC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX3RleHQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSB0cmFja2VyIGZvciB0aGUgY3VycmVudCBzdHlsZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge29iamVjdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX3N0eWxlID0gbnVsbDtcblxuICAgIHRoaXMuX3BpeGlJZCA9IHRleHQgKyBKU09OLnN0cmluZ2lmeShzdHlsZSkgKyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB2YXIgYmFzZVRleHR1cmUgPSBQSVhJLnV0aWxzLkJhc2VUZXh0dXJlQ2FjaGVbdGhpcy5fcGl4aUlkXTtcblxuICAgIGlmICh0eXBlb2YgYmFzZVRleHR1cmUgPT09ICd1bmRlZmluZWQnKVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5jYW52YXMuX3BpeGlJZCA9IHRoaXMuX3BpeGlJZDtcbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBiYXNlVGV4dHVyZS5zb3VyY2U7XG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB2YXIgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICB0ZXh0dXJlLnRyaW0gPSBuZXcgUElYSS5SZWN0YW5nbGUoKTtcbiAgICBQSVhJLlNwcml0ZS5jYWxsKHRoaXMsIHRleHR1cmUpO1xuXG4gICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgICB0aGlzLnN0eWxlID0gc3R5bGU7XG5cbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IGZhbHNlO1xufVxuXG4vLyBjb25zdHJ1Y3RvclxuQ29jb29uVGV4dC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBJWEkuU3ByaXRlLnByb3RvdHlwZSk7XG5Db2Nvb25UZXh0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvY29vblRleHQ7XG5tb2R1bGUuZXhwb3J0cyA9IENvY29vblRleHQ7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKENvY29vblRleHQucHJvdG90eXBlLCB7XG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIG9mIHRoZSBDb2Nvb25UZXh0LCBzZXR0aW5nIHRoaXMgd2lsbCBhY3R1YWxseSBtb2RpZnkgdGhlIHNjYWxlIHRvIGFjaGlldmUgdGhlIHZhbHVlIHNldFxuICAgICAqXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHdpZHRoOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjYWxlLnggKiB0aGlzLl90ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUueCA9IHZhbHVlIC8gdGhpcy5fdGV4dHVyZS5fZnJhbWUud2lkdGg7XG4gICAgICAgICAgICB0aGlzLl93aWR0aCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgb2YgdGhlIENvY29vblRleHQsIHNldHRpbmcgdGhpcyB3aWxsIGFjdHVhbGx5IG1vZGlmeSB0aGUgc2NhbGUgdG8gYWNoaWV2ZSB0aGUgdmFsdWUgc2V0XG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgaGVpZ2h0OiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAgdGhpcy5zY2FsZS55ICogdGhpcy5fdGV4dHVyZS5fZnJhbWUuaGVpZ2h0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS55ID0gdmFsdWUgLyB0aGlzLl90ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9oZWlnaHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHN0eWxlIG9mIHRoZSB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0gW3ZhbHVlXSB7b2JqZWN0fSBUaGUgc3R5bGUgcGFyYW1ldGVyc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZm9udD0nYm9sZCAyMHB0IEFyaWFsJ10ge3N0cmluZ30gVGhlIHN0eWxlIGFuZCBzaXplIG9mIHRoZSBmb250XG4gICAgICogQHBhcmFtIFt2YWx1ZS5maWxsPSdibGFjayddIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IGUuZyAncmVkJywgJyMwMEZGMDAnLFxuICAgICAqICAgICAgb3Igb2JqZWN0IGZvciBncmFkaWVudHMgJ3t2ZXJ0aWNhbDogZmFsc2UsIHN0b3BzIDogW3tzdG9wOiAwICwgY29sb3I6ICcjMDAwJ30sIHtzdG9wOiAxLCBjb2xvcjogJyNGRkYnXX0nXG4gICAgICogQHBhcmFtIFt2YWx1ZS5hbGlnbj0nbGVmdCddIHtzdHJpbmd9IEFsaWdubWVudCBmb3IgbXVsdGlsaW5lIHRleHQgKCdsZWZ0JywgJ2NlbnRlcicgb3IgJ3JpZ2h0JyksIGRvZXMgbm90IGFmZmVjdCBzaW5nbGUgbGluZSB0ZXh0XG4gICAgICogQHBhcmFtIFt2YWx1ZS5zdHJva2U9J2JsYWNrJ10ge1N0cmluZ3xOdW1iZXJ8T2JqZWN0fSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgc3Ryb2tlLCBzZWUgJ2ZpbGwnIGZvciBkZXRhaWxzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5zdHJva2VUaGlja25lc3M9MF0ge251bWJlcn0gQSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB0aGlja25lc3Mgb2YgdGhlIHN0cm9rZS4gRGVmYXVsdCBpcyAwIChubyBzdHJva2UpXG4gICAgICogQHBhcmFtIFt2YWx1ZS53b3JkV3JhcD1mYWxzZV0ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB3b3JkIHdyYXAgc2hvdWxkIGJlIHVzZWRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLndvcmRXcmFwV2lkdGg9MTAwXSB7bnVtYmVyfSBUaGUgd2lkdGggYXQgd2hpY2ggdGV4dCB3aWxsIHdyYXBcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmxpbmVIZWlnaHRdIHtudW1iZXJ9IFRoZSBsaW5lIGhlaWdodCwgYSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB2ZXJ0aWNhbCBzcGFjZSB0aGF0IGEgbGV0dGVyIHVzZXNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3c9ZmFsc2VdIHtib29sZWFufSBTZXQgYSBkcm9wIHNoYWRvdyBmb3IgdGhlIHRleHRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dDb2xvcj0nIzAwMDAwMCddIHtTdHJpbmd8TnVtYmVyfE9iamVjdH0gQSBmaWxsIHN0eWxlIHRvIGJlIHVzZWQgb24gdGhlIGRyb3BzaGFkb3csIHNlZSAnZmlsbCcgZm9yIGRldGFpbHNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dBbmdsZT1NYXRoLlBJLzZdIHtudW1iZXJ9IFNldCBhIGFuZ2xlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0Rpc3RhbmNlPTVdIHtudW1iZXJ9IFNldCBhIGRpc3RhbmNlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0JsdXI9MF0ge251bWJlcn0gSG93IG11Y2ggZHJvcCBzaGFkb3cgc2hvdWxkIGJlIGJsdXJyZWQsIDAgZGlzYWJsZXMgYmx1clxuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd1N0cmVuZ3RoPTFdIHtudW1iZXJ9IFNldCB0aGUgb3BhY2l0eSBvZiBkcm9wIHNoYWRvdyB3aGVuIGJsdXJyaW5nXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93U3Ryb2tlPTBdIHtudW1iZXJ9IFNldCB0aGUgc3Ryb2tlIHdpZHRoIG9mIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5wYWRkaW5nPTBdIHtudW1iZXJ9IE9jY2FzaW9uYWxseSBzb21lIGZvbnRzIGFyZSBjcm9wcGVkLiBBZGRpbmcgc29tZSBwYWRkaW5nIHdpbGwgcHJldmVudCB0aGlzIGZyb20gaGFwcGVuaW5nXG4gICAgICogQHBhcmFtIFt2YWx1ZS50ZXh0QmFzZWxpbmU9J2FscGhhYmV0aWMnXSB7c3RyaW5nfSBUaGUgYmFzZWxpbmUgb2YgdGhlIHRleHQgdGhhdCBpcyByZW5kZXJlZC5cbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmxpbmVKb2luPSdtaXRlciddIHtzdHJpbmd9IFRoZSBsaW5lSm9pbiBwcm9wZXJ0eSBzZXRzIHRoZSB0eXBlIG9mIGNvcm5lciBjcmVhdGVkLCBpdCBjYW4gcmVzb2x2ZVxuICAgICAqICAgICAgc3Bpa2VkIHRleHQgaXNzdWVzLiBEZWZhdWx0IGlzICdtaXRlcicgKGNyZWF0ZXMgYSBzaGFycCBjb3JuZXIpLlxuICAgICAqIEBwYXJhbSBbdmFsdWUubWl0ZXJMaW1pdD0xMF0ge251bWJlcn0gVGhlIG1pdGVyIGxpbWl0IHRvIHVzZSB3aGVuIHVzaW5nIHRoZSAnbWl0ZXInIGxpbmVKb2luIG1vZGUuIFRoaXMgY2FuIHJlZHVjZVxuICAgICAqICAgICAgb3IgaW5jcmVhc2UgdGhlIHNwaWtpbmVzcyBvZiByZW5kZXJlZCB0ZXh0LlxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHN0eWxlOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0eWxlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuXG4gICAgICAgICAgICB2YXIgb2xkU3R5bGUgPSB0aGlzLl9zdHlsZTtcblxuICAgICAgICAgICAgdmFyIHN0eWxlID0gc3R5bGUgfHwge307XG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQSVhJLlRleHRTdHlsZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdHlsZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0eWxlID0gbmV3IFBJWEkuVGV4dFN0eWxlKHN0eWxlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9sZFN0eWxlICE9PSB0aGlzLl9zdHlsZSB8fCB0aGlzLl9zdHlsZS5zdHlsZUlEICE9PSB0aGlzLl9zdHlsZUlEKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3R5bGVJRCA9IHRoaXMuX3N0eWxlLnN0eWxlSUQ7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3R5bGUgIT09IG51bGwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRoaXMuX3RleHQsdGhpcy5fc3R5bGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgY29weSBmb3IgdGhlIHRleHQgb2JqZWN0LiBUbyBzcGxpdCBhIGxpbmUgeW91IGNhbiB1c2UgJ1xcbicuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCB7c3RyaW5nfSBUaGUgY29weSB0aGF0IHlvdSB3b3VsZCBsaWtlIHRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAbWVtYmVyb2YgQ29jb29uVGV4dCNcbiAgICAgKi9cbiAgICB0ZXh0OiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodGV4dCl7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC50b1N0cmluZygpIHx8ICcgJztcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZXh0ID09PSB0ZXh0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl90ZXh0ICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZVVwZGF0ZVRleHQodGV4dCwgdGhpcy5fc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdGV4dCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFByZXBhcmUgdGhlIGNhbnZhcyBmb3IgYW4gdXBkYXRlIGFuZCB0cnkgdG8gZ2V0IGEgY2FjaGVkIHRleHQgZmlyc3QuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUucHJlcGFyZVVwZGF0ZVRleHQgPSBmdW5jdGlvbiAodGV4dCxzdHlsZSlcbntcbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0ICsgSlNPTi5zdHJpbmdpZnkoc3R5bGUpICsgdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gdHJ1ZTtcbn07XG5cbnZhciB0ZXh0dXJlQ2FjaGUgPSB7fTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnN3aXRjaENhbnZhcyA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIGJhc2VUZXh0dXJlID0gUElYSS51dGlscy5CYXNlVGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF07XG4gICAgdmFyIHRleHR1cmU7XG4gICAgaWYgKGJhc2VUZXh0dXJlKVxuICAgIHtcbiAgICAgICAgLy90aGVyZSBpcyBhIGNhY2hlZCB0ZXh0IGZvciB0aGVzZSBwYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuY2FudmFzID0gYmFzZVRleHR1cmUuc291cmNlO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBpZiAodHlwZW9mIHRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGV4dHVyZSA9IHRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICAgICAgICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgpO1xuICAgICAgICAgICAgdGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF0gPSB0ZXh0dXJlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRoaXMuY2FudmFzLl9waXhpSWQgPSB0aGlzLl9waXhpSWQ7XG5cbiAgICAgICAgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICAgICAgdGV4dHVyZS50cmltID0gbmV3IFBJWEkuUmVjdGFuZ2xlKCk7XG4gICAgICAgIHRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdID0gdGV4dHVyZTtcblxuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgIHRoaXMuX3RleHR1cmUgPSB0ZXh0dXJlO1xuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgdGV4dCBhbmQgdXBkYXRlcyBpdCB3aGVuIG5lZWRlZFxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnVwZGF0ZVRleHQgPSBmdW5jdGlvbiAoKVxue1xuICAgIGlmICh0aGlzLnN3aXRjaE5lZWRlZClcbiAgICB7XG4gICAgICAgIHRoaXMuc3dpdGNoQ2FudmFzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNhY2hlRGlydHkpXG4gICAge1xuICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLl9zdHlsZTtcbiAgICAgICAgdmFyIGZvbnRTaXplU3RyaW5nID0gKHR5cGVvZiBzdHlsZS5mb250U2l6ZSA9PT0gJ251bWJlcicpID8gc3R5bGUuZm9udFNpemUgKiB0aGlzLnJlc29sdXRpb24gKyAncHgnIDogc3R5bGUuZm9udFNpemU7XG4gICAgICAgIHZhciBmb250U3R5bGUgPSBzdHlsZS5mb250U3R5bGUgKyAnICcgKyBzdHlsZS5mb250VmFyaWFudCArICcgJyArIHN0eWxlLmZvbnRXZWlnaHQgKyAnICcgKyBmb250U2l6ZVN0cmluZyArICcgJyArIHN0eWxlLmZvbnRGYW1pbHk7XG4gICAgICAgIHRoaXMuY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuXG4gICAgICAgIC8vIHdvcmQgd3JhcFxuICAgICAgICAvLyBwcmVzZXJ2ZSBvcmlnaW5hbCB0ZXh0XG4gICAgICAgIHZhciBvdXRwdXRUZXh0ID0gc3R5bGUud29yZFdyYXAgPyB0aGlzLndvcmRXcmFwKHRoaXMuX3RleHQpIDogdGhpcy5fdGV4dDtcblxuICAgICAgICAvLyBzcGxpdCB0ZXh0IGludG8gbGluZXNcbiAgICAgICAgdmFyIGxpbmVzID0gb3V0cHV0VGV4dC5zcGxpdCgvKD86XFxyXFxufFxccnxcXG4pLyk7XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHRleHQgd2lkdGhcbiAgICAgICAgdmFyIGxpbmVXaWR0aHMgPSBuZXcgQXJyYXkobGluZXMubGVuZ3RoKTtcbiAgICAgICAgdmFyIG1heExpbmVXaWR0aCA9IDA7XG4gICAgICAgIHZhciBmb250UHJvcGVydGllcyA9IHRoaXMuZGV0ZXJtaW5lRm9udFByb3BlcnRpZXMoc3R5bGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgbGluZVdpZHRoID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KGxpbmVzW2ldKS53aWR0aDtcbiAgICAgICAgICAgIGxpbmVXaWR0aHNbaV0gPSBsaW5lV2lkdGg7XG4gICAgICAgICAgICBtYXhMaW5lV2lkdGggPSBNYXRoLm1heChtYXhMaW5lV2lkdGgsIGxpbmVXaWR0aCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd2lkdGggPSBtYXhMaW5lV2lkdGggKyBzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB3aWR0aCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9ICggd2lkdGggKyB0aGlzLmNvbnRleHQubGluZVdpZHRoICk7XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHRleHQgaGVpZ2h0XG4gICAgICAgIHZhciBsaW5lSGVpZ2h0ID0gdGhpcy5zdHlsZS5saW5lSGVpZ2h0ICAqIHRoaXMucmVzb2x1dGlvbiB8fCBmb250UHJvcGVydGllcy5mb250U2l6ZSArIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAqIHRoaXMucmVzb2x1dGlvbjtcblxuICAgICAgICB2YXIgaGVpZ2h0ID0gbGluZUhlaWdodCAqIGxpbmVzLmxlbmd0aDtcbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgKiB0aGlzLnJlc29sdXRpb247XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAoIGhlaWdodCArIHN0eWxlLnBhZGRpbmcgKiAyICogdGhpcy5yZXNvbHV0aW9uICk7XG5cbiAgICAgICAgaWYgKG5hdmlnYXRvci5pc0NvY29vbkpTKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9udFNpemVTdHJpbmcgPSAodHlwZW9mIHN0eWxlLmZvbnRTaXplID09PSAnbnVtYmVyJykgPyBzdHlsZS5mb250U2l6ZSAqIHRoaXMucmVzb2x1dGlvbiArICdweCcgOiBzdHlsZS5mb250U2l6ZTtcbiAgICAgICAgZm9udFN0eWxlID0gc3R5bGUuZm9udFN0eWxlICsgJyAnICsgc3R5bGUuZm9udFZhcmlhbnQgKyAnICcgKyBzdHlsZS5mb250V2VpZ2h0ICsgJyAnICsgZm9udFNpemVTdHJpbmcgKyAnICcgKyBzdHlsZS5mb250RmFtaWx5O1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuICAgICAgICB0aGlzLmNvbnRleHQudGV4dEJhc2VsaW5lID0gc3R5bGUudGV4dEJhc2VsaW5lO1xuICAgICAgICB0aGlzLmNvbnRleHQubGluZUpvaW4gPSBzdHlsZS5saW5lSm9pbjtcbiAgICAgICAgdGhpcy5jb250ZXh0Lm1pdGVyTGltaXQgPSBzdHlsZS5taXRlckxpbWl0O1xuXG4gICAgICAgIHZhciBsaW5lUG9zaXRpb25YO1xuICAgICAgICB2YXIgbGluZVBvc2l0aW9uWTtcblxuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGRyb3BTaGFkb3dDb2xvciA9IHN0eWxlLmRyb3BTaGFkb3dDb2xvcjtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZHJvcFNoYWRvd0NvbG9yID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3dDb2xvciA9IHRoaXMuZ3JhZGllbnRGaWxsKFxuICAgICAgICAgICAgICAgICAgICBkcm9wU2hhZG93Q29sb3IsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0ICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICogdGhpcy5yZXNvbHV0aW9uICsgc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlICogdGhpcy5yZXNvbHV0aW9uXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHhTaGFkb3dPZmZzZXQgPSBNYXRoLmNvcyhzdHlsZS5kcm9wU2hhZG93QW5nbGUpICogc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlO1xuICAgICAgICAgICAgdmFyIHlTaGFkb3dPZmZzZXQgPSBNYXRoLnNpbihzdHlsZS5kcm9wU2hhZG93QW5nbGUpICogc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Q29sb3IgPSBkcm9wU2hhZG93Q29sb3I7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHhTaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHlTaGFkb3dPZmZzZXQ7XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93Qmx1cikge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zaGFkb3dCbHVyID0gc3R5bGUuZHJvcFNoYWRvd0JsdXIgKiB0aGlzLnJlc29sdXRpb24gKiAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Q29sb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3Ryb2tlID0gc3R5bGUuc3Ryb2tlO1xuICAgICAgICBpZiAodHlwZW9mIHN0cm9rZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHN0cm9rZSA9IHRoaXMuZ3JhZGllbnRGaWxsKHN0cm9rZSwgd2lkdGgsIGxpbmVIZWlnaHQgKyBzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gc3Ryb2tlO1xuICAgICAgICB0aGlzLmNvbnRleHQubGluZVdpZHRoID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzICogdGhpcy5yZXNvbHV0aW9uO1xuXG5cbiAgICAgICAgdmFyIGZpbGwgPSBzdHlsZS5maWxsO1xuICAgICAgICBpZiAodHlwZW9mIGZpbGwgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBmaWxsID0gdGhpcy5ncmFkaWVudEZpbGwoXG4gICAgICAgICAgICAgICAgZmlsbCxcbiAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0LFxuICAgICAgICAgICAgICAgIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAqIHRoaXMucmVzb2x1dGlvbiArIHN0eWxlLnBhZGRpbmcgKiB0aGlzLnJlc29sdXRpb25cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCBjYW52YXMgdGV4dCBzdHlsZXNcbiAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IGZpbGw7XG5cbiAgICAgICAgLy9kcmF3IGxpbmVzIGxpbmUgYnkgbGluZVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxpbmVQb3NpdGlvblggPSBzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb24gLyAyO1xuICAgICAgICAgICAgbGluZVBvc2l0aW9uWSA9IChzdHlsZS5zdHJva2VUaGlja25lc3MgKiB0aGlzLnJlc29sdXRpb24gLyAyICsgaSAqIGxpbmVIZWlnaHQpICsgZm9udFByb3BlcnRpZXMuYXNjZW50O1xuXG4gICAgICAgICAgICBpZiAoc3R5bGUuYWxpZ24gPT09ICdyaWdodCcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGluZVBvc2l0aW9uWCArPSBtYXhMaW5lV2lkdGggLSBsaW5lV2lkdGhzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3R5bGUuYWxpZ24gPT09ICdjZW50ZXInKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gKG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV0pIC8gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0eWxlLnN0cm9rZSAmJiBzdHlsZS5zdHJva2VUaGlja25lc3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVRleHQobGluZXNbaV0sIGxpbmVQb3NpdGlvblgsIGxpbmVQb3NpdGlvblkgKyBzdHlsZS5wYWRkaW5nICogdGhpcy5yZXNvbHV0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0eWxlLmZpbGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YLCBsaW5lUG9zaXRpb25ZICsgc3R5bGUucGFkZGluZyAqIHRoaXMucmVzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5zdHJpa2VUaHJvdWdoKVxuICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgdmFyIHRleHRXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBNYXRoLnJvdW5kKGxpbmVQb3NpdGlvblkgLSBsaW5lSGVpZ2h0IC8gNCArIHN0eWxlLnBhZGRpbmcpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KGxpbmVQb3NpdGlvblgsIHksIE1hdGgucm91bmQodGV4dFdpZHRoLndpZHRoKSwgMiAqIHRoaXMucmVzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudXBkYXRlVGV4dHVyZSgpO1xufTtcblxuQ29jb29uVGV4dC5wcm90b3R5cGUuZ3JhZGllbnRGaWxsID0gZnVuY3Rpb24gKG9wdGlvbnMsIHdpZHRoLCBoZWlnaHQsIHBhZGRpbmcpXG57XG4gICAgcGFkZGluZyA9IHBhZGRpbmcgfHwgMDtcbiAgICB3aWR0aCA9IHdpZHRoICsgcGFkZGluZztcbiAgICBoZWlnaHQgPSBoZWlnaHQgKyBwYWRkaW5nO1xuXG4gICAgdmFyIHBhZGRpbmdYLCBwYWRkaW5nWTtcbiAgICBwYWRkaW5nWCA9IHBhZGRpbmdZID0gcGFkZGluZztcblxuICAgIGlmIChvcHRpb25zLnZlcnRpY2FsKSB7XG4gICAgICAgIGhlaWdodCA9IDA7XG4gICAgICAgIHBhZGRpbmdZID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3aWR0aCA9IDA7XG4gICAgICAgIHBhZGRpbmdYID0gMDtcbiAgICB9XG5cbiAgICB2YXIgZ3JhZGllbnQgPSB0aGlzLmNvbnRleHQuY3JlYXRlTGluZWFyR3JhZGllbnQocGFkZGluZ1gsIHBhZGRpbmdZLCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgIHZhciBpLCBpTGVuO1xuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnN0b3BzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmb3IgKGkgPSAwLCBpTGVuID0gb3B0aW9ucy5zdG9wcy5sZW5ndGg7IGkgPCBpTGVuOyBpKyspIHtcbiAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChvcHRpb25zLnN0b3BzW2ldLnN0b3AsIG9wdGlvbnMuc3RvcHNbaV0uY29sb3IpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gMCwgaUxlbiA9IG9wdGlvbnMuc3RvcHMubGVuZ3RoOyBpIDwgaUxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3RvcCA9IGkgLyBpTGVuO1xuICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKHN0b3AsIG9wdGlvbnMuc3RvcHNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyYWRpZW50O1xufTtcblxuQ29jb29uVGV4dC5wcm90b3R5cGUuYmx1ciA9IGZ1bmN0aW9uIChpdGVyYXRpb25zLCBzdHJlbmd0aCwgYWxwaGEpIHtcbiAgICB2YXIgeCA9IDA7XG4gICAgdmFyIHkgPSAwO1xuXG4gICAgLy8gQ29weSB0aGUgY3VycmVudCBwaXhlbHMgdG8gYmUgdXNlZCBhcyBhIHN0ZW5jaWxcbiAgICB2YXIgbmV3Q2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIGNvbnRleHQgPSBuZXdDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBuZXdDYW52YXMud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aDtcbiAgICBuZXdDYW52YXMuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKHRoaXMuY2FudmFzLCAwLCAwKTtcblxuICAgIHZhciBvbGRBbHBoYSA9IHRoaXMuY29udGV4dC5nbG9iYWxBbHBoYTtcbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSBhbHBoYSAvIChpdGVyYXRpb25zICogNCk7XG4gICAgdGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcblxuICAgIC8vIEFwcGx5IGJsdXJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZXJhdGlvbnMgKiA0OyArK2kpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGkgJSA0O1xuICAgICAgICB2YXIgb2Zmc2V0ID0gKChpICsgMSkgLyA0KSAqIHRoaXMucmVzb2x1dGlvbjtcbiAgICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgMDogIC8vIFVwLlxuICAgICAgICAgICAgICAgIHkgLT0gb2Zmc2V0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE6ICAvLyBSaWdodC5cbiAgICAgICAgICAgICAgICB4ICs9IG9mZnNldDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOiAgLy8gRG93bi5cbiAgICAgICAgICAgICAgICB5ICs9IG9mZnNldDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOiAgLy8gTGVmdC5cbiAgICAgICAgICAgICAgICB4IC09IG9mZnNldDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UobmV3Q2FudmFzLCB4LCB5KTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSBvbGRBbHBoYTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0ZXh0dXJlIHNpemUgYmFzZWQgb24gY2FudmFzIHNpemVcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS51cGRhdGVUZXh0dXJlID0gZnVuY3Rpb24gKClcbntcbiAgICB2YXIgdGV4dHVyZSA9IHRoaXMuX3RleHR1cmU7XG5cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5oYXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLnJlc29sdXRpb24gPSB0aGlzLnJlc29sdXRpb247XG5cbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB9XG5cbiAgICB0ZXh0dXJlLm9yaWcud2lkdGggPSB0ZXh0dXJlLl9mcmFtZS53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRleHR1cmUub3JpZy5oZWlnaHQgPSB0ZXh0dXJlLl9mcmFtZS5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0ZXh0dXJlLnRyaW0ueCA9IDA7XG4gICAgdGV4dHVyZS50cmltLnkgPSAwOyAvLy10aGlzLl9zdHlsZS5wYWRkaW5nICogdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdGV4dHVyZS50cmltLndpZHRoID0gdGV4dHVyZS5fZnJhbWUud2lkdGg7XG4gICAgdGV4dHVyZS50cmltLmhlaWdodCA9IHRleHR1cmUuX2ZyYW1lLmhlaWdodDsvLyAtIHRoaXMuX3N0eWxlLnBhZGRpbmcgKiAyICogdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdGhpcy5fd2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0aGlzLnNjYWxlLnggPSAxO1xuICAgIHRoaXMuc2NhbGUueSA9IDE7XG5cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5lbWl0KCd1cGRhdGUnLCAgdGV4dHVyZS5iYXNlVGV4dHVyZSk7XG4gICAgfVxuXG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhc2NlbnQsIGRlc2NlbnQgYW5kIGZvbnRTaXplIG9mIGEgZ2l2ZW4gZm9udFN0eWxlXG4gKlxuICogQHBhcmFtIGZvbnRTdHlsZSB7b2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZGV0ZXJtaW5lRm9udFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoc3R5bGUpXG57XG4gICAgdmFyIGZvbnRTaXplU3RyaW5nID0gKHR5cGVvZiBzdHlsZS5mb250U2l6ZSA9PT0gJ251bWJlcicpID8gc3R5bGUuZm9udFNpemUgKiB0aGlzLnJlc29sdXRpb24gKyAncHgnIDogc3R5bGUuZm9udFNpemU7XG4gICAgdmFyIGZvbnRTdHlsZSA9IHN0eWxlLmZvbnRTdHlsZSArICcgJyArIHN0eWxlLmZvbnRWYXJpYW50ICsgJyAnICsgc3R5bGUuZm9udFdlaWdodCArICcgJyArIGZvbnRTaXplU3RyaW5nICsgJyAnICsgc3R5bGUuZm9udEZhbWlseTtcblxuICAgIHZhciBwcm9wZXJ0aWVzID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FjaGVbZm9udFN0eWxlXTtcblxuICAgIGlmICghcHJvcGVydGllcylcbiAgICB7XG4gICAgICAgIHByb3BlcnRpZXMgPSB7fTtcblxuICAgICAgICB2YXIgY2FudmFzID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FudmFzO1xuICAgICAgICB2YXIgY29udGV4dCA9IFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NvbnRleHQ7XG5cbiAgICAgICAgY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuXG4gICAgICAgIHZhciB3aWR0aCA9IE1hdGguY2VpbChjb250ZXh0Lm1lYXN1cmVUZXh0KCd8TcOJcScpLndpZHRoKTtcbiAgICAgICAgdmFyIGJhc2VsaW5lID0gTWF0aC5jZWlsKGNvbnRleHQubWVhc3VyZVRleHQoJ00nKS53aWR0aCk7XG4gICAgICAgIHZhciBoZWlnaHQgPSAyICogYmFzZWxpbmU7XG5cbiAgICAgICAgLy8gYmFzZWxpbmUgZmFjdG9yIGRlcGVuZHMgYSBsb3Qgb2YgdGhlIGZvbnQuIHRvZG8gOiBsZXQgdXNlciBzcGVjaWZ5IGEgZmFjdG9yIHBlciBmb250IG5hbWUgP1xuICAgICAgICBiYXNlbGluZSA9IGJhc2VsaW5lICogMS4yIHwgMDtcblxuICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjZjAwJztcbiAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgICAgICBjb250ZXh0LmZvbnQgPSBmb250U3R5bGU7XG5cbiAgICAgICAgY29udGV4dC50ZXh0QmFzZWxpbmUgPSAnYWxwaGFiZXRpYyc7XG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyMwMDAnO1xuICAgICAgICBjb250ZXh0LmZpbGxUZXh0KCd8TcOJcScsIDAsIGJhc2VsaW5lKTtcblxuICAgICAgICB2YXIgaW1hZ2VkYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCkuZGF0YTtcbiAgICAgICAgdmFyIHBpeGVscyA9IGltYWdlZGF0YS5sZW5ndGg7XG4gICAgICAgIHZhciBsaW5lID0gd2lkdGggKiA0O1xuXG4gICAgICAgIHZhciBpLCBqO1xuXG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgc3RvcCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGFzY2VudC4gc2NhbiBmcm9tIHRvcCB0byBib3R0b20gdW50aWwgd2UgZmluZCBhIG5vbiByZWQgcGl4ZWxcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGJhc2VsaW5lOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsaW5lOyBqICs9IDQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGltYWdlZGF0YVtpZHggKyBqXSAhPT0gMjU1KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RvcClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZHggKz0gbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BlcnRpZXMuYXNjZW50ID0gYmFzZWxpbmUgLSBpO1xuXG4gICAgICAgIGlkeCA9IHBpeGVscyAtIGxpbmU7XG4gICAgICAgIHN0b3AgPSBmYWxzZTtcblxuICAgICAgICAvLyBkZXNjZW50LiBzY2FuIGZyb20gYm90dG9tIHRvIHRvcCB1bnRpbCB3ZSBmaW5kIGEgbm9uIHJlZCBwaXhlbFxuICAgICAgICBmb3IgKGkgPSBoZWlnaHQ7IGkgPiBiYXNlbGluZTsgaS0tKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbGluZTsgaiArPSA0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChpbWFnZWRhdGFbaWR4ICsgal0gIT09IDI1NSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXN0b3ApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWR4IC09IGxpbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wZXJ0aWVzLmRlc2NlbnQgPSBpIC0gYmFzZWxpbmU7XG4gICAgICAgIHByb3BlcnRpZXMuZm9udFNpemUgPSBwcm9wZXJ0aWVzLmFzY2VudCArIHByb3BlcnRpZXMuZGVzY2VudDtcblxuICAgICAgICBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYWNoZVtmb250U3R5bGVdID0gcHJvcGVydGllcztcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvcGVydGllcztcbn07XG5cbi8qKlxuICogQXBwbGllcyBuZXdsaW5lcyB0byBhIHN0cmluZyB0byBoYXZlIGl0IG9wdGltYWxseSBmaXQgaW50byB0aGUgaG9yaXpvbnRhbFxuICogYm91bmRzIHNldCBieSB0aGUgVGV4dCBvYmplY3QncyB3b3JkV3JhcFdpZHRoIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSB0ZXh0IHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS53b3JkV3JhcCA9IGZ1bmN0aW9uICh0ZXh0KVxue1xuICAgIC8vIEdyZWVkeSB3cmFwcGluZyBhbGdvcml0aG0gdGhhdCB3aWxsIHdyYXAgd29yZHMgYXMgdGhlIGxpbmUgZ3Jvd3MgbG9uZ2VyXG4gICAgLy8gdGhhbiBpdHMgaG9yaXpvbnRhbCBib3VuZHMuXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIHZhciBsaW5lcyA9IHRleHQuc3BsaXQoJ1xcbicpO1xuICAgIHZhciB3b3JkV3JhcFdpZHRoID0gdGhpcy5fc3R5bGUud29yZFdyYXBXaWR0aCAqIHRoaXMucmVzb2x1dGlvbjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgIHtcbiAgICAgICAgdmFyIHNwYWNlTGVmdCA9IHdvcmRXcmFwV2lkdGg7XG4gICAgICAgIHZhciB3b3JkcyA9IGxpbmVzW2ldLnNwbGl0KCcgJyk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgd29yZHMubGVuZ3RoOyBqKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciB3b3JkV2lkdGggPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQod29yZHNbal0pLndpZHRoO1xuICAgICAgICAgICAgdmFyIHdvcmRXaWR0aFdpdGhTcGFjZSA9IHdvcmRXaWR0aCArIHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dCgnICcpLndpZHRoO1xuICAgICAgICAgICAgaWYgKGogPT09IDAgfHwgd29yZFdpZHRoV2l0aFNwYWNlID4gc3BhY2VMZWZ0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIFNraXAgcHJpbnRpbmcgdGhlIG5ld2xpbmUgaWYgaXQncyB0aGUgZmlyc3Qgd29yZCBvZiB0aGUgbGluZSB0aGF0IGlzXG4gICAgICAgICAgICAgICAgLy8gZ3JlYXRlciB0aGFuIHRoZSB3b3JkIHdyYXAgd2lkdGguXG4gICAgICAgICAgICAgICAgaWYgKGogPiAwKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gd29yZHNbal07XG4gICAgICAgICAgICAgICAgc3BhY2VMZWZ0ID0gd29yZFdyYXBXaWR0aCAtIHdvcmRXaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzcGFjZUxlZnQgLT0gd29yZFdpZHRoV2l0aFNwYWNlO1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnICcgKyB3b3Jkc1tqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpIDwgbGluZXMubGVuZ3RoLTEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFxuJztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBvYmplY3QgdXNpbmcgdGhlIFdlYkdMIHJlbmRlcmVyXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIHtXZWJHTFJlbmRlcmVyfVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5yZW5kZXJXZWJHTCA9IGZ1bmN0aW9uIChyZW5kZXJlcilcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIFBJWEkuU3ByaXRlLnByb3RvdHlwZS5yZW5kZXJXZWJHTC5jYWxsKHRoaXMsIHJlbmRlcmVyKTtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0aGUgb2JqZWN0IHVzaW5nIHRoZSBDYW52YXMgcmVuZGVyZXJcbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIge0NhbnZhc1JlbmRlcmVyfVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuX3JlbmRlckNhbnZhcyA9IGZ1bmN0aW9uIChyZW5kZXJlcilcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIFBJWEkuU3ByaXRlLnByb3RvdHlwZS5fcmVuZGVyQ2FudmFzLmNhbGwodGhpcywgcmVuZGVyZXIpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBib3VuZHMgb2YgdGhlIFRleHQgYXMgYSByZWN0YW5nbGUuIFRoZSBib3VuZHMgY2FsY3VsYXRpb24gdGFrZXMgdGhlIHdvcmxkVHJhbnNmb3JtIGludG8gYWNjb3VudC5cbiAqXG4gKiBAcGFyYW0gbWF0cml4IHtNYXRyaXh9IHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggb2YgdGhlIFRleHRcbiAqIEByZXR1cm4ge1JlY3RhbmdsZX0gdGhlIGZyYW1pbmcgcmVjdGFuZ2xlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLmdldEJvdW5kcyA9IGZ1bmN0aW9uIChtYXRyaXgpXG57XG4gICAgaWYgKHRoaXMuZGlydHkpXG4gICAge1xuICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUElYSS5TcHJpdGUucHJvdG90eXBlLmdldEJvdW5kcy5jYWxsKHRoaXMsIG1hdHJpeCk7XG59O1xuXG4vKipcbiAqIERlc3Ryb3lzIHRoaXMgdGV4dCBvYmplY3QuXG4gKlxuICogQHBhcmFtIFtkZXN0cm95QmFzZVRleHR1cmU9dHJ1ZV0ge2Jvb2xlYW59IHdoZXRoZXIgdG8gZGVzdHJveSB0aGUgYmFzZSB0ZXh0dXJlIGFzIHdlbGxcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIChkZXN0cm95QmFzZVRleHR1cmUpXG57XG4gICAgLy8gbWFrZSBzdXJlIHRvIHJlc2V0IHRoZSB0aGUgY29udGV4dCBhbmQgY2FudmFzLi4gZG9udCB3YW50IHRoaXMgaGFuZ2luZyBhcm91bmQgaW4gbWVtb3J5IVxuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgdGhpcy5jYW52YXMgPSBudWxsO1xuXG4gICAgdGhpcy5fc3R5bGUgPSBudWxsO1xuXG4gICAgdGhpcy5fdGV4dHVyZS5kZXN0cm95KGRlc3Ryb3lCYXNlVGV4dHVyZSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGRlc3Ryb3lCYXNlVGV4dHVyZSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IFRFWFRfUkVTT0xVVElPTiAtIERlZmF1bHQgcmVzb2x1dGlvbiBvZiBhIG5ldyBDb2Nvb25UZXh0XG4gICAgICogQGNvbnN0YW50XG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIFRFWFRfUkVTT0xVVElPTjoxXG59O1xuIl19
