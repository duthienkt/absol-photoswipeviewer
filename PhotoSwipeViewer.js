import AComp from "../AComp/AComp";

import photoswipeviewer_css from './photoswipeviewer.css';
import Dom from "../HTML5/Dom";
import Draggable from "../AComp/js/Draggable";
import Element from "../HTML5/Element";

var _ = AComp._;
var $ = AComp.$;



function PhotoSwipeViewer() {
    this.photoList = [];
    this.currentPhotoItem = null;
    this.STATE_END = 9;
    this.STATE_PICKED = 1;
    this.state = 0;
    this.tool = -1;
    this.TOOL_ZOOM_IN = 1;
    this.TOOL_ZOOM_OUT = 2;
    this.TOOL_PAN = 3;
    this.FIXED = "FIXED";
    this.ORIGIN = "ORIGIN";
}



PhotoSwipeViewer.prototype.close = function () {
    if (this.state == this.STATE_END) return;
    this.state = this.STATE_END;
    this.disableTool();
    if (this.$viewingImg) {
        var photoItem = this.currentPhotoItem;
        this.$viewingImg.addClass('transition-all');
        setTimeout(function () {
            this.$viewingImg.addStyle(photoItem.initStyle);
        }.bind(this), 1);

        setTimeout(function () {
            this.$viewingImg.removeClass('transition-all');
            this.$view.removeClass('full').removeClass('prepare-hide');
            this.$viewingImg.selfRemove();
            this.$viewingImg = null;
        }.bind(this), 305);
    }
    this.$view.addClass('prepare-hide');
};

PhotoSwipeViewer.prototype.disableTool = function () {
    this.tool = -1;
    this.$frame
        .removeClass('ptswpv-tool-mode-zoom-in')
        .removeClass('ptswpv-tool-mode-zoom-out')
        .removeClass('ptswpv-tool-mode-pan');
}


PhotoSwipeViewer.prototype.activePanTool = function () {
    this.tool = this.TOOL_PAN;
    this.$frame
        .removeClass('ptswpv-tool-mode-zoom-in')
        .removeClass('ptswpv-tool-mode-zoom-out')
        .addClass('ptswpv-tool-mode-pan');
};

PhotoSwipeViewer.prototype.activeZoomInTool = function () {
    this.tool = this.TOOL_ZOOM_IN;
    this.$frame
        .removeClass('ptswpv-tool-mode-pan')
        .removeClass('ptswpv-tool-mode-zoom-out')
        .addClass('ptswpv-tool-mode-zoom-in');
};


PhotoSwipeViewer.prototype.activeZoomOutTool = function () {
    this.tool = this.TOOL_ZOOM_OUT;
    this.$frame
        .removeClass('ptswpv-tool-mode-pan')
        .removeClass('ptswpv-tool-mode-zoom-in')
        .addClass('ptswpv-tool-mode-zoom-out');
};


PhotoSwipeViewer.prototype.zoom = function (hs, event) {
    var imgBound = this.$viewingImg.getBoundingClientRect();
    var frameSize = this.$frame.getBoundingClientRect();
    var ox = 0.5, oy = 0.5, dx = 0, dy = 0;
    if (event) {
        ox = (event.clientX - imgBound.left) / (imgBound.right - imgBound.left);
        oy = (event.clientY - imgBound.top) / (imgBound.bottom - imgBound.top);
        dx = event.clientX - (frameSize.left + frameSize.right) / 2;
        dy = event.clientY - (frameSize.top + frameSize.bottom) / 2;
    }


    var photoItem = this.currentPhotoItem;
    if (hs == this.FIXED) {
        photoItem.scale = Math.min(frameSize.width / photoItem.originSize.width, frameSize.height / photoItem.originSize.height);
    }
    else if (hs == this.ORIGIN) {
        photoItem.scale = 1;
    }
    else {
        photoItem.scale *= hs;
    }
    var viewImg = this.$viewingImg;

    var nWidth = photoItem.originSize.width * photoItem.scale;
    var nHeight = photoItem.originSize.height * photoItem.scale;


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

    if (hs < 1 && nWidth < photoItem.originSize.width && Math.max(nWidth, nHeight) < 10) return;

    viewImg.addClass('transition-all');

    setTimeout(function () {
        this.$viewingImg.addStyle({
            width: nWidth + 'px',
            height: nHeight + 'px',
            left: nLeft + 'px',
            top: nTop + 'px'
        });

        if (photoItem._transitionTimeout) {
            clearTimeout(photoItem._transitionTimeout);
        }
        photoItem._transitionTimeout = setTimeout(function () {
            viewImg.removeClass('transition-all');
            photoItem._transitionTimeout = -1;
        }, 300);

    }.bind(this), 1);
}

