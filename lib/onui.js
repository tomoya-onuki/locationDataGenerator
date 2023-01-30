/* Copyright (c) 2023 Tomoya Onuki */
/* This software is released under the MIT License, see LICENSE. */

window.addEventListener('load', () => {
    new OnUI().init();
});

// HTML特殊文字を使えるようにした
const domParser = new DOMParser();
const parseHTMLcode = (code) => {
    return String(domParser.parseFromString(code, 'text/html').body.textContent)
}

class OnUI {
    #onuiStyle;
    constructor() {
        this.#onuiStyle = document.createElement('style');
        document.querySelector('head').append(this.#onuiStyle);
    }

    init() {
        this.#toggleSwitch();
        this.#toggleBtn();
        this.#multiSlider();
        this.#accordion();
        this.#tab();
        this.#fontSelector();
    }

    #addStyle(cssText) {
        this.#onuiStyle.innerHTML += cssText;
    }


    #toggleSwitch() {
        document.querySelectorAll('onui[type="toggle-switch"]')
            .forEach(($elem, idx) => {
                let $input = document.createElement('input');
                $input.setAttribute('type', 'checkbox');
                let id = $elem.getAttribute('id');
                if (id === null) {
                    id = `onui-toggle-switch${idx}`;
                }
                $input.setAttribute('id', id);

                let check = $elem.getAttribute('checked')
                $input.checked = check === 'checked' || check === '' ? true : false;;

                if ($elem.style.length > 0) {
                    let baseFill = $elem.style.backgroundColor;
                    let baseStroke = $elem.style.borderColor;
                    let accentFill = $elem.style.accentColor;
                    let accentStroke = $elem.style.accentColor;
                    let thumb = $elem.style.color;
                    let borderWidth = $elem.style.borderWidth;
                    let borderRadius = $elem.style.borderTopLeftRadius;
                    let thumbRadius = $elem.style.borderTopRightRadius;
                    let margin = $elem.style.margin;

                    // if (baseFill === '') baseFill = '#aaa';
                    // if (baseStroke === '') baseStroke = '#aaa';
                    // if (thumb === '') thumb = '#FFF';
                    // if (accentFill === '') accentFill = '#4287f5';
                    // if (accentStroke === '') accentStroke = '#4287f5';
                    // if (borderWidth === '') borderWidth = 1;
                    // if (borderStyle === '') borderStyle = 'solid';
                    // if (borderRadius === '') borderRadius = 10;
                    // if (thumbRadius === '') thumbRadius = '100%';

                    this.#addStyle(`#${id} { margin: ${margin} } #${id}+label { border-color: ${baseStroke}; border-width: ${borderWidth}; border-radius: ${borderRadius}; background-color: ${baseFill}; } #${id}:checked+label { border: 1px solid ${accentStroke}; background-color: ${accentFill}; } #${id}+label>onui-thumb { background-color: ${thumb}; border: 1px solid ${thumb}; border-radius: ${thumbRadius}; }`);

                    $elem.style = '';
                }

                $elem.removeAttribute('id');

                let $label = document.createElement('label');
                $label.setAttribute('for', id);
                let $thumb = document.createElement('onui-thumb');
                $label.append($thumb);

                $elem.append($input);
                $elem.append($label);
            });
    }

    #toggleBtn() {
        document.querySelectorAll('onui[type="toggle-btn"]')
            .forEach(($elem, idx) => {

                let id = $elem.getAttribute('id');
                if (id === null) {
                    id = `onui-toggle-btn${idx}`;
                }
                $elem.removeAttribute('id');
                const text = $elem.textContent;
                $elem.textContent = '';

                const $input = document.createElement('input');
                $input.setAttribute('type', 'checkbox');
                $input.setAttribute('id', id);
                $input.classList.add('toggle-btn');

                const $label = document.createElement('label');
                $label.textContent = text;
                $label.setAttribute('for', id);

                $elem.appendChild($input);
                $elem.appendChild($label);

                let check = $elem.getAttribute('checked')
                $input.checked = check === 'checked' || check === '' ? true : false;;


                if ($elem.style.length > 0) {
                    let baseFill = $elem.style.backgroundColor;
                    let baseStroke = $elem.style.borderColor;
                    let accentFill = $elem.style.accentColor;
                    let accentStroke = $elem.style.accentColor;
                    let text = $elem.style.color;
                    let borderRadius = $elem.style.borderRadius;
                    let borderStyle = $elem.style.borderStyle;
                    let borderWidth = $elem.style.borderWidth;
                    let width = $elem.style.width;
                    let height = $elem.style.height;
                    let textAlign = $elem.style.textAlign;
                    let padding = $elem.style.padding;
                    let fontSize = $elem.style.fontSize;
                    let fontFamily = $elem.style.fontFamily;
                    let margin = $elem.style.margin;

                    // if (baseFill === '') baseFill = '#aaa';
                    // if (baseStroke === '') baseStroke = '#aaa';
                    // if (accentFill === '') accentFill = '#4287f5';
                    // if (accentStroke === '') accentStroke = '#4287f5';
                    // if (text === '') text = '#000';
                    // if (borderRadius === '') borderRadius = '5px';
                    // if (borderWidth === '') borderWidth = 1;
                    // if (borderStyle === '') borderStyle = 'solid';
                    // if (width === '') width = 'auto';
                    // if (height === '') height = 20;
                    // if (textAlign === '') textAlign = 'center';
                    // if (padding === '') padding = '2px 5px 2px 5px';
                    // if(fontSize === '') fontSize = '12px';

                    this.#addStyle(`#${id} { margin: ${margin}; } #${id}+label { border-color:${baseStroke}; border-radius: ${borderRadius}; border-style: ${borderStyle}; border-width: ${borderWidth}; background-color: ${baseFill}; color : ${text}; font-size: ${fontSize}; font-family: ${fontFamily}; text-align: ${textAlign}; padding: ${padding}; width: ${width}; height: ${height}; }  #${id}:checked+label { border-color: ${accentStroke}; background-color: ${accentFill}; }`);

                    $elem.style = '';
                }

                $elem.removeAttribute('id');
            });
    }

    #fontSelector() {
        document.querySelectorAll('onui[type="font"]')
            .forEach(($elem, idx) => {
                let id = $elem.getAttribute('id');
                if (id === null) {
                    id = `onui-font-selector${idx}`;
                    $elem.setAttribute('id', id);
                }

                // ドロップダウンリスト
                const $list = document.createElement("onui-options");

                const $label = document.createElement("onui-label");

                const $btn = document.createElement("onui-down-btn");
                $btn.textContent = parseHTMLcode("&#9660;");

                $elem.querySelectorAll('option')
                    .forEach(($item, idx) => {
                        const font = $item.getAttribute('name');
                        $item.remove();

                        const text = font.replace(/["']/g, '');
                        const $input = document.createElement('input');
                        $input.setAttribute('type', 'radio');
                        $input.setAttribute('name', id);
                        $input.classList.add('onui-option');
                        $list.appendChild($input);

                        // 最初の選択肢をデフォルトの選択肢にする
                        if ($item.selected || idx === 0) {
                            $input.checked = true;
                            $label.textContent = text;
                            $label.style.fontFamily = font;
                        } else {
                            $input.checked = false;
                        }

                        // ドロップダウンでみえる選択肢
                        let $listLabel = document.createElement('label');
                        $listLabel.textContent = text;
                        $listLabel.setAttribute('for', String(idx));
                        $listLabel.classList.add('onui-item');
                        $listLabel.style.fontFamily = font;
                        $list.appendChild($listLabel);

                        // ラジオボタンは非表示にして、上のラベルと対応させる
                        $input.setAttribute('id', String(idx));

                        // チェックが入ってるやつをデフォルトに
                        if ($input.checked) {
                            $label.textContent = text;
                        }
                    });

                $elem.appendChild($btn);
                $elem.appendChild($label);
                $elem.appendChild($list);


                if ($elem.style.length > 0) {
                    let baseFill = $elem.style.backgroundColor;
                    let baseStroke = $elem.style.borderColor;
                    let accentFill = $elem.style.accentColor;
                    let text = $elem.style.color;
                    let width = $elem.style.width;
                    let height = $elem.style.height;
                    let borderWidth = $elem.style.borderWidth;
                    let borderStyle = $elem.style.borderStyle;
                    let borderRadius = $elem.style.borderRadius;
                    let margin = $elem.style.margin;
                    let textAlign = $elem.style.textAlign;

                    // if (baseFill === '') baseFill = '#FFF';
                    // if (baseStroke === '') baseStroke = '#000';
                    // if (accentFill === '') accentFill = '#4287f5';
                    // if (accentStroke === '') accentStroke = '#4287f5';
                    // if (text === '') text = '#000';
                    // if (width === '') width = 120;
                    // if (height === '') height = 2;
                    // if (borderWidth === '') borderWidth = 1;
                    // if (borderStyle === '') borderStyle = 'solid';
                    // if (borderRadius === '') borderRadius = 5;

                    this.#addStyle(`#${id} { margin: ${margin};  width : ${width}; height : ${height}; background: ${baseFill}; border-color: ${baseStroke}; border-width: ${borderWidth}; border-style: ${borderStyle}; border-radius: ${borderRadius}; } #${id} onui-label { background: ${baseFill}; color: ${text}; text-align: ${textAlign} } #${id} onui-down-btn { color : ${text}; } #${id} .onui-item:hover { background: ${accentFill}; }`);

                    $elem.style = '';
                }

                const showList = () => {
                    if ($list.style.display = "none") {
                        $list.style.display = "block";
                    } else {
                        $list.style.display = "none";
                    }
                }
                $btn.addEventListener('click', () => showList());
                $label.addEventListener('click', () => showList());

                $list.querySelectorAll('.onui-item').forEach(function (elem, i) {
                    elem.addEventListener('click', function () {
                        let dv = document.defaultView;
                        if (dv != null) {
                            const font = dv.getComputedStyle(elem, null).fontFamily;
                            $label.style.fontFamily = font;
                            $list.setAttribute('font', font);
                        }

                        const text = String(elem.textContent);
                        $label.textContent = text;
                        $list.style.display = 'none';
                    });
                });
            });

    }
    #multiSlider() {
        document.querySelectorAll('onui[type="range"]')
            .forEach(($elem, idx) => {
                let id = $elem.getAttribute('id');
                if (id === null) {
                    id = `onui-multi-slider${idx}`;
                    $elem.setAttribute('id', id);
                }
                let min = $elem.getAttribute('min');
                if (min === null) {
                    min = 0;
                }
                let max = $elem.getAttribute('max');
                if (max === null) {
                    max = 100;
                }
                let step = $elem.getAttribute('step');
                if (step === null) {
                    step = 1;
                }
                let val = $elem.getAttribute('value') === null ? null : $elem.getAttribute('value').split(',')
                if (val === null) {
                    val = [min, max];
                }

                // メインのスライダ
                const $slider0 = document.createElement('input');
                $slider0.classList.add('onui-min');
                $slider0.setAttribute('type', 'range');
                $slider0.setAttribute('min', min);
                $slider0.setAttribute('max', max);
                $slider0.setAttribute('step', step);
                $slider0.value = val[0];

                // サブのスライダ
                const $slider1 = document.createElement('input');
                $slider1.classList.add('onui-max');
                $slider1.setAttribute('type', 'range');
                $slider1.setAttribute('min', min);
                $slider1.setAttribute('max', max);
                $slider1.setAttribute('step', step);
                $slider1.value = val[1];

                $elem.appendChild($slider0);
                $elem.appendChild($slider1);


                let accentColor = '#4287f5';
                let baseColor = '#444';
                if ($elem.style.length > 0) {
                    if ($elem.style.accentColor !== '')
                        accentColor = $elem.style.accentColor;
                    if ($elem.style.backgroundColor !== '')
                        baseColor = $elem.style.backgroundColor;

                    let thumbFill = $elem.style.color;
                    let thumbStroke = $elem.style.borderColor;
                    let width = $elem.style.width;
                    let height = $elem.style.height;
                    let margin = $elem.style.margin;
                    if (thumbFill === '') thumbFill = '#666';
                    if (thumbStroke === '') thumbStroke = '#666';
                    if (width === '') width = 120;
                    if (height === '') height = 2;

                    this.#addStyle(`#${id} { margin: ${margin}; } #${id} .onui-min::-webkit-slider-thumb, #${id} .onui-max::-webkit-slider-thumb { border: 1px solid ${thumbStroke};  background-color: ${thumbFill}; } #${id} { width : ${width} } #${id} .onui-min, #${id} .onui-max { height : ${height} }`);

                    $elem.style = '';
                }

                updateSlider();

                function updateSlider() {
                    const vmin = Number($slider0.value);
                    const vmax = Number($slider1.value);
                    if (vmin >= vmax) {
                        $slider0.value = vmax;
                        $slider1.value = vmin;
                    }

                    $elem.value = `${vmin},${vmax}`;

                    let ratio0 = Math.round((vmin - min) / (max - min) * 100);
                    let ratio1 = Math.round((vmax - min) / (max - min) * 100);

                    $slider0.style.background = `linear-gradient(90deg, ${baseColor} ${ratio0}%, ${accentColor} ${ratio0}%, ${accentColor} ${ratio1}%, ${baseColor} ${ratio1}%)`;
                }
                $slider0.addEventListener('input', function (elem) {
                    updateSlider();
                })
                $slider1.addEventListener('input', function (elem) {
                    updateSlider();
                });
            });
    }

    #accordion() {
        document.querySelectorAll('onui[type="accordion"]')
            .forEach(($elem, idx) => {
                let id = $elem.getAttribute('id');
                if (id === null) {
                    id = `onui-accordion${idx}`;
                    $elem.setAttribute('id', id);
                }

                $elem.querySelectorAll('option')
                    .forEach(($option, idx) => {
                        $elem.appendChild($option);
                        
                        let label = $option.value;
                        const $label = document.createElement('label');
                        $label.setAttribute('for', `${id}-hide-btn${idx}`);
                        $label.className = 'onui-label';
                        $label.textContent = label !== undefined ? label : parseHTMLcode('&nbsp;');

                        const $btn = document.createElement('onui-hide-btn');
                        $btn.textContent = parseHTMLcode('&#9650;');

                        $label.appendChild($btn);

                        const $chbox = document.createElement('input');
                        $chbox.setAttribute('id', `${id}-hide-btn${idx}`);
                        $chbox.setAttribute('type', 'checkbox');
                        $chbox.classList.add('onui-hide-checkbox');
                        $chbox.checked = $option.selected;

                        let name = $option.getAttribute('name');
                        let $item = document.querySelector(`#${name}`);
                        if($item === null) $item = document.createElement('div');
                        $item.classList.add('onui-accordion-item');

                        $option.insertAdjacentElement("beforebegin", $label);
                        $option.insertAdjacentElement("beforebegin", $chbox);
                        $option.insertAdjacentElement("beforebegin", $item);
                        $option.style.display = 'none';

                        if (!$chbox.checked) {
                            $btn.textContent = parseHTMLcode('&#9660;');
                            $item.style.display = 'none';
                        }

                        $chbox.addEventListener('input', function () {
                            const isShow = $chbox.checked;

                            // $elem.querySelectorAll('.onui-accordion-item').forEach(function ($elem) {
                            //     $elem.style.display = 'none';
                            // })
                            // $elem.querySelectorAll('.onui-hide-checkbox').forEach(function ($elem) {
                            //     $elem.checked = false;
                            // })
                            // $elem.querySelectorAll('onui-hide-btn').forEach(function ($elem) {
                            //     $elem.textContent = parseHTMLcode('&#9660;');
                            // })

                            $chbox.checked = isShow
                            if (isShow) {
                                $btn.textContent = parseHTMLcode('&#9650;');
                                $item.style.display = 'block';
                            } else {
                                $btn.textContent = parseHTMLcode('&#9660;');
                                $item.style.display = 'none';
                            }
                        });
                    });


                if ($elem.style.length > 0) {
                    let baseFill = $elem.style.backgroundColor;
                    let text = $elem.style.color;
                    let baseStroke = $elem.style.borderColor;
                    let borderRadius = $elem.style.borderRadius;
                    let borderStyle = $elem.style.borderStyle;
                    let borderWidth = $elem.style.borderWidth;
                    let width = $elem.style.width;
                    let height = $elem.style.height;
                    let textAlign = $elem.style.textAlign;
                    let padding = $elem.style.padding;
                    let margin = $elem.style.margin;
                    let fontSize = $elem.style.fontSize;
                    let fontFamily = $elem.style.fontFamily;

                    // if (baseFill === '') baseFill = '#FFF';
                    // if (baseStroke === '') baseStroke = '#666';
                    // if (text === '') text = '#000';
                    // if (width === '') width = 120;
                    // if (height === '') height = 2;

                    this.#addStyle(`#${id} { width : ${width}; height: ${height}; margin: ${margin}; } #${id} label { background: ${baseFill}; border-color: ${baseStroke}; border-radius: ${borderRadius}; border-width: ${borderWidth}; border-style: ${borderStyle}; color: ${text}; font-size: ${fontSize}; font-family: ${fontFamily}; text-align :${textAlign}; padding: ${padding}} #${id} onui-hide-btn { color : ${text}; }`);

                    $elem.style = '';
                }
            });

    }



    #tab() {
        document.querySelectorAll('onui[type="tab"]')
            .forEach(($elem, idx) => {
                let id = $elem.getAttribute('id');
                if (id === null) {
                    id = `onui-tab${idx}`;
                    $elem.setAttribute('id', id);
                }

                const $selectors = document.createElement('onui-selectors');
                $elem.insertAdjacentElement('afterbegin', $selectors);

                let tabSeleted = 0;

                $elem.querySelectorAll('option')
                    .forEach(($option, idx) => {
                        // $elem.appendChild($option);

                        // セレクタ
                        const $selectorBox = document.createElement('onui-selector-box');

                        let label = $option.value;
                        const $label = document.createElement('label');
                        $label.setAttribute('for', `${id}-tab-btn${idx}`);
                        $label.classList = 'onui-tab-label';
                        $label.textContent = label !== undefined ? label : parseHTMLcode('&nbsp;');

                        const $radioBtn = document.createElement('input');
                        $radioBtn.setAttribute('id', `${id}-tab-btn${idx}`);
                        $radioBtn.setAttribute('type', 'radio');
                        $radioBtn.setAttribute('name', id);
                        $radioBtn.checked = $option.selected;
                        if ($radioBtn.checked) tabSeleted++;

                        let name = $option.getAttribute('name');
                        let $item = document.querySelector(`#${name}`);
                        if($item === null) $item = document.createElement('div');
                        $item.classList.add('onui-tab-item');
                        $elem.appendChild($item);

                        $selectorBox.appendChild($radioBtn);
                        $selectorBox.appendChild($label);
                        $selectors.append($selectorBox);
                        $option.style.display = 'none';

                        if (!$radioBtn.checked) {
                            $item.style.display = 'none';
                        }

                        $radioBtn.addEventListener('input', function () {
                            const isShow = $radioBtn.checked;

                            $elem.querySelectorAll('.onui-tab-item').forEach(function ($elem) {
                                $elem.style.display = 'none';
                            });

                            if (isShow) {
                                $item.style.display = 'block';
                            } else {
                                $item.style.display = 'none';
                            }
                        });

                    });

                // selectedが指定されなかった場合は1つめを選択状態にする
                if (tabSeleted === 0) {
                    $selectors.querySelector('input[type="radio"]').checked = true;
                    $elem.querySelector('.onui-tab-item').style.display = 'block';
                }

                if ($elem.style.length > 0) {
                    let baseFill = $elem.style.backgroundColor;
                    let baseStroke = $elem.style.borderColor;
                    let text = $elem.style.color;
                    let borderRadius = $elem.style.borderRadius;
                    let borderStyle = $elem.style.borderStyle;
                    let borderWidth = $elem.style.borderWidth;
                    let width = $elem.style.width;
                    let height = $elem.style.height;
                    let textAlign = $elem.style.textAlign;
                    let padding = $elem.style.padding;
                    let margin = $elem.style.margin;
                    let fontSize = $elem.style.fontSize;
                    let fontFamily = $elem.style.fontFamily;

                    // if (baseFill === '') baseFill = '#FFF';
                    // if (baseStroke === '') baseStroke = '#666';
                    // if (text === '') text = '#000';
                    // if (width === '') width = 300;
                    // if (height === '') height = auto;

                    this.#addStyle(`#${id} { width : ${width};  height: ${height}; margin: ${margin};  } #${id} label { background: ${baseFill}; border-color: ${baseStroke}; border-radius: ${borderRadius}; border-width: ${borderWidth}; border-style: ${borderStyle}; color: ${text}; font-size: ${fontSize}; font-family: ${fontFamily}; text-align :${textAlign}; padding: ${padding} }`);


                    $elem.style = '';
                }
            });
    }
}