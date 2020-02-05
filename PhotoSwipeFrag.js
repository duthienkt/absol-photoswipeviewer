import './photoswipefrag.css';
import Fragment from "absol/src/AppPattern/Fragment";
import AComp from 'absol-acomp';
import Dom from 'absol/src/HTML5/Dom';
import BrowserDetector from 'absol/src/Detector/BrowserDetector';

var _ = AComp._;
var $ = AComp.$;

/**
 * @typedef {Object}PSPhotoItem
 * @property {String} title
 * @property {String} src
 * @property {String} previewSrc
 * @property {Number} naturalWidth
 * @property {Number} naturalHeight
 * @property {Image} $image
 * @property {Promise} sync
 * @property {Number} scale
 * 
 */


function PhotoSwipeFrag() {
    Fragment.call(this);

    /**
     * @type {PhotoSwipeFragItem}
     */
    this.currentPhotoItem = null;
    /**
     * @type {Array<PhotoSwipeFragItem>}
     */
    this.photoItems = [];
    this.sync = Promise.resolve();
    this.mode = -1;
    this.snap = -1;
    // this.ev_pan_mousefinish = this.ev_pan_mousefinish.bind(this);
    // this.ev_pan_mousemove = this.ev_pan_mousemove.bind(this);
    // this._mouseData = null;
}

Object.defineProperties(PhotoSwipeFrag.prototype, Object.getOwnPropertyDescriptors(Fragment.prototype));
PhotoSwipeFrag.prototype.constructor = PhotoSwipeFrag;

PhotoSwipeFrag.prototype.SNAP_FIX_SIZE = 'SNAP_FIX_SIZE';
PhotoSwipeFrag.prototype.SNAP_ORIGIN_SIZE = 'SNAP_ORIGIN_SIZE';
PhotoSwipeFrag.prototype.MODE_PAN = 3;
PhotoSwipeFrag.prototype.MODE_ZOOM_IN = 4;
PhotoSwipeFrag.prototype.MODE_ZOOM_OUT = 5;

PhotoSwipeFrag.prototype.topbarBtnNames = [
    'download',
    'fixsize',
    'originsize',
    'pan_tool',
    'zoom_in',
    'zoom_out'];

PhotoSwipeFrag.prototype.topbarDescriptors = {
    download: {
        cmd: 'download',
        title: 'Tải về',
        mticon: 'file_download'
    },
    fixsize: {
        mticon: 'fullscreen',
        title: 'Vừa màn hình',
        cmd: 'showFixSize'
    },
    originsize: {
        mticon: 'fullscreen_exit',
        title: 'Kích thước dốc',
        cmd: 'showOriginSize'

    },
    pan_tool: {
        mticon: 'pan_tool',
        title: 'Di chuyển',
        cmd: 'panTool'
    },
    zoom_in: {
        mticon: 'zoom_in',
        title: 'Phóng to',
        cmd: 'zoomInTool'
    },
    zoom_out: {
        mticon: 'zoom_out',
        title: 'Thu nhỏ',
        cmd: 'zoomOutTool'
    }
}


PhotoSwipeFrag.prototype.getView = function () {
    var self = this;
    if (this.$view) return this.$view;
    this.$view = _({
        class: 'ptswpf',
        child: [
            {
                tag: 'button',
                class: ['ptswpf-to-prev-image'],
                child: { tag: 'i', child: { text: 'keyboard_arrow_left' }, class: 'material-icons' },
                on: {
                    click: this.prev.bind(this)

                }
            },
            {
                tag: 'button',
                class: ['ptswpf-to-next-image'],
                child: { tag: 'i', child: { text: 'keyboard_arrow_right' }, class: 'material-icons' },
                on: {
                    click: this.next.bind(this)
                }
            },
            {
                class: 'ptswpf-top-bar',
                child: this.topbarBtnNames.map(function (name) {
                    return {
                        tag: 'button',
                        class: 'ptswpf-action-' + name,
                        props: {
                            title: self.topbarDescriptors[name].title
                        },
                        on: {
                            click: self[self.topbarDescriptors[name].cmd || 'noop'].bind(self)
                        },
                        child: { tag: 'i', child: { text: self.topbarDescriptors[name].mticon }, class: 'material-icons' }
                    }
                })
            },
            '<a class="ptswpf-download-trigger" href="#" download target="_blank"></a>'
            // {
            //     class: 'ptswpf-image-ctn',
            //     child: {
            //         tag: 'img',
            //         class: 'ptswpf-image'
            //     },
            // }
        ]
    });

    this.$attachhook = _('attachhook').addTo(this.$view)
        .on('error', function () {
            Dom.addToResizeSystem(this);
            this.requestUpdateSize();
        });
    this.$attachhook.requestUpdateSize = this.updateSize.bind(this);
    this.$downloadTrigger = $('.ptswpf-download-trigger', this.$view);
    // this.$view.on('mousedown', this.ev_mousedown);
    if (this.mode == -1)
        this.panTool();
    return this.$view;
};


