import AComp from "../AComp/AComp";

import photoswipeviewer_css from './photoswipeviewer.css';
import Dom from "../HTML5/Dom";

var _ = AComp._;
var $ = AComp.$;



function PhotoSwipeViewer() {

}


PhotoSwipeViewer.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.$view = _(
        {
            class: 'ptswpv',
            child: [
                {
                    class: 'ptswpv-frame',
                    child: '.ptswpv-viewing-container'
                }
            ]
        }
    );

    this.$viewingContainder = $('.ptswpv-viewing-container', this.$view);

    return this.$view;
}


PhotoSwipeViewer.prototype.pickImageElement = function (element) {
    if (typeof element == "string") {
        element = $(element);
    }
    if (!element) return false;


    var eBound = element.getBoundingClientRect();
    var initStyle = {
        top: eBound.top + 'px',
        left: eBound.left + 'px',
        width: eBound.right - eBound.left + 'px',
        height: eBound.bottom - eBound.top + 'px'
    };

    this.$view.addClass('full');
    this.$viewingImg = $(element.cloneNode())
        .attr('style', null)
        .attr('class', 'ptswpv-viewing-img')
        .addTo(this.$viewingContainder);
    this.$viewingContainder.addStyle(initStyle);
    Dom.waitImageLoaded(this.$viewingImg).then(function () {
        setTimeout(function(){
            this.$viewingContainder.addClass('grow')
            .removeStyle(initStyle)
            .addClass('full');

        }.bind(this),1)
    }.bind(this));






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