PhotoSwipeViewer.prototype.zoomFixedSize = function () {
    // aspect_ratio
    this.zoom(this.FIXED);
}
PhotoSwipeViewer.prototype.zoomOriginSize = function () {
    // aspect_ratio
    this.zoom(this.ORIGIN);
}


PhotoSwipeViewer.prototype.download = function () {
    this.$downloadA.attr({
        href: this.currentPhotoItem.originImg.src,
        download: this.currentPhotoItem.originFileName || 'image',
        target: "_blank"
    }).click();
}

PhotoSwipeViewer.prototype.clickHandler = function (event) {
    event.preventDefault();
    if (this.tool == this.TOOL_ZOOM_IN) this.zoom(1.3, event);
    if (this.tool == this.TOOL_ZOOM_OUT) this.zoom(1 / 1.3, event);

};

PhotoSwipeViewer.prototype.dragHandler = function (event) {
    event.preventDefault();
    if (this.tool == this.TOOL_PAN) {
        var imgBound = this.$viewingImg.getBoundingClientRect();
        var frameSize = this.$frame.getBoundingClientRect();
        var nTop = imgBound.top - frameSize.top + event.movementY;
        var nLeft = imgBound.left - frameSize.left + event.movementX;
        this.$viewingImg.addStyle({
            top: nTop + 'px',
            left: nLeft + 'px'
        })


    }
};

PhotoSwipeViewer.prototype.endragHandler = function (event) {
    event.preventDefault();
    if (this.tool == this.TOOL_PAN) {
        var imgBound = this.$viewingImg.getBoundingClientRect();
        var frameSize = this.$frame.getBoundingClientRect();

        var top = imgBound.top - frameSize.top;
        var left = imgBound.left - frameSize.left;
        var maxTop, minTop, maxLeft, minLeft;
        if (imgBound.height > frameSize.height) {
            maxTop = 0;
            minTop = frameSize.height - imgBound.height;
        }
        else {
            minTop = frameSize.height / 2 - imgBound.height / 2;
            maxTop = minTop;
        }

        if (imgBound.width > frameSize.width) {
            maxLeft = 0;
            minLeft = frameSize.width - imgBound.width;
        }
        else {
            minLeft = frameSize.width / 2 - imgBound.width / 2;
            maxLeft = minLeft;
        }

        var nLeft = Math.min(Math.max(left, minLeft), maxLeft);
        var nTop = Math.min(Math.max(top, minTop), maxTop);
        var dx = nLeft - left;
        var dy = nTop - top;
        if (dx != 0 || dy != 0) {
            var img = this.$viewingImg;
            setTimeout(function () {
                img.addClass('transition-all');
                setTimeout(function () {
                    img.addStyle({
                        left: nLeft + 'px',
                        top: nTop + 'px'
                    });
                    setTimeout(function () {
                        img.removeClass('transition-all');
                    }, 300);
                }, 1)
            }, 1)
        }
        console.log(dx, dy);


    }
}