/**
 * @param {PSPhotoItem} item
 */
PhotoSwipeFrag.prototype.push = function (item) {
    if (typeof item == 'string') {
        item = { src: item };
    }
    var newItem = new PhotoSwipeFragItem(this, item);
    this.photoItems.push(newItem);
    if (!this.currentPhotoItem)
        this.setCurrentItem(newItem);
    if (this.photoItems.length > 1) {
        this.$view.addClass('ptswpf-multi-image');
    }
};


/**
 * @param {String} src
 * @returns {PSPhotoItem}
 */
PhotoSwipeFrag.prototype.findItem = function (src) {
    for (var i = 0; i < this.photoItems.length; ++i) {
        if (this.photoItems[i].src == src) return this.photoItems[i];
    }
    return null;
};

PhotoSwipeFrag.prototype.noop = function () { };


/**
 * @param {PhotoSwipeFragItem} item
 */
PhotoSwipeFrag.prototype.setCurrentItem = function (item) {

    if (typeof item == 'string') {
        item = { src: item };
    }
    if (this.currentPhotoItem == item) return;
    if (this.currentPhotoItem) {
        this.currentPhotoItem.beginAnimateTimeout();
        this.currentPhotoItem.moveToLeft();
    }
    /**
     * @type {}
     */
    item = this.findItem(item.src) || new PhotoSwipeFragItem(this, item);
    item.load().then(item.autoSize.bind(item));
    this.currentPhotoItem = item;
    item.mode = this.mode;
};


PhotoSwipeFrag.prototype.showFixSize = function () {
    if (this.currentPhotoItem) {
        this.currentPhotoItem.beginAnimateTimeout();
        this.currentPhotoItem.fixSize();
    }
};

PhotoSwipeFrag.prototype.showOriginSize = function () {
    if (this.currentPhotoItem) {
        this.currentPhotoItem.beginAnimateTimeout();
        this.currentPhotoItem.originSize();
    }
};


PhotoSwipeFrag.prototype.download = function () {
    if (this.currentPhotoItem) {
        this.$downloadTrigger.href = this.currentPhotoItem.src;
        this.$downloadTrigger.click();
    }
};



PhotoSwipeFrag.prototype.updateSize = function () {
    var item = this.currentPhotoItem;
    if (!item) return;

};

PhotoSwipeFrag.prototype.panTool = function () {
    this.$view.addClass('ptswpf-mode-pan')
        .removeClass('ptswpf-mode-zoom-in')
        .removeClass('ptswpf-mode-zoom-out');
    this.mode = this.MODE_PAN;
    if (this.currentPhotoItem)
        this.currentPhotoItem.panTool();
};



PhotoSwipeFrag.prototype.zoomInTool = function () {
    this.$view.removeClass('ptswpf-mode-pan')
        .addClass('ptswpf-mode-zoom-in')
        .removeClass('ptswpf-mode-zoom-out');
    this.mode = this.MODE_ZOOM_IN;
    this.currentPhotoItem.zoomInTool();
};

PhotoSwipeFrag.prototype.zoomOutTool = function () {
    this.$view.removeClass('ptswpf-mode-pan')
        .addClass('ptswpf-mode-zoom-out')
        .removeClass('ptswpf-mode-zoom-in');
    this.mode = this.MODE_ZOOM_OUT;
    this.currentPhotoItem.zoomOutTool();
};




