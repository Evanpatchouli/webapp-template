import 'react/jsx-runtime';
import 'react';

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".index_webapp-template-loading__CD-yc,.index_webapp-template-loading__CD-yc>div{box-sizing:border-box;position:relative}.index_webapp-template-loading__CD-yc{color:var(--loading-color2,#66666681);display:block;font-size:0}.index_webapp-template-loading__CD-yc.index_la-dark__cQZDv{color:#333}.index_webapp-template-loading__CD-yc>div{background-color:currentColor;border:0 solid;display:inline-block;float:none}.index_webapp-template-loading__CD-yc{height:32px;width:32px}.index_webapp-template-loading__CD-yc>div:first-child{animation:index_ball-atom-shrink__kiJq7 2.5s cubic-bezier(.445,.05,.55,.95) infinite;background:var(--loading-color,#666);border-radius:100%;height:60%;left:50%;position:absolute;top:50%;transform:translate(-50%,-50%);width:60%;z-index:1}.index_webapp-template-loading__CD-yc>div:not(:first-child){animation:index_ball-atom-zindex__0eD06 1.5s steps(2) 0s infinite;background:none;height:100%;left:0;position:absolute;width:100%;z-index:0}.index_webapp-template-loading__CD-yc>div:not(:first-child):before{animation:index_ball-atom-position__rxCCn 1.5s ease 0s infinite,index_ball-atom-size__WjEQd 1.5s ease 0s infinite;background:currentColor;border-radius:50%;content:\"\";height:10px;left:0;margin-left:-5px;margin-top:-5px;opacity:.75;position:absolute;top:0;width:10px}.index_webapp-template-loading__CD-yc>div:nth-child(2){animation-delay:.75s}.index_webapp-template-loading__CD-yc>div:nth-child(2):before{animation-delay:0s,-1.125s}.index_webapp-template-loading__CD-yc>div:nth-child(3){animation-delay:-.25s;transform:rotate(120deg)}.index_webapp-template-loading__CD-yc>div:nth-child(3):before{animation-delay:-1s,-.75s}.index_webapp-template-loading__CD-yc>div:nth-child(4){animation-delay:.25s;transform:rotate(240deg)}.index_webapp-template-loading__CD-yc>div:nth-child(4):before{animation-delay:-.5s,-.125s}@keyframes index_ball-atom-position__rxCCn{50%{left:100%;top:100%}}@keyframes index_ball-atom-shrink__kiJq7{50%{scale:.8}}";
styleInject(css_248z);
//# sourceMappingURL=components.js.map
