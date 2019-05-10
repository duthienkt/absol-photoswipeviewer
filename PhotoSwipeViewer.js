import AComp from "../AComp/AComp";

import photoswipeviewer_css from './photoswipeviewer.css';

var _ = AComp._;
var $ = AComp.$;



function PhotoSwipeViewer() {

}


PhotoSwipeViewer.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.$view = _(
        '.ptswpv'
    );

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