PhotoSwipeFrag.prototype.next = function () {
    var currentItem = this.currentPhotoItem;
    var currentItemIndex = this.photoItems.indexOf(currentItem);
    var nextItemIndex = (currentItemIndex + 1) % this.photoItems.length;
    var nextItem = this.photoItems[nextItemIndex];
    if (nextItem == currentItem) return;
    currentItem.beginAnimateTimeout();
    currentItem.autoSize();
    currentItem.moveToLeft();

    nextItem.load();
    nextItem.$image.addStyle('opacity', '0');
    nextItem.moveToRight();
    nextItem.beginAnimateTimeout();
    nextItem.moveToCenter();
    nextItem.sync.then(function () {
        nextItem.beginAnimateTimeout();
        nextItem.autoSize();
        nextItem.$image.removeStyle('opacity');

    });
    this.currentPhotoItem = nextItem;
};


PhotoSwipeFrag.prototype.prev = function () {
    var currentItem = this.currentPhotoItem;
    var currentItemIndex = this.photoItems.indexOf(currentItem);
    var prevItemIndex = (currentItemIndex + this.photoItems.length - 1) % this.photoItems.length;
    var prevItem = this.photoItems[prevItemIndex];
    if (prevItem == currentItem) return;
    currentItem.beginAnimateTimeout();
    currentItem.autoSize();
    currentItem.moveToRight();

    prevItem.load();
    prevItem.$image.addStyle('opacity', '0');
    prevItem.moveToLeft();
    prevItem.beginAnimateTimeout();
    prevItem.moveToCenter();
    prevItem.sync.then(function () {
        prevItem.beginAnimateTimeout();
        prevItem.autoSize();
        prevItem.$image.removeStyle('opacity');

    });
    this.currentPhotoItem = prevItem;

};

var loadingUrl = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHN0eWxlPSJtYXJnaW46IGF1dG87ICBkaXNwbGF5OiBibG9jazsgc2hhcGUtcmVuZGVyaW5nOiBhdXRvOyIgd2lkdGg9IjIwMHB4IiBoZWlnaHQ9IjIwMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUwIDUwKSI+ICA8ZyB0cmFuc2Zvcm09InNjYWxlKDAuNykiPiAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTAgLTUwKSI+ICAgICAgPGcgdHJhbnNmb3JtPSJyb3RhdGUoMTI3LjU2MiA1MCA1MCkiPiAgICAgICAgPGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiB2YWx1ZXM9IjAgNTAgNTA7MzYwIDUwIDUwIiBrZXlUaW1lcz0iMDsxIiBkdXI9IjAuNzU3NTc1NzU3NTc1NzU3NnMiPjwvYW5pbWF0ZVRyYW5zZm9ybT4gICAgICAgIDxwYXRoIGZpbGwtb3BhY2l0eT0iMC44IiBmaWxsPSIjZTE1YjY0IiBkPSJNNTAgNTBMNTAgMEE1MCA1MCAwIDAgMSAxMDAgNTBaIj48L3BhdGg+ICAgICAgPC9nPiAgICAgIDxnIHRyYW5zZm9ybT0icm90YXRlKDk1LjY2ODQgNTAgNTApIj4gICAgICAgIDxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIgdHlwZT0icm90YXRlIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgdmFsdWVzPSIwIDUwIDUwOzM2MCA1MCA1MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxLjAxMDEwMTAxMDEwMTAxMDJzIj48L2FuaW1hdGVUcmFuc2Zvcm0+ICAgICAgICA8cGF0aCBmaWxsLW9wYWNpdHk9IjAuOCIgZmlsbD0iI2Y0N2U2MCIgZD0iTTUwIDUwTDUwIDBBNTAgNTAgMCAwIDEgMTAwIDUwWiIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgNTAgNTApIj48L3BhdGg+ICAgICAgPC9nPiAgICAgIDxnIHRyYW5zZm9ybT0icm90YXRlKDYzLjc3OTcgNTAgNTApIj4gICAgICAgIDxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIgdHlwZT0icm90YXRlIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgdmFsdWVzPSIwIDUwIDUwOzM2MCA1MCA1MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxLjUxNTE1MTUxNTE1MTUxNTFzIj48L2FuaW1hdGVUcmFuc2Zvcm0+ICAgICAgICA8cGF0aCBmaWxsLW9wYWNpdHk9IjAuOCIgZmlsbD0iI2Y4YjI2YSIgZD0iTTUwIDUwTDUwIDBBNTAgNTAgMCAwIDEgMTAwIDUwWiIgdHJhbnNmb3JtPSJyb3RhdGUoMTgwIDUwIDUwKSI+PC9wYXRoPiAgICAgIDwvZz4gICAgICA8ZyB0cmFuc2Zvcm09InJvdGF0ZSgzMS44ODk1IDUwIDUwKSI+ICAgICAgICA8YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHZhbHVlcz0iMCA1MCA1MDszNjAgNTAgNTAiIGtleVRpbWVzPSIwOzEiIGR1cj0iMy4wMzAzMDMwMzAzMDMwMzAzcyI+PC9hbmltYXRlVHJhbnNmb3JtPiAgICAgICAgPHBhdGggZmlsbC1vcGFjaXR5PSIwLjgiIGZpbGw9IiNhYmJkODEiIGQ9Ik01MCA1MEw1MCAwQTUwIDUwIDAgMCAxIDEwMCA1MFoiIHRyYW5zZm9ybT0icm90YXRlKDI3MCA1MCA1MCkiPjwvcGF0aD4gICAgICA8L2c+ICAgIDwvZz4gIDwvZz48L2c+PCEtLSBbbGRpb10gZ2VuZXJhdGVkIGJ5IGh0dHBzOi8vbG9hZGluZy5pby8gLS0+PC9zdmc+";