PhotoSwipeViewer.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.topbarBtnNames = ['file_download', 'fullscreen', 'fullscreen_exit', 'pan_tool', 'zoom_in', 'zoom_out', 'close',];
    this.$view = _(
        {
            class: 'ptswpv',

            child: [
                'a.ptswpv-download',
                {
                    class: 'ptswpv-frame',
                    attr: {
                        tabindex: '1'
                    },
                    child: [
                        { class: 'ptswpv-viewing-container' },
                        '.ptswpv-renderer',
                        {
                            class: 'ptswpv-top-bar',
                            child: this.topbarBtnNames.map(function (name) { return `<button class="ptswpv-transp-btn ptswpv-btn-${name}"> <i class="material-icons">${name}</i></button>` })
                        }
                    ]
                },
            ]
        }
    );


    this.$viewingContainder = $('.ptswpv-viewing-container', this.$view);
    this.$renderer = $('.ptswpv-renderer', this.$view);
    this.$frame = $('.ptswpv-frame', this.$view);
    this.$closeBtn = $('.ptswpv-btn-close', this.$view).on('click', this.close.bind(this));
    this.$panToolBtn = $('.ptswpv-btn-pan_tool', this.$view).on('click', this.activePanTool.bind(this));
    this.$zoomInToolBtn = $('.ptswpv-btn-zoom_in', this.$view).on('click', this.activeZoomInTool.bind(this));
    this.$zoomOutToolBtn = $('.ptswpv-btn-zoom_out', this.$view).on('click', this.activeZoomOutTool.bind(this));
    this.$fixedBtn = $('.ptswpv-btn-fullscreen', this.$view).on('click', this.zoomFixedSize.bind(this));
    this.$originSizeBtn = $('.ptswpv-btn-fullscreen_exit', this.$view).on('click', this.zoomOriginSize.bind(this));
    this.$downloadBtn = $('.ptswpv-btn-file_download', this.$view).on('click', this.download.bind(this));

    Draggable(this.$viewingContainder).on('drag', this.dragHandler.bind(this)).on('enddrag', this.endragHandler.bind(this)).on('click', this.clickHandler.bind(this));;
    this.$downloadA = $('a.ptswpv-download', this.$view);
    return this.$view;
}


PhotoSwipeViewer.prototype.pickImageElement = function (element, originLink, originFileName) {
    if (typeof element == "string") {
        element = $(element);
    }
    if (!element) return false;
    this.state = this.STATE_PICKED;



    this.activeZoomInTool();
    var photoItem = {};
    this.photoList.push(photoItem);
    this.currentPhotoItem = photoItem;


    var eBound = element.getBoundingClientRect();
    var initStyle = {
        top: eBound.top + 'px',
        left: eBound.left + 'px',
        width: eBound.right - eBound.left + 'px',
        height: eBound.bottom - eBound.top + 'px'
    };

    photoItem.initStyle = initStyle;

    this.$view.addClass('full');
    var originImg = (originLink ? _('img').attr('src', originLink) : $(element.cloneNode()))
        .attr('style', null)
        .attr('class', null).addTo(this.$renderer);
    var sizeRequest = Dom.waitImageLoaded(originImg).then(function () {
        return originImg.getBoundingClientRect();
    });

    photoItem.originImg = originImg;

    photoItem.originFileName = originFileName || '';


    this.$viewingImg = $(element.cloneNode())
        .attr('style', null)
        .attr('class', 'ptswpv-viewing-img')
        .addTo(this.$viewingContainder)
        .addStyle(initStyle);
    setTimeout(function () {
        sizeRequest.then(function (originSize) {
            var frameSize = this.$frame.getBoundingClientRect();
            var scale = Math.min(frameSize.width / originSize.width, frameSize.height / originSize.height, 1);
            photoItem.scale = scale;
            photoItem.originSize = originSize;
            var imgViewSize = { width: originSize.width * scale, height: originSize.height * scale };
            var imageViewStyle = {
                width: imgViewSize.width + 'px',
                height: imgViewSize.height + 'px',
                left: (frameSize.width - imgViewSize.width) / 2 + 'px',
                top: (frameSize.height - imgViewSize.height) / 2 + 'px',
            }
            this.$viewingImg.addClass('transition-all')
                .addStyle(imageViewStyle);
            setTimeout(function () {
                originImg.addClass('ptswpv-viewing-img').addStyle(imageViewStyle);
                this.$viewingImg.selfReplace(originImg);
                this.$viewingImg = originImg;
            }.bind(this), 305);
        }.bind(this))

    }.bind(this), 1)


}

PhotoSwipeViewer.prototype.remove = function () {
    this.$view.selfRemove();
};

PhotoSwipeViewer.newInstance = function () {
    var instance = new PhotoSwipeViewer();
    instance.getView().addTo(document.body);
    return instance;
}

PhotoSwipeViewer.$style = _('style').addTo(document.head);
PhotoSwipeViewer.$style.innerHTML = photoswipeviewer_css;


export default PhotoSwipeViewer;