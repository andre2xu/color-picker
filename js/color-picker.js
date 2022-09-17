const ColorPicker = (function() {
    const COLOR_MODELS = ['rgb', 'hex', 'hsv', 'hsl'];

    const ColorPickerConstructor = function(parentElement, width, height) {
        const COLOR_PICKER_PARENT = parentElement;
        if (width < 250) { width = 250; height = 200; }

        let colorPickerParts = [];

        // COMPONENTS
        const COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER = __generatePart__(
            'div',
            {
                class: 'color-preview-AND-color-variant-picker-AND-color-picker-container',
                style: 'width:' + width + 'px; height:' + height + 'px'
            }
        );
        const COLOR_PREVIEW_AND_CVP_CONTAINER = __generatePart__(
            'div',
            { class: 'color-preview-AND-color-variant-picker-container' }
        );
        const COLOR_SPACE_DISPLAY = __generatePart__(
            'div',
            { class: 'rgb-hex-hsv-hsl-display' }
        );
        const COLOR_SPACE_DISPLAY_LEFT_ARROW = __generatePart__(
            'div',
            { class: 'arrow left-arrow disabled-left-arrow' }
        );
        const COLOR_SPACE_DISPLAY_RIGHT_ARROW = __generatePart__(
            'div',
            { class: 'arrow right-arrow' }
        );
        const COLOR_SPACE_DISPLAY_CONTENT = __generatePart__(
            'input',
            {
                type: 'text',
                value: 'rgb(255,0,0)',
            }
        );
        const COLOR_PREVIEW_BACKGROUND = __generatePart__(
            'div',
            { class: 'color-preview-background' }
        );
        const COLOR_PREVIEW = __generatePart__(
            'div',
            { class: 'color-preview' }
        ); 
        const ALPHA_CHANNEL_VALUE = __generatePart__('span');
        const COLOR_VARIANT_PICKER = __generatePart__(
            'div',
            { class: 'color-variant-picker' }
        );
        const CVP_SLIDER = __generatePart__(
            'div',
            {
                class: 'color-variant-picker-slider',
                style: 'transform: translateX(-100%)'
            }
        );
        const COLOR_PICKER = __generatePart__(
            'div',
            { class: 'color-picker' }
        );
        const CP_SLIDER = __generatePart__(
            'div',
            {
                class: 'color-picker-slider',
                style: 'transform: translateY(-50%)'
            }
        );
        const ALPHA_CHANNEL_CONTROL = __generatePart__(
            'input',
            {
                class: 'alpha-channel-control',
                type: 'range',
                min: 0.0,
                max: 1.0,
                step: 'any',
                value: 1.0
            }
        );

        // COLOR PALETTES
        const CP_PALETTE = __generatePart__(
            'canvas',
            {
                ariaHidden: 'true',
                class: 'color-picker-palette'
            }
        );
        const CP_PALETTE_CONTEXT = CP_PALETTE.getContext('2d');
        const CVP_PALETTE = __generatePart__(
            'canvas',
            {
                ariaHidden: 'true',
                class: 'color-variant-picker-palette'
            }
        );
        const CVP_PALETTE_CONTEXT = CVP_PALETTE.getContext('2d');

        // building color picker
        colorPickerParts.push(__joinPartsWith__(
            COLOR_SPACE_DISPLAY,
            [ COLOR_SPACE_DISPLAY_LEFT_ARROW, COLOR_SPACE_DISPLAY_CONTENT, COLOR_SPACE_DISPLAY_RIGHT_ARROW ]
        ));
        colorPickerParts.push(__joinPartsWith__(
            COLOR_PREVIEW_AND_CVP_CONTAINER,
            [
                __joinPartsWith__(
                    COLOR_PREVIEW_BACKGROUND,
                    [
                        __joinPartsWith__(
                            COLOR_PREVIEW,
                            [ ALPHA_CHANNEL_VALUE ]
                        )
                    ]
                ),
                __joinPartsWith__(
                    COLOR_VARIANT_PICKER,
                    [ CVP_SLIDER ]
                )
            ]
        ));
        colorPickerParts.push(__joinPartsWith__(
            COLOR_PICKER,
            [ CP_SLIDER ]
        ));
        colorPickerParts.push(ALPHA_CHANNEL_CONTROL);

        __joinPartsWith__(
            COLOR_PICKER_PARENT,
            [ __joinPartsWith__(COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER, colorPickerParts) ]
        );
        COLOR_PICKER_PARENT.insertBefore(CP_PALETTE, COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER);
        COLOR_PICKER_PARENT.insertBefore(CVP_PALETTE, COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER);



        // GENERAL DATA
        let rgba = {r:255, g:0, b:0, a:255};
        let currentColorModel = 'rgb';
        let colorModelsArrayIndex = 0;
        let allHuesInColorPicker = [];
        let allHuePosXInColorPicker = [];

        let sliderBeingHeld = {
            colorPickerSlider: false,
            colorVariantPickerSlider: false,
            alphaChannelControl: false
        };

        // COLOR PICKER DATA
        let cp_rect = COLOR_PICKER.getBoundingClientRect();
        let cp_sliderRect = CP_SLIDER.getBoundingClientRect();
        let cpSliderWidth = Math.round(cp_sliderRect.width);
        let cp_offsetX_from_parentLeft = Math.round(cp_rect.left);
        let cp_rightBoundary = Math.round(cp_rect.width) - 1;
        let cp_sliderOffsetX_from_rightBoundary = cp_rightBoundary - cpSliderWidth;
        let cp_translationChangeMarker = Math.round(cp_rect.width * 0.8);
        let cp_sliderStyles = CP_SLIDER.style;
        let cp_sliderCenterX = Math.round(cpSliderWidth * 0.5);
        let cp_sliderPosX = 0, cp_sliderPreviousPosX = 0;
        let cp_paletteWidth = Math.round(cp_rect.width);
        let cp_paletteHeight = 1;
        CP_PALETTE.width = cp_paletteWidth;
        CP_PALETTE.height = cp_paletteHeight;
        CP_PALETTE_CONTEXT.fillStyle = __generateLinearGradient__(
            CP_PALETTE_CONTEXT,
            0,
            0,
            cp_paletteWidth,
            cp_paletteHeight,
            [ 0.0, 'rgb(255,0,0)', 0.17, '#ff0', 0.33, 'lime', 0.5, 'cyan', 0.66, 'blue', 0.83, '#f0f', 1.0, 'red' ]
        )
        CP_PALETTE_CONTEXT.fillRect(0, 0, cp_paletteWidth, cp_paletteHeight);
        let cp_paletteImageData = CP_PALETTE_CONTEXT.getImageData(0, 0, cp_paletteWidth, cp_paletteHeight).data;
        let cp_paletteCursor = 0;

        // COLOR VARIANT PICKER DATA
        let cvp_rect = COLOR_VARIANT_PICKER.getBoundingClientRect();
        let cvp_sliderRect = CVP_SLIDER.getBoundingClientRect();
        let cvp_offsetX_from_parentLeft = Math.round(cvp_rect.left);
        let cvp_offsetX_from_parentTop = Math.round(cvp_rect.top);
        let cvp_rightBoundary = Math.round(cvp_rect.width);
        let cvp_bottomBoundary = Math.round(cvp_rect.height) - 1;
        let cvp_sliderStyles = CVP_SLIDER.style;
        let cvp_sliderCenterX = Math.round(cvp_sliderRect.width * 0.5);
        let cvp_sliderCenterY = Math.round(cvp_sliderRect.height * 0.5);
        let cvp_paletteWidth = Math.round(cvp_rect.width);
        let cvp_paletteHeight = Math.round(cvp_rect.height);
        CVP_PALETTE.width = cvp_paletteWidth;
        CVP_PALETTE.height = cvp_paletteHeight;
        let cvp_paletteImageData;
        let cvp_paletteImageDataWidth = cvp_paletteWidth * 4;
        let cvp_paletteCursor = (cvp_paletteWidth - 1) * 4;

        // ALPHA CHANNEL CONTROL DATA
        let accClasslist = ALPHA_CHANNEL_VALUE.classList;

        // COLOR_SPACE DATA
        let colorSpaceDisplayRect = COLOR_SPACE_DISPLAY.getBoundingClientRect();
        COLOR_SPACE_DISPLAY_LEFT_ARROW.style.borderWidth = Math.round(colorSpaceDisplayRect.width * 0.04).toString() + 'px';
        COLOR_SPACE_DISPLAY_RIGHT_ARROW.style.borderWidth = Math.round(colorSpaceDisplayRect.width * 0.04).toString() + 'px';



        // INITIALIZATION
        __moveSlider__(cvp_sliderStyles, (cvp_rightBoundary + cvp_sliderCenterX), -cvp_sliderCenterY);
        __updateColorVariantPickerPalette__();
        __getPosXAndHuesOfAllColorsInColorPicker__();



        // MECHANISM
        COLOR_PICKER.addEventListener('mousemove', function (event) {
            if (sliderBeingHeld['colorPickerSlider']) {
                const mousePosX = event.x - cp_offsetX_from_parentLeft;
                let cp_sliderNewPosX = mousePosX - cp_sliderCenterX;
                const sliderHasNegativeTranslationX = __hasNegativeTranslationXY__(cp_sliderStyles, 'x');

                if (cp_sliderNewPosX >= cp_translationChangeMarker) {
                    if (sliderHasNegativeTranslationX == false) {
                        __enableNegativeTranslationX__(cp_sliderStyles);
                        cp_sliderNewPosX = cp_rightBoundary - cp_sliderRect.width;
                    }

                    cp_sliderNewPosX = mousePosX + cp_sliderCenterX;
                }
                else if (sliderHasNegativeTranslationX) {
                    __disableNegativeTranslationX__(cp_sliderStyles);
                }

                cp_sliderPosX += Math.round(cp_sliderNewPosX - cp_sliderPreviousPosX);
                cp_sliderPreviousPosX = cp_sliderNewPosX;

                if (cp_sliderPosX >= 0 && cp_sliderPosX <= cp_rightBoundary) {
                    __moveSlider__(cp_sliderStyles, cp_sliderPosX);

                    cp_paletteCursor = cp_sliderPosX * 4;
                    rgba['r'] = cp_paletteImageData[cp_paletteCursor];
                    rgba['g'] = cp_paletteImageData[cp_paletteCursor + 1];
                    rgba['b'] = cp_paletteImageData[cp_paletteCursor + 2];

                    __updateColorVariantPicker__();
                    __updateColorVariantPickerPalette__();
                    __updateColorPreview__();
                    __updateColorSpaceDisplay__(currentColorModel);
                }
            }
        });

        COLOR_PICKER.addEventListener('mouseleave', function () {
            sliderBeingHeld['colorPickerSlider'] = false;
        });

        COLOR_VARIANT_PICKER.addEventListener('mousemove', function (event) {
            if (sliderBeingHeld['colorVariantPickerSlider']) {
                let mousePosX = event.x - cvp_offsetX_from_parentLeft;
                let mousePosY = event.y - cvp_offsetX_from_parentTop;
                let cvp_sliderNewPosX = mousePosX + cvp_sliderCenterX;
                let cvp_sliderNewPosY = mousePosY - cvp_sliderCenterY;
                const sliderHasNegativeTranslationX = __hasNegativeTranslationXY__(cvp_sliderStyles, 'x');
                const sliderHasNegativeTranslationY = __hasNegativeTranslationXY__(cvp_sliderStyles, 'y');

                // corrects slider positioning near edges
                if (cvp_sliderNewPosX <= cvp_sliderRect.width) {
                    if (sliderHasNegativeTranslationX) {
                        __disableNegativeTranslationX__(cvp_sliderStyles);
                    }

                    cvp_sliderNewPosX = mousePosX - cvp_sliderCenterX;
                }
                else if (sliderHasNegativeTranslationX == false) {
                    __enableNegativeTranslationX__(cvp_sliderStyles);
                }

                if (cvp_sliderNewPosY >= (cvp_bottomBoundary - cvp_sliderRect.height)) {
                    if (sliderHasNegativeTranslationY == false) {
                        __enableNegativeTranslationY__(cvp_sliderStyles);
                    }

                    cvp_sliderNewPosY = mousePosY + cvp_sliderCenterY;
                }
                else if (sliderHasNegativeTranslationY) {
                    __disableNegativeTranslationY__(cvp_sliderStyles);
                }

                // moves slider
                const isWithinLeftAndRightBoundaries = cvp_sliderNewPosX >= -cvp_sliderCenterX && cvp_sliderNewPosX <= (cvp_rightBoundary + cvp_sliderCenterX);

                const isWithinTopAndBottomBoundaries = cvp_sliderNewPosY >= -cvp_sliderCenterY && cvp_sliderNewPosY <= (cvp_bottomBoundary + cvp_sliderCenterY);

                if (isWithinLeftAndRightBoundaries && isWithinTopAndBottomBoundaries) {
                    __moveSlider__(cvp_sliderStyles, cvp_sliderNewPosX, cvp_sliderNewPosY);

                    if (mousePosX >= cvp_rightBoundary) {
                        mousePosX -= 1;
                    }

                    cvp_paletteCursor = __getCVPCursorValue__(mousePosX, mousePosY);
                    rgba['r'] = cvp_paletteImageData[cvp_paletteCursor];
                    rgba['g'] = cvp_paletteImageData[cvp_paletteCursor + 1];
                    rgba['b'] = cvp_paletteImageData[cvp_paletteCursor + 2];

                    __updateColorPreview__();
                    __updateColorSpaceDisplay__(currentColorModel);
                }
            }
        });

        COLOR_VARIANT_PICKER.addEventListener('mouseleave', function () {
            sliderBeingHeld['colorVariantPickerSlider'] = false;
        });

        ALPHA_CHANNEL_CONTROL.addEventListener('mousemove', function () {
            if (sliderBeingHeld['alphaChannelControl']) {
                __applyAndDisplayColorOpacity__(ALPHA_CHANNEL_CONTROL.value);
            }
        });

        ALPHA_CHANNEL_CONTROL.addEventListener('change', function () {
            __applyAndDisplayColorOpacity__(ALPHA_CHANNEL_CONTROL.value);
        });

        COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER.addEventListener('mousedown', function (event) {
            const target = event.target;
            if (target != ALPHA_CHANNEL_CONTROL && target != COLOR_SPACE_DISPLAY_CONTENT) { event.preventDefault(); }

            // FLAGS
            if (target == CP_SLIDER) {
                sliderBeingHeld['colorPickerSlider'] = true;
            }
            if (target == CVP_SLIDER) {
                sliderBeingHeld['colorVariantPickerSlider'] = true;
            }
            if (target == ALPHA_CHANNEL_CONTROL) {
                sliderBeingHeld['alphaChannelControl'] = true;
            }

            // MOVEMENT
            if (target == COLOR_PICKER) {
                const mousePosX = event.x - cp_offsetX_from_parentLeft;
                let cp_sliderNewPosX = mousePosX - cp_sliderCenterX;
                const sliderHasNegativeTranslationX = __hasNegativeTranslationXY__(cp_sliderStyles, 'x');

                // corrects slider positioning near edges
                if (cp_sliderNewPosX <= cpSliderWidth && cp_sliderNewPosX < 0) {
                    if (sliderHasNegativeTranslationX) {
                        __disableNegativeTranslationX__(cp_sliderStyles);
                    }

                    cp_sliderNewPosX = mousePosX;
                }
                else if (cp_sliderNewPosX >= cp_sliderOffsetX_from_rightBoundary) {
                    if (sliderHasNegativeTranslationX == false) {
                        __enableNegativeTranslationX__(cp_sliderStyles);
                    }

                    cp_sliderNewPosX = mousePosX;
                }
                else if (sliderHasNegativeTranslationX == true && cp_sliderNewPosX < cp_sliderOffsetX_from_rightBoundary) {
                    __disableNegativeTranslationX__(cp_sliderStyles);
                }

                // moves slider
                if (cp_sliderNewPosX >= 0 && cp_sliderNewPosX <= cp_rightBoundary) {
                    __moveSlider__(cp_sliderStyles, cp_sliderNewPosX);

                    cp_paletteCursor = mousePosX * 4;

                    rgba['r'] = cp_paletteImageData[cp_paletteCursor];
                    rgba['g'] = cp_paletteImageData[cp_paletteCursor + 1];
                    rgba['b'] = cp_paletteImageData[cp_paletteCursor + 2];

                    __updateColorVariantPicker__();
                    __updateColorVariantPickerPalette__();
                    __updateColorPreview__();
                    __updateColorSpaceDisplay__(currentColorModel);
                }
            }
            else if (target == COLOR_VARIANT_PICKER || target == CVP_SLIDER) {
                let mousePosX = event.x - cvp_offsetX_from_parentLeft
                let mousePosY = event.y - cvp_offsetX_from_parentTop;
                let cvp_sliderNewPosX = mousePosX + cvp_sliderCenterX;
                let cvp_sliderNewPosY = mousePosY - cvp_sliderCenterY;
                const sliderHasNegativeTranslationX = __hasNegativeTranslationXY__(cvp_sliderStyles, 'x');
                const sliderHasNegativeTranslationY = __hasNegativeTranslationXY__(cvp_sliderStyles, 'y');

                // corrects slider positioning near edges
                if (cvp_sliderNewPosX <= cvp_sliderRect.width) {
                    if (sliderHasNegativeTranslationX) {
                        __disableNegativeTranslationX__(cvp_sliderStyles);
                    }

                    cvp_sliderNewPosX = mousePosX - cvp_sliderCenterX;
                }
                else if (sliderHasNegativeTranslationX == false) {
                    __enableNegativeTranslationX__(cvp_sliderStyles);
                }

                if (cvp_sliderNewPosY >= (cvp_bottomBoundary - cvp_sliderRect.height)) {
                    if (sliderHasNegativeTranslationY == false) {
                        __enableNegativeTranslationY__(cvp_sliderStyles);
                    }

                    cvp_sliderNewPosY = mousePosY + cvp_sliderCenterY;
                }
                else if (sliderHasNegativeTranslationY) {
                    __disableNegativeTranslationY__(cvp_sliderStyles);
                }

                // moves slider
                const isWithinLeftAndRightBoundaries = cvp_sliderNewPosX >= -cvp_sliderCenterX && cvp_sliderNewPosX <= (cvp_rightBoundary + cvp_sliderCenterX);

                const isWithinTopAndBottomBoundaries = cvp_sliderNewPosY >= -cvp_sliderCenterY && cvp_sliderNewPosY <= (cvp_bottomBoundary + cvp_sliderCenterY); 

                if (isWithinLeftAndRightBoundaries && isWithinTopAndBottomBoundaries) {
                    __moveSlider__(cvp_sliderStyles, cvp_sliderNewPosX, cvp_sliderNewPosY);
                }

                // updating colors
                if (mousePosX <= 0) {
                    mousePosX = 0;
                }
                else if (mousePosX >= cvp_rightBoundary) {
                    mousePosX = cvp_rightBoundary - 1;
                }

                if (mousePosY <= 0) {
                    mousePosY = 0;
                }
                else if (mousePosY >= cvp_bottomBoundary) {
                    mousePosY = cvp_bottomBoundary - 1;
                }

                cvp_paletteCursor = __getCVPCursorValue__(mousePosX, mousePosY);

                rgba['r'] = cvp_paletteImageData[cvp_paletteCursor];
                rgba['g'] = cvp_paletteImageData[cvp_paletteCursor + 1];
                rgba['b'] = cvp_paletteImageData[cvp_paletteCursor + 2];

                __updateColorPreview__();
                __updateColorSpaceDisplay__(currentColorModel);
            }
            else if (target == COLOR_SPACE_DISPLAY_LEFT_ARROW) {
                const newIndexValue = colorModelsArrayIndex - 1;
                if (newIndexValue >= 0) {
                    if (newIndexValue > 0 && COLOR_SPACE_DISPLAY_RIGHT_ARROW.classList.contains('disabled-right-arrow')) {
                        COLOR_SPACE_DISPLAY_RIGHT_ARROW.classList.remove('disabled-right-arrow');
                    }
                    else if (newIndexValue == 0) {
                        COLOR_SPACE_DISPLAY_LEFT_ARROW.classList.add('disabled-left-arrow');
                    }

                    colorModelsArrayIndex = newIndexValue;
                    currentColorModel = COLOR_MODELS[colorModelsArrayIndex];
                    __updateColorSpaceDisplay__(currentColorModel);
                }
            }
            else if (target == COLOR_SPACE_DISPLAY_RIGHT_ARROW) {
                const newIndexValue = colorModelsArrayIndex + 1;
                if (newIndexValue <= 3) {
                    if (newIndexValue < 3 && COLOR_SPACE_DISPLAY_LEFT_ARROW.classList.contains('disabled-left-arrow')) {
                        COLOR_SPACE_DISPLAY_LEFT_ARROW.classList.remove('disabled-left-arrow');
                    }
                    else if (newIndexValue == 3) {
                        COLOR_SPACE_DISPLAY_RIGHT_ARROW.classList.add('disabled-right-arrow');
                    }

                    colorModelsArrayIndex = newIndexValue;
                    currentColorModel = COLOR_MODELS[colorModelsArrayIndex];
                    __updateColorSpaceDisplay__(currentColorModel);
                }
            }
        });

        COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER.addEventListener('mouseup', function (event) {
            const target = event.target;

            if (target == CP_SLIDER) {
                sliderBeingHeld['colorPickerSlider'] = false;
            }
            if (target == CVP_SLIDER) {
                sliderBeingHeld['colorVariantPickerSlider'] = false;
            }
            if (target == ALPHA_CHANNEL_CONTROL) {
                sliderBeingHeld['alphaChannelControl'] = false;
            }
        });

        COLOR_SPACE_DISPLAY_CONTENT.addEventListener('keyup', function (event) {
            // prevents spacing
            if (event.key == ' ' || event.key == 'v' || event.key == 'Control') {
                COLOR_SPACE_DISPLAY_CONTENT.value = COLOR_SPACE_DISPLAY_CONTENT.value.replace(' ', '');
            }

            __processColorSpaceDisplayContent__(COLOR_SPACE_DISPLAY_CONTENT.value);
        });

        COLOR_SPACE_DISPLAY_CONTENT.addEventListener('paste', function (event) {
            const CURRENTLY_DISPLAYED_CONTENT = COLOR_SPACE_DISPLAY_CONTENT.value;

            if (/^rgb|hsv|hsl/.test(CURRENTLY_DISPLAYED_CONTENT)) {
                COLOR_SPACE_DISPLAY_CONTENT.value = CURRENTLY_DISPLAYED_CONTENT.slice(0,4) + event.clipboardData.getData('Text').replace(/ /g, '') + CURRENTLY_DISPLAYED_CONTENT[CURRENTLY_DISPLAYED_CONTENT.length - 1];
            }

            event.preventDefault();

            __processColorSpaceDisplayContent__(COLOR_SPACE_DISPLAY_CONTENT.value);
        });



        // PUBLIC METHODS
        this.findColor = function (r, g, b) {
            rgba['r'] = r;
            rgba['g'] = g;
            rgba['b'] = b;

            __updateColorSpaceDisplay__(currentColorModel);
            __updateColorPreview__();
            __locateColor__();
        };

        this.hide = function () {
            COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER.classList.add('hide');
        };
        this.hide(); // color picker is hidden by default

        this.show = function () {
            COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER.classList.remove('hide');
        };

        this.resize = function (newWidth, newHeight) {
            COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER.style.width = newWidth.toString() + 'px';
            COLOR_PREVIEW_AND_CVP_AND_CP_CONTAINER.style.height = newHeight.toString() + 'px';

            // re-calculating data for color picker palette
            cp_rect = COLOR_PICKER.getBoundingClientRect();
            cp_sliderRect = CP_SLIDER.getBoundingClientRect();
            cpSliderWidth = Math.round(cp_sliderRect.width);
            cp_offsetX_from_parentLeft = Math.round(cp_rect.left);
            cp_rightBoundary = Math.round(cp_rect.width) - 1;
            cp_sliderOffsetX_from_rightBoundary = cp_rightBoundary - cpSliderWidth;
            cp_translationChangeMarker = Math.round(cp_rect.width * 0.8);
            cp_sliderCenterX = Math.round(cpSliderWidth * 0.5);
            cp_paletteWidth = Math.round(cp_rect.width);
            CP_PALETTE.width = cp_paletteWidth;
            CP_PALETTE_CONTEXT.fillStyle = __generateLinearGradient__(
                CP_PALETTE_CONTEXT,
                0,
                0,
                cp_paletteWidth,
                cp_paletteHeight,
                [ 0.0, 'rgb(255,0,0)', 0.17, '#ff0', 0.33, 'lime', 0.5, 'cyan', 0.66, 'blue', 0.83, '#f0f', 1.0, 'red' ]
            )
            CP_PALETTE_CONTEXT.fillRect(0, 0, cp_paletteWidth, cp_paletteHeight);
            cp_paletteImageData = CP_PALETTE_CONTEXT.getImageData(0, 0, cp_paletteWidth, cp_paletteHeight).data;
            cp_paletteCursor = 0;

            // re-calculates data for color variant picker palette
            cvp_rect = COLOR_VARIANT_PICKER.getBoundingClientRect();
            cvp_sliderRect = CVP_SLIDER.getBoundingClientRect();
            cvp_offsetX_from_parentLeft = Math.round(cvp_rect.left);
            cvp_offsetX_from_parentTop = Math.round(cvp_rect.top);
            cvp_rightBoundary = Math.round(cvp_rect.width);
            cvp_bottomBoundary = Math.round(cvp_rect.height) - 1;
            cvp_sliderCenterX = Math.round(cvp_sliderRect.width * 0.5);
            cvp_sliderCenterY = Math.round(cvp_sliderRect.height * 0.5);
            cvp_paletteWidth = Math.round(cvp_rect.width);
            cvp_paletteHeight = Math.round(cvp_rect.height);
            CVP_PALETTE.width = cvp_paletteWidth;
            CVP_PALETTE.height = cvp_paletteHeight;
            cvp_paletteImageDataWidth = cvp_paletteWidth * 4;
            cvp_paletteCursor = (cvp_paletteWidth - 1) * 4;

            // re-calculates data for rhhh display arrow buttons
            colorSpaceDisplayRect = COLOR_SPACE_DISPLAY.getBoundingClientRect();
            COLOR_SPACE_DISPLAY_LEFT_ARROW.style.borderWidth = Math.round(colorSpaceDisplayRect.width * 0.04).toString() + 'px';
            COLOR_SPACE_DISPLAY_RIGHT_ARROW.style.borderWidth = Math.round(colorSpaceDisplayRect.width * 0.04).toString() + 'px';

            // resets alpha channel
            ALPHA_CHANNEL_CONTROL.value = 1.0;

            // re-initialization
            __moveSlider__(cp_sliderStyles, 0);
            __moveSlider__(cvp_sliderStyles, (cvp_rightBoundary + cvp_sliderCenterX), -cvp_sliderCenterY);
            rgba['r'] = 255;
            rgba['g'] = 0;
            rgba['b'] = 0;
            rgba['a'] = 255;
            __updateColorVariantPicker__();
            __updateColorVariantPickerPalette__();
            __updateColorPreview__();
            __updateColorSpaceDisplay__(currentColorModel);
            __getPosXAndHuesOfAllColorsInColorPicker__();
        };



        // PRIVATE METHODS
        function __updateColorVariantPickerPalette__() {
            $updateColorVariantPickerPalette(
                CVP_PALETTE_CONTEXT,
                cvp_paletteWidth,
                cvp_paletteHeight,
                rgba
            );

            // updating cvp palette & RGB values
            cvp_paletteImageData = CVP_PALETTE_CONTEXT.getImageData(0, 0, cvp_paletteWidth, cvp_paletteHeight).data;

            rgba['r'] = cvp_paletteImageData[cvp_paletteCursor];
            rgba['g'] = cvp_paletteImageData[cvp_paletteCursor + 1];
            rgba['b'] = cvp_paletteImageData[cvp_paletteCursor + 2];
        };

        function __updateColorVariantPicker__() {
            $updateColorVariantPicker(COLOR_VARIANT_PICKER, rgba);
        };

        function __updateColorPreview__() {
            $updateColorPreview(COLOR_PREVIEW, rgba);
        };

        function __updateColorSpaceDisplay__(colorModel) {
            $updateColorSpaceDisplay(
                COLOR_SPACE_DISPLAY_CONTENT,
                colorModel,
                rgba
            );
        };

        function __getPosXAndHuesOfAllColorsInColorPicker__() {
            $getPosXAndHuesOfAllColorsInColorPicker(
                cp_paletteWidth,
                cp_paletteImageData,
                allHuesInColorPicker,
                allHuePosXInColorPicker,
            );
        };

        function __getCVPCursorValue__(x, y) {
            return y * cvp_paletteImageDataWidth + (x * 4);
        };

        function __applyAndDisplayColorOpacity__(opacityAsString) {
            $applyAndDisplayColorOpacity(
                opacityAsString,
                rgba,
                ALPHA_CHANNEL_VALUE,
                accClasslist
            );

            __updateColorPreview__();
        };

        function __locateColor__() {
            const DATA_MODIFICATIONS = $locateColor(
                rgba,
                allHuesInColorPicker,
                allHuePosXInColorPicker,
                cp_sliderStyles,
                cp_translationChangeMarker,
                cp_paletteCursor,
                cp_paletteImageData,
                __updateColorVariantPicker__,
                __updateColorVariantPickerPalette__,
                cvp_paletteWidth,
                cvp_paletteHeight,
                cvp_paletteImageData,
                __getCVPCursorValue__,
                cvp_sliderStyles,
                cvp_sliderRect
            );

            cp_paletteCursor = DATA_MODIFICATIONS['cpPaletteCursor'];
        };

        function __processColorSpaceDisplayContent__(currentColorSpaceDisplayed) {
            const CORRECTED_CONTENT_TO_DISPLAY =  $processColorSpaceDisplayContent(
                currentColorSpaceDisplayed,
                rgba,
                __updateColorPreview__,
                __locateColor__
            );

            if (CORRECTED_CONTENT_TO_DISPLAY !== '') {
                COLOR_SPACE_DISPLAY_CONTENT.value = CORRECTED_CONTENT_TO_DISPLAY;
            }
        };
    };



    // PROTECTED METHODS (INHERITED)
    // (wrapped functions of private methods)
    function $updateColorVariantPickerPalette(cvpPaletteContext, cvpPaletteWidth, cvpPaletteHeight, rgbaObj) {
        cvpPaletteContext.clearRect(0, 0, cvpPaletteWidth, cvpPaletteHeight);

        // gradient layer 1 (white & chosen color | right to left)
        cvpPaletteContext.fillStyle = __generateLinearGradient__(
            cvpPaletteContext,
            cvpPaletteWidth,
            Math.round(cvpPaletteHeight * 0.5),
            0,
            Math.round(cvpPaletteHeight * 0.5),
            [ 0.0, 'rgb(' + rgbaObj['r'] + ',' + rgbaObj['g'] + ',' + rgbaObj['b'] + ')', 0.99, 'white' ]
        );
        cvpPaletteContext.fillRect(0, 0, cvpPaletteWidth, cvpPaletteHeight);

        // gradient layer 2 (transparent color & black | top to bottom)
        cvpPaletteContext.fillStyle = __generateLinearGradient__(
            cvpPaletteContext,
            Math.round(cvpPaletteWidth * 0.5),
            0,
            Math.round(cvpPaletteWidth * 0.5),
            cvpPaletteHeight,
            [ 0.0, 'rgba(0,0,0,0)', 0.99, 'black' ]
        );
        cvpPaletteContext.fillRect(0, 0, cvpPaletteWidth, cvpPaletteHeight);
    };

    function $updateColorVariantPicker(colorVariantPicker, rgbaObj) {
        colorVariantPicker.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgb(0,0,0) 99%),linear-gradient(to left, rgb(' + rgbaObj['r'] + ',' + rgbaObj['g'] + ',' + rgbaObj['b'] + ') 0%, rgb(255,255,255) 99%)';
    };

    function $updateColorPreview(colorPreview, rgbaObj) {
        colorPreview.style.backgroundColor = 'rgba(' + rgbaObj['r'] + ',' + rgbaObj['g'] + ',' + rgbaObj['b'] + ',' + rgbaObj['a'] + ')';
    };

    function $updateColorSpaceDisplay(colorSpaceDisplay, colorModel, rgbaObj) {
        switch (colorModel) {
            case 'rgb':
                colorSpaceDisplay.value = 'rgb(' + rgbaObj['r'] + ',' + rgbaObj['g'] + ',' + rgbaObj['b'] + ')';
                break;
            case 'hex':
                const RGB_TO_HEX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
                const RGB_VALUES = [rgbaObj['r'], rgbaObj['g'], rgbaObj['b']];
                let hex = '';

                for (let i=0; i < 3; i++) {
                    const CURRENT_RGB_VALUE = RGB_VALUES[i];
                    const QUOTIENT = CURRENT_RGB_VALUE / 16; // contains decimals

                    const ROUNDED_QUOTIENT = Math.floor(QUOTIENT); // no decimals
                    const REMAINDER = QUOTIENT - ROUNDED_QUOTIENT;

                    hex += RGB_TO_HEX[ROUNDED_QUOTIENT] + RGB_TO_HEX[REMAINDER * 16];
                }

                colorSpaceDisplay.value = '#' + hex;
                break;
            case 'hsv':
                const HSV = __RGBtoHSV__(rgbaObj);

                colorSpaceDisplay.value = 'hsv(' + HSV['h'] + ',' + HSV['s'] + ',' + HSV['v'] + ')';
                break;
            case 'hsl':
                const COLOR_SPACE_DATA = __getRGBColorSpaceData__(rgbaObj, true, true, true);
                const HUE = __getHue__(COLOR_SPACE_DATA);

                // L value
                const LUMINANCE = (COLOR_SPACE_DATA['max'] + COLOR_SPACE_DATA['min']) / 2;

                // S value
                let saturation = 0;

                if (COLOR_SPACE_DATA['deltaE'] != 0) {
                    saturation = COLOR_SPACE_DATA['deltaE'] / (1 - Math.abs(2 * LUMINANCE - 1));
                }

                colorSpaceDisplay.value = 'hsl(' + HUE + ',' + Math.round(saturation * 100) + ',' + Math.round(LUMINANCE * 100) + ')';
        }
    };

    function $getPosXAndHuesOfAllColorsInColorPicker(cpPaletteWidth, cpPaletteImageData, huesArray, huePosXArray) {
        let previousHue = -1, current_hue = -1;

        for (let posX=0; posX < cpPaletteWidth; posX++) {
            let cursor = posX * 4;

            current_hue = __getHue__(__getRGBColorSpaceData__({r:cpPaletteImageData[cursor], g: cpPaletteImageData[cursor + 1], b: cpPaletteImageData[cursor + 2]}, true, true, true));

            if (posX == 0) { current_hue = 0; }

            // only distinct colors are tracked
            if (previousHue != current_hue) {
                huesArray.push(current_hue);
                huePosXArray.push(posX);

                previousHue = current_hue;
            }
        }
    };

    function $applyAndDisplayColorOpacity(opacity, rgbaObj, alphaChannelValue, alphaChannelClasslist) {
        const ALPHA_VALUE = parseFloat(opacity.slice(0,4));
        rgbaObj['a'] = ALPHA_VALUE;

        alphaChannelValue.innerText = `${Math.round(ALPHA_VALUE * 100)}%`;

        alphaChannelClasslist.remove('fadeOut');
        alphaChannelClasslist.add('resetFade');
        setTimeout(() => {
            alphaChannelClasslist.remove('resetFade');
            alphaChannelClasslist.add('fadeOut');
        }, 1);
    };

    function $locateColor(rgbaObj, huesArray, huePosXArray, cpSliderStyles, cpTranslationChangeMarker, cpPaletteCursor, cpPaletteImageData, __updateColorVariantPicker__, __updateColorVariantPickerPalette__, cvpPaletteWidth, cvpPaletteHeight, cvpPaletteImageData, __getCVPCursorValue__, cvpSliderStyles, cvpSliderRect) {
        const DATA_MODIFICATIONS = {
            cpPaletteCursor: null
        };

        const COPY_OF_TARGET_COLOR = {
            r:rgbaObj['r'],
            g:rgbaObj['g'],
            b:rgbaObj['b']
        };
        const HSV = __RGBtoHSV__(rgbaObj);

        // finding color space in CP
        const TARGET_HUE = HSV['h'];
        const POSX_OF_TARGET_HUE_IN_CP = huePosXArray[__findIndexInColorPicker__(TARGET_HUE, huesArray)];
        let sliderHasNegativeTranslationX = __hasNegativeTranslationXY__(cpSliderStyles, 'x'); 

        if (POSX_OF_TARGET_HUE_IN_CP > cpTranslationChangeMarker && sliderHasNegativeTranslationX == false) {
            __enableNegativeTranslationX__(cpSliderStyles);
        }
        else if (POSX_OF_TARGET_HUE_IN_CP < cpTranslationChangeMarker && sliderHasNegativeTranslationX) {
            __disableNegativeTranslationX__(cpSliderStyles);
        }

        __moveSlider__(cpSliderStyles, POSX_OF_TARGET_HUE_IN_CP);

        cpPaletteCursor = POSX_OF_TARGET_HUE_IN_CP * 4;
        rgbaObj['r'] = cpPaletteImageData[cpPaletteCursor];
        rgbaObj['g'] = cpPaletteImageData[cpPaletteCursor + 1];
        rgbaObj['b'] = cpPaletteImageData[cpPaletteCursor + 2];
        __updateColorVariantPicker__();
        __updateColorVariantPickerPalette__();

        rgbaObj['r'] = COPY_OF_TARGET_COLOR['r'];
        rgbaObj['g'] = COPY_OF_TARGET_COLOR['g'];
        rgbaObj['b'] = COPY_OF_TARGET_COLOR['b'];

        DATA_MODIFICATIONS['cpPaletteCursor'] = cpPaletteCursor;

        // finding color variant in CVP
        let coordinates_in_CVP = {x:0, y:0};

        for (let i = cvpPaletteWidth; i != 0; i--) {
            const CURSOR = i * 4;
            const COLOR_SPACE_DATA = __getRGBColorSpaceData__(
                {
                    r:cvpPaletteImageData[CURSOR], g:cvpPaletteImageData[CURSOR + 1], b:cvpPaletteImageData[CURSOR + 2]
                },
                true,
                true,
                true
            );
            const MAX = COLOR_SPACE_DATA['max'];

            if (MAX != 0 && Math.round((COLOR_SPACE_DATA['deltaE'] / MAX) * 100) == HSV['s']) {
                coordinates_in_CVP['x'] = i;
            }
        }

        for (let i=0; i != cvpPaletteHeight; i++) {
            const CURSOR = __getCVPCursorValue__(coordinates_in_CVP['x'], i);

            const RC = cvpPaletteImageData[CURSOR] / 255;
            const GC = cvpPaletteImageData[CURSOR + 1] / 255;
            const BC = cvpPaletteImageData[CURSOR + 2] / 255;
            const MAX = Math.max(RC, GC, BC);

            if (MAX != 0 && Math.round(MAX * 100) == HSV['v']) {
                coordinates_in_CVP['y'] = i;
            }
        }

        let posX_in_CVP = coordinates_in_CVP['x'];
        let posY_in_CVP = coordinates_in_CVP['y'];
        sliderHasNegativeTranslationX = __hasNegativeTranslationXY__(cvpSliderStyles, 'x');
        const CVP_SLIDER_WIDTH = cvpSliderRect.width, cvpSliderHeight = cvpSliderRect.height;

        if (posX_in_CVP < CVP_SLIDER_WIDTH) {
            if (sliderHasNegativeTranslationX) {
                __disableNegativeTranslationX__(cvpSliderStyles);
            }
            posX_in_CVP -= Math.round(CVP_SLIDER_WIDTH * 0.5);
        }
        if (posX_in_CVP > (cvpPaletteWidth - CVP_SLIDER_WIDTH)) {
            if (sliderHasNegativeTranslationX === false) {
                __enableNegativeTranslationX__(cvpSliderStyles);
            }
            posX_in_CVP += Math.round(CVP_SLIDER_WIDTH * 0.5);
        }
        if (posY_in_CVP == 0 || posY_in_CVP > (cvpPaletteHeight - cvpSliderHeight)) {
            posY_in_CVP -= Math.round(cvpSliderHeight * 0.5);
        }

        __moveSlider__(cvpSliderStyles, posX_in_CVP, posY_in_CVP);

        return DATA_MODIFICATIONS;
    };

    function $processColorSpaceDisplayContent(currentColorSpaceDisplayed, rgbaObj, __updateColorPreview__, __locateColor__) {
        let correctedColorSpaceDisplayed = '';

        if (/^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/.test(currentColorSpaceDisplayed)) {
            const RGB_VALUES = currentColorSpaceDisplayed.slice(4,-1).split(',');
            const PARSED_RGB_VALUES = [];
            let isValidRGB = false;

            for (let i=0; i < 3; i++) {
                const CURRENT_VALUE = parseInt(RGB_VALUES[i]);

                if (CURRENT_VALUE >= 0 && CURRENT_VALUE <= 255) {
                    PARSED_RGB_VALUES.push(CURRENT_VALUE);
                }
                else {
                    // corrects values that go over 255
                    let correctedValue = CURRENT_VALUE;

                    while (correctedValue > 255) {
                        correctedValue = correctedValue - 255;
                    }

                    PARSED_RGB_VALUES.push(correctedValue);
                }

                if (i === 2 && PARSED_RGB_VALUES.length === 3) {
                    isValidRGB = true;
                }
            }

            if (isValidRGB) {
                const R = PARSED_RGB_VALUES[0];
                const G = PARSED_RGB_VALUES[1];
                const B = PARSED_RGB_VALUES[2];

                rgbaObj['r'] = R;
                rgbaObj['g'] = G;
                rgbaObj['b'] = B;

                correctedColorSpaceDisplayed = 'rgb(' + R + ',' + G + ',' + B + ')';

                __updateColorPreview__();
                __locateColor__();
            }
        }
        else if (/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(currentColorSpaceDisplayed)) {
            const HEX_STRING = currentColorSpaceDisplayed.substring(1);
            const HEX_LENGTH = HEX_STRING.length;

            const MULTIPLIER1 = Math.pow(16, 1)
            const MULTIPLIER2 = Math.pow(16, 0);
            const HEX_TO_RGB_MAPPING = {
                a: 10,
                A: 10,
                b: 11,
                B: 11,
                c: 12,
                C: 12,
                d: 13,
                D: 13,
                e: 14,
                E: 14,
                f: 15,
                F: 15
            };
            let rgb = [];

            switch (HEX_LENGTH) {
                case 6:
                    for (let i=0; i < 6; i += 2) {
                        let char1 = HEX_TO_RGB_MAPPING[HEX_STRING[i]];
                        let char2 = HEX_TO_RGB_MAPPING[HEX_STRING[i + 1]];

                        if (char1 == undefined) {
                            char1 = parseInt(HEX_STRING[i]);
                        }
                        if (char2 == undefined) {
                            char2 = parseInt(HEX_STRING[i + 1]);
                        }

                        rgb.push((char1 * MULTIPLIER1) + (char2 * MULTIPLIER2));
                    }
                    break;
                case 3:
                    for (let i=0; i < 3; i++) {
                        let char = HEX_TO_RGB_MAPPING[HEX_STRING[i]];

                        if (char == undefined) {
                            char = parseInt(HEX_STRING[i]);
                        }

                        rgb.push((char * MULTIPLIER1) + (char * MULTIPLIER2));
                    }
            }

            rgbaObj['r'] = rgb[0];
            rgbaObj['g'] = rgb[1];
            rgbaObj['b'] = rgb[2];

            __updateColorPreview__();
            __locateColor__();
        }
        else if (/^(hsv|hsl)\(\d+(°)?,\d+(%)?,\d+(%)?\)$/.test(currentColorSpaceDisplayed)) {
            let isHSL = false;
            if (currentColorSpaceDisplayed.slice(0,3) == 'hsl') {
                isHSL = true;
            }

            const HSV_OR_HSL_VALUES = currentColorSpaceDisplayed.slice(4,-1).split(',');

            if (HSV_OR_HSL_VALUES[0].includes('°')) {
                HSV_OR_HSL_VALUES[0] = HSV_OR_HSL_VALUES[0].slice(0, -1);
            }
            if (HSV_OR_HSL_VALUES[1].includes('%')) {
                HSV_OR_HSL_VALUES[1] = HSV_OR_HSL_VALUES[1].slice(0, -1);
            }
            if (HSV_OR_HSL_VALUES[2].includes('%')) {
                HSV_OR_HSL_VALUES[2] = HSV_OR_HSL_VALUES[2].slice(0, -1);
            }

            for (let i=0; i < 3; i++) {
                let currentValue = parseInt(HSV_OR_HSL_VALUES[i])

                if (i === 0 && currentValue > 359) {
                    // ensures that the degree given is within 360
                    while (currentValue > 359) {
                        currentValue = currentValue - 360;
                    }
                }
                else if (i > 0 && currentValue > 100) {
                    // ensures that the percentages given are within 100%
                    while (currentValue > 100) {
                        currentValue = currentValue - 100;
                    }
                }

                HSV_OR_HSL_VALUES[i] = currentValue;
            }

            if (isHSL) {
                correctedColorSpaceDisplayed = 'hsl(' + HSV_OR_HSL_VALUES[0] + ',' + HSV_OR_HSL_VALUES[1] + ',' + HSV_OR_HSL_VALUES[2] + ')';
            }
            else {
                correctedColorSpaceDisplayed = 'hsv(' + HSV_OR_HSL_VALUES[0] + ',' + HSV_OR_HSL_VALUES[1] + ',' + HSV_OR_HSL_VALUES[2] + ')';
            }

            const H = HSV_OR_HSL_VALUES[0];
            const S = HSV_OR_HSL_VALUES[1] / 100;
            const V_OR_L = HSV_OR_HSL_VALUES[2] / 100;

            let C = 0, X = 0, m = 0;
            let r = 0, g = 0, b = 0;

            if (isHSL) {
                C = (1 - Math.abs(2 * V_OR_L - 1)) * S;
                m = V_OR_L - (C / 2);
            }
            else {
                C = V_OR_L * S;
                m = V_OR_L - C;
            }

            X = C * (1 - Math.abs((H / 60) % 2 - 1));

            if (H >= 0 && H < 60) { r = C; g = X; }
            else if (H >= 60 && H < 120) { r = X; g = C; }

            else if (H >= 120 && H < 180) { g = C; b = X; }
            else if (H >= 180 && H < 240) { g = X; b = C; }

            else if (H >= 240 && H < 300) { r = X; b = C; }
            else if (H >= 300 && H < 360) { r = C; b = X; }

            rgbaObj['r'] = Math.round((r + m) * 255);
            rgbaObj['g'] = Math.round((g + m) * 255);
            rgbaObj['b'] = Math.round((b + m) * 255);

            __updateColorPreview__();
            __locateColor__();
        }

        return correctedColorSpaceDisplayed;
    };


    // (helpers)
    function __generatePart__(elementTag, attributesObj) {
        checkIfString(elementTag);

        if (attributesObj === undefined) {
            attributesObj = {};
        }
        else {
            checkIfMapping(attributesObj);
        }

        let part = document.createElement(elementTag);;

        if (isEmptyObj(attributesObj) === false) {
            const attributes = getObjKeysAndValues(attributesObj);
            for (let i=0; i < attributes.length; i += 2) {
                let current_attribute = attributes[i];
                const uppercaseCheck = /[A-Z]/;

                if (uppercaseCheck.test(current_attribute)) {
                    const contents = current_attribute.split(uppercaseCheck);
                    current_attribute = contents[0] + '-' + current_attribute.match(uppercaseCheck)[0].toLowerCase() + contents[1];
                }

                part.setAttribute(current_attribute, attributes[i + 1]);
            }
        }

        return part;
    };

    function __joinPartsWith__(parent, partsArray) {
        checkIfHTMLElement(parent);
        checkIfArray(partsArray);

        for (let i=0; i < partsArray.length; i++) { parent.appendChild(partsArray[i]); }
        return parent;
    };

    function __generateLinearGradient__(canvasContext, topX, topY, bottomX, bottomY, offsetsAndColorsArray) {
        if ((canvasContext instanceof CanvasRenderingContext2D) === false) {
            throw TypeError("Not a canvas context");
        }
        if (typeof(topX) !== 'number' || typeof(topY) !== 'number' || typeof(bottomX) !== 'number' || typeof(bottomY) !== 'number') {
            throw TypeError("All x and y values must be a number");
        }

        checkIfArray(offsetsAndColorsArray);

        const gradient = canvasContext.createLinearGradient(topX, topY, bottomX, bottomY);

        for (let i=0; i != offsetsAndColorsArray.length; i += 2) {
            gradient.addColorStop(offsetsAndColorsArray[i], offsetsAndColorsArray[i+1]);
        }

        return gradient;
    };

    function __moveSlider__(sliderStyles, offsetX, offsetY) {
        checkIfStylesMapping(sliderStyles);

        if (offsetX === undefined) {
            throw ReferenceError("An offset must be given for x");
        }
        if (offsetY === undefined) {
            offsetY = null;
        }
        else if (isNumber(offsetY) === false) {
            throw TypeError("The y offset must be a number");
        }

        sliderStyles.left = offsetX + 'px';

        if (offsetY != null) { sliderStyles.top = offsetY + 'px'; }
    };

    function __enableNegativeTranslationX__(elementStyles) {
        checkIfStylesMapping(elementStyles);

        elementStyles.transform += 'translateX(-100%)';
    };

    function __enableNegativeTranslationY__(elementStyles) {
        checkIfStylesMapping(elementStyles);

        elementStyles.transform += 'translateY(-100%)';
    };

    function __disableNegativeTranslationX__(elementStyles) {
        checkIfStylesMapping(elementStyles);

        elementStyles.transform = elementStyles.transform.replace('translateX(-100%)', '');
    };

    function __disableNegativeTranslationY__(elementStyles) {
        checkIfStylesMapping(elementStyles);

        elementStyles.transform = elementStyles.transform.replace('translateY(-100%)', '');
    };

    function __hasNegativeTranslationXY__(elementStyles, axis) {
        checkIfStylesMapping(elementStyles);
        checkIfString(axis);

        if (axis !== 'x' && axis !== 'y' && axis !== 'X' && axis !== 'Y') {
            throw Error("Axis must be x or y");
        }

        return elementStyles.transform.includes('translate'.concat(axis.toUpperCase(), '(-100%)'));
    };

    function __getRGBColorSpaceData__(rgbaObj, getMin, getMax, getDeltaE) {
        checkIfMapping(rgbaObj);

        if (getMin === undefined) {
            getMin = false;
        }
        if (getMax === undefined) {
            getMax = false;
        }
        if (getDeltaE === undefined) {
            getDeltaE = false;
        }

        if (isBoolean(getMin) === false || isBoolean(getMax) === false || isBoolean(getDeltaE) === false) {
            throw TypeError("All flags must be either true or false");
        }

        let data = {r:0, g:0, b:0, min:-1, max:-1, deltaE:-1};

        data['r'] = rgbaObj['r'] / 255;
        data['g'] = rgbaObj['g'] / 255;
        data['b'] = rgbaObj['b'] / 255;

        if (getMin) { data['min'] = Math.min(data['r'], data['g'], data['b']); }
        if (getMax) { data['max'] = Math.max(data['r'], data['g'], data['b']); }
        if (getDeltaE && getMin && getMax) { data['deltaE'] = data['max'] - data['min']; }

        return data;
    };

    function __getHue__(completeRGBColorSpaceData) {
        checkIfMapping(completeRGBColorSpaceData);

        const delta_e = completeRGBColorSpaceData['deltaE'];

        if (delta_e != 0) {
            const r = completeRGBColorSpaceData['r'];
            const g = completeRGBColorSpaceData['g'];
            const b = completeRGBColorSpaceData['b'];
            let hue = 0;

            switch(completeRGBColorSpaceData['max']) {
                case r:
                    hue = Math.round(60 * (((g - b) / delta_e) % 6));
                    break;
                case g:
                    hue = Math.round(60 * (((b - r) / delta_e) + 2));
                    break;
                case b:
                    hue = Math.round(60 * (((r - g) / delta_e) + 4));
            }

            if (hue < 0) { hue = 361 + hue; }

            return hue;
        } 
        else {
            return 0;
        }
    };

    function __RGBtoHSV__(rgbaObj) {
        const hsv = {h:0, s:0, v:0};
        let data = __getRGBColorSpaceData__(rgbaObj, true, true, true);

        // H value
        hsv['h'] = __getHue__(data);

        // S value & V value
        if (data['max'] != 0) { 
            hsv['s'] = Math.round((data['deltaE'] / data['max']) * 100);
            hsv['v'] = Math.round(data['max'] * 100);
        }

        return hsv;
    };

    function __findIndexInColorPicker__(hue, distinctColorPickerHuesArray) {
        checkIfNumber(hue);
        checkIfArray(distinctColorPickerHuesArray);

        let maxHueIndex = distinctColorPickerHuesArray.length - 1;
        let minHueIndex = 0;
        let midHueIndex = 0;

        let previous_hue = -1; // used for breaking loop if a hue is repeated (should not happen)

        // uses binary search to locate index
        for (let i=0; i < distinctColorPickerHuesArray.length; i++) {
            midHueIndex = Math.round((maxHueIndex + minHueIndex) * 0.5);
            const currentHue = distinctColorPickerHuesArray[midHueIndex];

            if (currentHue == hue || currentHue == previous_hue) {
                break;
            }
            else if (currentHue > hue) {
                maxHueIndex = midHueIndex - 1;
            }
            else if (currentHue < hue) {
                minHueIndex = midHueIndex;
            }
            previous_hue = currentHue;
        }

        return midHueIndex;
    };

    return ColorPickerConstructor;
})();

export default ColorPicker;