/**
 * 
 * @param {PhotoSwipeFrag} parent
 * @param {*} props 
 */
function PhotoSwipeFragItem(parent, props) {
    /**
     * @type {PhotoSwipeFrag}
     */
    this.parent = parent;
    /**
     * @type {String}
     */
    this.src = props.src;
    /**
     * @type {HTMLImageElement}
     */
    this.$image = null;

    /**
     * @type {HTMLElement}
     */
    this.$frame = null;

    this._animateTimeout = -1;

    this.naturalWidth = 1;
    this.naturalHeight = 1;
    /**
     * @type {String}
     */
    this.title = '';
    this.viewPosition = 0;

    this.sync = Promise.resolve();
    this.ev_updateSize = this.ev_updateSize.bind(this);
    this.ev_mousedown = this.ev_mousedown.bind(this);
    this.ev_pan_mousedown = this.ev_pan_mousedown.bind(this);
    this.ev_pan_mousemove = this.ev_pan_mousemove.bind(this);
    this.ev_pan_mousefinish = this.ev_pan_mousefinish.bind(this);

};

PhotoSwipeFragItem.prototype.ev_updateSize = function () {
    if (this.snap == this.SNAP_FIX_SIZE) {
        this.fixSize();
    }
};

PhotoSwipeFragItem.prototype.load = function () {
    var self = this;
    if (!this.$frame) {
        this.$frame = _('.ptswpf-frame').addTo(this.parent.$view)
            .on(BrowserDetector.isMobile ? 'pointerdown' : 'mousedown', this.ev_mousedown);
        this.$loadingImage = _('img.ptswpf-frame-loading-img').addTo(this.$frame);
        this.$loadingImage.src = loadingUrl;
        this.$attachhook = _('attachhook').addTo(this.$frame)
            .on('error', function () {
                Dom.addToResizeSystem(this);
            });
        this.$attachhook.updateSize = this.ev_updateSize;
        this.$image = _('img.ptswpf-image').addTo(this.$frame);
        this.$image.src = this.src;
        this.$image.draggable = false;
        this.sync = Dom.waitImageLoaded(this.$image)
            .then(function () {
                self.naturalHeight = self.$image.naturalHeight;
                self.naturalWidth = self.$image.naturalWidth;
                self.$loadingImage.remove();
            });
    }
    return this.sync;
};




PhotoSwipeFragItem.prototype.beginAnimateTimeout = function (duration) {
    if (duration === undefined) duration = 300;
    var self = this;
    if (this._animateTimeout > 0) {
        clearTimeout(this._animateTimeout);
        this._animateTimeout = -1;
    }
    this.$frame.addClass('ptswpf-move-animation');
    this._animateTimeout = setTimeout(function () {
        self.$frame.removeClass('ptswpf-move-animation');
        self._animateTimeout = -1;
    }, duration)
};


PhotoSwipeFragItem.prototype.getScaleToFix = function (width, height) {
    return Math.min(width / this.naturalWidth, height / this.naturalHeight)
};


PhotoSwipeFragItem.prototype.scale = function (s) {
    var nWidth = this.naturalWidth * this.scale;
    var nHeight = this.naturalHeight * this.scale;
    var frameBound = this.$frame.getBoundingClientRect();
    var nLeft = frameBound.width / 2 + dx - nWidth * ox;
    var nTop = frameBound.height / 2 + dy - nHeight * oy;

    var maxTop, minTop, maxLeft, minLeft;
    if (nHeight > frameBound.height) {
        maxTop = 0;
        minTop = frameBound.height - nHeight;
    }
    else {
        minTop = frameBound.height / 2 - nHeight / 2;
        maxTop = minTop;
    }

    if (nWidth > frameBound.width) {
        maxLeft = 0;
        minLeft = frameBound.width - nWidth;
    }
    else {
        minLeft = frameBound.width / 2 - nWidth / 2;
        maxLeft = minLeft;
    }

    nLeft = Math.min(Math.max(nLeft, minLeft), maxLeft);
    nTop = Math.min(Math.max(nTop, minTop), maxTop);

    if (hs < 1 && nWidth < this.naturalWidth && Math.max(nWidth, nHeight) < 10) return;

    this.$image.addStyle({
        width: nWidth + 'px',
        height: nHeight + 'px',
        left: 'calc(' + (nLeft - frameBound.width / 2) + 'px + 50%)',
        top: 'calc(' + (nTop - frameBound.height / 2) + 'px + 50%)'
    });
};



PhotoSwipeFragItem.prototype.SNAP_FIX_SIZE = 'SNAP_FIX_SIZE';
PhotoSwipeFragItem.prototype.SNAP_ORIGIN_SIZE = 'SNAP_ORIGIN_SIZE';
PhotoSwipeFragItem.prototype.MODE_PAN = 3;
PhotoSwipeFragItem.prototype.MODE_ZOOM_IN = 4;
PhotoSwipeFragItem.prototype.MODE_ZOOM_OUT = 5;



PhotoSwipeFragItem.prototype.originSize = function () {
    this.snap = this.SNAP_ORIGIN_SIZE;
    /**
     * @type {PSPhotoItem}
     */
    var imageBound = this.$image.getBoundingClientRect();
    this.$image.addStyle('left', 'calc(50% - ' + (this.naturalWidth / 2) + 'px)')
    this.$image.addStyle('top', 'calc(50% - ' + (this.naturalHeight / 2) + 'px)');
    this.$image.addStyle({
        width: this.naturalWidth + 'px',
        height: this.naturalHeight + 'px',
    });
    this.scale = 1;
};


PhotoSwipeFragItem.prototype.fixSize = function () {
    this.snap = this.SNAP_FIX_SIZE;
    /**
     * @type {PSPhotoItem}
     */
    var frameSize = this.$frame.getBoundingClientRect();
    var newWidth;
    var newHeight;
    if (frameSize.width / frameSize.height > this.naturalWidth / this.naturalHeight) {
        newHeight = frameSize.height;
        newWidth = newHeight * this.naturalWidth / this.naturalHeight;
    }
    else {
        newWidth = frameSize.width;
        newHeight = newWidth * this.naturalHeight / this.naturalWidth;
    }

    this.$image.addStyle('left', 'calc(50% - ' + (newWidth / 2) + 'px)')
    this.$image.addStyle('top', 'calc(50% - ' + (newHeight / 2) + 'px)');
    this.$image.addStyle({
        width: newWidth + 'px',
        height: newHeight + 'px',

    });
    this.scale = newWidth / this.naturalWidth;
};


PhotoSwipeFragItem.prototype.autoSize = function () {
    var frameSize = this.$frame.getBoundingClientRect();
    if (this.naturalHeight > frameSize.height || this.naturalWidth > frameSize.width) {
        this.fixSize();
    }
    else {
        this.originSize();
    }
}



PhotoSwipeFragItem.prototype.moveToLeft = function () {
    this.$frame.removeClass('ptswpf-frame-right')
        .addClass('ptswpf-frame-left');
    this.viewPosition = -1;
};


PhotoSwipeFragItem.prototype.moveToRight = function () {
    this.$frame.removeClass('ptswpf-frame-left')
        .addClass('ptswpf-frame-right');
    this.viewPosition = 1;
};



PhotoSwipeFragItem.prototype.moveToCenter = function () {
    this.$frame.removeClass('ptswpf-frame-left')
        .removeClass('ptswpf-frame-right');
    this.viewPosition = 0;
};

PhotoSwipeFragItem.prototype.panTool = function () {
    this.mode = this.MODE_PAN;
};


PhotoSwipeFragItem.prototype.zoomInTool = function () {
    this.mode = this.MODE_ZOOM_IN;
};


PhotoSwipeFragItem.prototype.zoomOutTool = function () {
    this.mode = this.MODE_ZOOM_OUT;
};



PhotoSwipeFragItem.prototype.zoom = function (hs, ev) {
    var imgBound = this.$image.getBoundingClientRect();
    var frameSize = this.$frame.getBoundingClientRect();
    var ox = 0.5, oy = 0.5, dx = 0, dy = 0;
    if (event) {
        ox = (event.clientX - imgBound.left) / (imgBound.right - imgBound.left);
        oy = (event.clientY - imgBound.top) / (imgBound.bottom - imgBound.top);
        dx = event.clientX - (frameSize.left + frameSize.right) / 2;
        dy = event.clientY - (frameSize.top + frameSize.bottom) / 2;
    }

    if (hs == this.SNAP_FIX_SIZE) {
        this.scale = Math.min(frameSize.width / this.naturalWidth, frameSize.height / this.naturalHeight);
    }
    else if (hs == this.SNAP_ORIGIN_SIZE) {
        this.scale = 1;
    }
    else {
        this.scale *= hs;
    }
    var viewImg = this.$image;

    var nWidth = this.naturalWidth * this.scale;
    var nHeight = this.naturalHeight * this.scale;


    var nLeft = frameSize.width / 2 + dx - nWidth * ox;
    var nTop = frameSize.height / 2 + dy - nHeight * oy;

    var maxTop, minTop, maxLeft, minLeft;
    if (nHeight > frameSize.height) {
        maxTop = 0;
        minTop = frameSize.height - nHeight;
    }
    else {
        minTop = frameSize.height / 2 - nHeight / 2;
        maxTop = minTop;
    }

    if (nWidth > frameSize.width) {
        maxLeft = 0;
        minLeft = frameSize.width - nWidth;
    }
    else {
        minLeft = frameSize.width / 2 - nWidth / 2;
        maxLeft = minLeft;
    }

    nLeft = Math.min(Math.max(nLeft, minLeft), maxLeft);
    nTop = Math.min(Math.max(nTop, minTop), maxTop);

    if (hs < 1 && nWidth < this.naturalWidth && Math.max(nWidth, nHeight) < 10) return;

    // setTimeout(function () {
    this.$image.addStyle({
        width: nWidth + 'px',
        height: nHeight + 'px',
        left: 'calc(' + (nLeft - frameSize.width / 2) + 'px + 50%)',
        top: 'calc(' + (nTop - frameSize.height / 2) + 'px + 50%)'
    });
};



PhotoSwipeFragItem.prototype.ev_mousedown = function (event) {
    var bound = this.$frame.getBoundingClientRect();
    var imgBound = this.$image.getBoundingClientRect();

    this._mouseData = {
        bound: bound,
        imgBound: imgBound,
        imgBound: imgBound,
        clientX: event.clientX,
        clientY: event.clientY,
        offsetX: event.clientX - bound.left,
        offsetY: event.clientY - bound.top,
        imgOffsetX: event.clientX - imgBound.left,
        imgOffsetY: event.clientY - imgBound.top,
        imgOffsetXR: (event.clientX - imgBound.left) / imgBound.width,
    };
    if (event.target.classList.contains('ptswpf-image')) {
        if (this.mode == this.MODE_PAN) {
            this.ev_pan_mousedown(event);
        }
        else if (this.mode == this.MODE_ZOOM_IN) {
            this.ev_zoomin_mousedown(event);
        }
        else if (this.mode == this.MODE_ZOOM_OUT) {
            this.ev_zoomout_mousedown(event);
        }
    }
};



PhotoSwipeFragItem.prototype.ev_pan_mousemove = function (event) {
    console.log(event.type);

    event.preventDefault();
    this.snap = -1;
    var bound = this.$frame.getBoundingClientRect();
    var newOffsetX = event.clientX - bound.left;
    var newOffsetY = event.clientY - bound.top;
    var dx = newOffsetX - this._mouseData.offsetX;
    var dy = newOffsetY - this._mouseData.offsetY;
    this.$image.addStyle({
        left: 'calc(' + (-this._mouseData.bound.width / 2 + this._mouseData.imgBound.left - this._mouseData.bound.left + dx) + 'px + 50%)',
        top: 'calc(' + (-this._mouseData.bound.height / 2 + this._mouseData.imgBound.top - this._mouseData.bound.top + dy) + 'px + 50%)',
    });
};

PhotoSwipeFragItem.prototype.ev_pan_mousefinish = function (event) {
    $(document.body)
        .off(BrowserDetector.isMobile ? 'pointermove' : 'mousemove', this.ev_pan_mousemove)
        .off(BrowserDetector.isMobile ? 'pointerleave' : 'mouseleave', this.ev_pan_mousefinish)
        .off(BrowserDetector.isMobile ? 'pointerup' : 'mouseup', this.ev_pan_mousefinish);
    var newStyle = {};
    var imgBound = this.$image.getBoundingClientRect();
    var bound = this.$frame.getBoundingClientRect();

    if (bound.width > imgBound.width) {
        newStyle.left = 'calc(50% - ' + (imgBound.width / 2) + 'px)';
    }
    else if (imgBound.left > bound.left) {
        newStyle.left = 'calc(50% - ' + (bound.width / 2) + 'px)';
    }
    else if (imgBound.right < bound.right) {
        newStyle.left = 'calc(' + (bound.width / 2 - imgBound.width) + 'px + 50%)';
    }
    if (bound.height > imgBound.height) {
        newStyle.top = 'calc(50% - ' + (imgBound.height / 2) + 'px)';
    } else if (imgBound.top > bound.top) {
        newStyle.top = 'calc(50% - ' + (bound.height / 2) + 'px)';
    }
    else if (imgBound.bottom < bound.bottom) {
        newStyle.top = 'calc(' + (bound.height / 2 - imgBound.height) + 'px + 50%)';
    }


    if (newStyle.left || newStyle.top) {
        this.beginAnimateTimeout();
        this.$image.addStyle(newStyle);
    }
};

PhotoSwipeFragItem.prototype.ev_pan_mousedown = function (event) {
    $(document.body)
        .on(BrowserDetector.isMobile ? 'pointermove' : 'mousemove', this.ev_pan_mousemove)
        .on(BrowserDetector.isMobile ? 'pointerleave' : 'mouseleave', this.ev_pan_mousefinish)
        .on(BrowserDetector.isMobile ? 'pointerup' : 'mouseup', this.ev_pan_mousefinish);
};



PhotoSwipeFragItem.prototype.ev_zoomin_mousedown = function (event) {
    this.beginAnimateTimeout();
    this.zoom(1.3, event);
};

PhotoSwipeFragItem.prototype.ev_zoomout_mousedown = function (event) {
    this.beginAnimateTimeout();
    this.zoom(1 / 1.3, event);
};

export default PhotoSwipeFrag;
