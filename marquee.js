/*
 * 文本滚动组件/marquee
 * http://xhyo.com/
 * version: 1.1
 * Copyright (c) 2015 Bill Chen(chenguibiao@yy.com/48838096@qq.com)
 * Released under the MIT license - http://opensource.org/licenses/MIT
 */
(function(window){
    var animationFrame = null; //window.requestAnimationFrame
    var supportHtml5 = false; //是否支持标准html5
    var transitionEnd = ''; //transitionEnd字符串
    var transitionEndEvent = null; //transitionEnd事件
    var marqueeList = {}; //缓存marquee对象
    //定义动画执行函数
    if(window.requestAnimationFrame){
        supportHtml5 = true;
        animationFrame = window.requestAnimationFrame;
        transitionEnd = 'transitionend';
    } else {
        var prefixs = ['webkit','moz','ms','o'];
        for(var i = 0; i < prefixs.length;i++) {
            if(window[prefixs[i]+'RequestAnimationFrame']) {
                animationFrame = window[prefixs[i]+'RequestAnimationFrame'];
                transitionEnd = prefixs[i]+'TransitionEnd';
                supportHtml5 = true;
                break;
            }
        }
        if(!animationFrame) {
            animationFrame = function(callback) {window.setTimeout(callback,1000/60)}
        }
    }
    if(transitionEnd) {
        transitionEndEvent = function(e) {
            this.status = 2;
        }
    }
    //addEventListener
    var addEvent = (function(){
        return window.addEventListener?
            function(dom, type, fn){dom.addEventListener(type, fn);}:
            (window.attachEvent?
                function(dom, type, fn){dom.attachEvent('on'+type, fn)}:
                function(dom, type, fn){dom['on'+type]= fn});
    })();
    //removeEventListener
    var removeEvent = (function(){
        return window.removeEventListener?
            function(dom, type, fn){dom.removeEventListener(type, fn);}:
            (window.detachEvent?
                function(dom, type, fn){dom.detachEvent('on'+type, fn)}:
                function(dom, type){dom['on'+type]= null});
    })();
    //绑定环境
    var bind = function(context, fn) {
        return function(){fn.apply(context, arguments)};
    }
    //移动对象
    function Moves(option) {
        if(!option)
            return;

        this.isInit = false; //用于判断第一次绑定transitionEnd事件
        this.status = 0; //0,未开始;1,开始;2,到达尽头
        this.nextSibling = null; //下一个移动对象
        this.element = option.element; //当前dom元素
        this.width = option.width;
        this.height = option.height;
        this.left = option.left; //初始水平位置
        this.top = option.top; //初始垂直位置
        this.distance = option.distance; //移动距离
        this.duration = option.duration; //移动时间
        this.direction = option.direction; //移动方向
        this.transformEnable = option.transformEnable; //使用html5

        this.element.style.width = option.width +'px';
        this.element.style.height = option.height +'px';
        this.reset();
    }
    //重置元素
    Moves.prototype.reset = function() {
        if(this.transformEnable && !this.isInit) {
            addEvent(this.element, transitionEnd, bind(this, transitionEndEvent));
            this.isInit = true;
        }
        //恢复初始位置
        this.element.style.left = this.left +'px';
        this.element.style.top = this.top +'px';
        if(this.transformEnable) {
            this.element.style.transition = '';
            switch(this.direction) {
                case 1: {}
                case 3: {
                    this.element.style.transform = 'translateY(0)';
                }
                    break;
                case 2: {}
                default:{
                    this.element.style.transform = 'translateX(0)';
                }
            }
        } else {
            this.x = this.left; //水平坐标
            this.y = this.top; //垂直坐标
        }
        this.status = 0;
        //重置时间
        this.usedTime = 0; //移动时长
    }
    //销毁元素
    Moves.prototype.destroy = function(){
        if(this.transformEnable) {
           removeEvent(this.element, transitionEnd, bind(this, transitionEndEvent));
        }
        this.element.parentNode.removeChild(this.element);
        this.element = null;
        this.nextSibling = null;
    }

    /*
     * 移动容器对象
     *
     * @param object/string element 容器元素或者容器元素id
     * @param object option 参数 {transformEnable: false, //transform模式还是位移(left/top)模式
     *                            loop:1, //循环次数,0:无限循环;>0:按次数循环
     *                            duration:5000, //移动持续时间
     *                            direction: 0, //0:从右往左；1:从下往上；2:从左往右；3:从上往下
     *                            startEvent: function(){}, //移动开始事件
     *                            endEvent: function(){}, //移动结束事件
     *                            reachEvent: function(){}, //移动元素到达边缘事件，return true的时候到达边缘后暂停。只支持位移(left/top)模式。根本停不下来
     *                            hoverEvent: function(){} //移动元素鼠标悬停事件。只支持位移(left/top)模式。根本停不下来
     *                            }
     */
    function Marquee(element, option) {
        this.list = []; //移动对象列表
        this.container = element; //移动容器
        this.width = element.clientWidth; //容器宽度
        this.height = element.clientHeight; //容器高度
        this.prevMoves = null; //上一个移动对象
        this.fistMoves = null; //第一个移动对象
        this.lastTime = 0; //队列上一次执行时间
        this.loopCounter = 0; //执行次数

        this.container.style.overflow = 'hidden';
        //初始化
        this.init(option);
    }
    //设置option
    Marquee.prototype.init = function(option) {
        var nodes, i,length;

        if(option) {
            this.transformEnable = !!(option.transformEnable && supportHtml5); //transform模式还是位移(left/top)模式
            this.loop = typeof option.loop != 'undefined' ? Math.abs(parseInt(option.loop,10)) : 1; //循环次数,0:无限循环;>0:按次数循环
            this.duration = typeof option.duration != 'undefined' ? Math.abs(parseInt(option.duration,10)) : element.clientWidth*10; //移动持续时间
            this.direction = parseInt(option.direction,10) || 0; //0:从右往左；1:从下往上；2:从左往右；3:从上往下
            this.startEvent = option.startEvent || null; //移动开始事件
            this.endEvent = option.endEvent || null; //移动结束事件
            this.reachEvent = option.reachEvent || null; //移动元素到达边缘事件，return true的时候到达边缘后暂停。只支持位移(left/top)模式
            this.hoverEvent = option.hoverEvent || null; //移动元素鼠标悬停事件。只支持位移(left/top)模式
        } else {
            this.transformEnable = false;
            this.loop = 1;
            this.duration = this.container.clientWidth*10;
            this.direction = 0;
            this.startEvent = null;
            this.endEvent = null;
            this.reachEvent = null;
            this.hoverEvent = null;
        }

        nodes = this.container.childNodes;
        for(i = 0,length = nodes.length; length && i<length; i++)
            this.push(nodes[i]);
    }
    //添加移动对象
    Marquee.prototype.push = function(element) {
        if(typeof element != 'object' || element.nodeType != 1)
            return null;

        var moves,time,option={direction : this.direction,transformEnable:this.transformEnable};

        //添加元素
        element.style.position = 'absolute';
        if(element.parentNode !== this.container) {
            this.container.appendChild(element);
        }
        option.element = element;
        //记录初始信息
        option.width = element.offsetWidth;
        option.height = element.offsetHeight;
        option.left = element.offsetLeft;
        option.top = element.offsetTop;
        //确定初始位置
        switch(this.direction) {
            case 1: {
                option.top = this.height;
                option.distance = this.height+option.height;
                option.duration = this.duration/this.height*option.distance;
            }
                break;
            case 2: {
                option.left = -option.width;
                option.distance = this.width+option.width;
                option.duration = this.duration/this.width*option.distance;
            }
                break;
            case 3: {
                option.top = -option.height;
                option.distance = this.height+option.height;
                option.duration = this.duration/this.height*option.distance;
            }
                break;
            default: {
                option.left = this.width;
                option.distance = this.width+option.width;
                option.duration = this.duration/this.width*option.distance;
            }
        }
        //生成一个移动对象
        moves = new Moves(option);
        if(!this.prevMoves) {
            this.lastTime = time = new Date().getTime();
            this.fistMoves = this.prevMoves = moves;
            this.loopCounter = 1;
            //启动第一个移动对象
            this.list.push(moves);
            this.animate();
        } else {
            this.prevMoves.nextSibling = moves;
            this.prevMoves = moves;
        }
        this.prevMoves = moves;

        moves = null;
        element = null;
    }
    //执行动画
    Marquee.prototype.animate = function() {
        var _this = this, //保存执行环境
            time = new Date().getTime(), //当前执行时间,
            moves = null,
            position = 0, //移动位置
            isNextStart = false,
            interval = time-this.lastTime, //和上一次的执行间隔
            i = 0,
            length = this.list.length;

        this.lastTime = time;
        if(length) {
            //启动下一个对象
            moves = this.list[length-1];

            if(moves.status === 0) {
                //启动第一个moves
                if(!this.transformEnable)
                    moves.status = 1;
                //执行开始事件
                if(this.startEvent)
                    this.startEvent(moves, time);
            } else if(moves.nextSibling && moves.nextSibling.status === 0) {
                switch(this.direction) {
                    case 1: {
                        if(this.transformEnable) {
                            if(moves.usedTime >= moves.duration*moves.height/moves.distance){
                                isNextStart = true;
                            }
                        } else {
                            if((moves.y+moves.height) <= this.height)
                                isNextStart = true;
                        }
                    }
                        break;
                    case 3: {
                        if(this.transformEnable) {
                            if(moves.usedTime >= moves.duration*moves.height/moves.distance){
                                isNextStart = true;
                            }
                        } else {
                            if(moves.y >= 0)
                                isNextStart = true;
                        }
                    }
                        break;
                    case 2: {
                        if(this.transformEnable) {
                            if(moves.usedTime >= moves.duration*moves.width/moves.distance){
                                isNextStart = true;
                            }
                        } else {
                            if(moves.x >= 0)
                                isNextStart = true;
                        }
                    }
                        break;
                    default: {
                        if(this.transformEnable) {
                            if(moves.usedTime >= moves.duration*moves.width/moves.distance){
                                isNextStart = true;
                            }
                        } else {
                            if((moves.x+moves.width) <= this.width)
                                isNextStart = true;
                        }
                    }
                }
                if(isNextStart) {
                    moves = moves.nextSibling;
                    this.list.push(moves);
                    if(!this.transformEnable)
                        moves.status = 1;
                    //执行开始事件
                    if(this.startEvent)
                        this.startEvent(moves, time);
                    length +=1;
                }
            }

            for(i=0; i < length; i++){
                moves = this.list[i];
                if(moves.status === 2) {
                    //到达终点，清理元素
                    if(this.endEvent) {
                        this.endEvent(moves, time);
                    }
                    if(this.loop === 0 || this.loopCounter<this.loop) {
                        //重置元素
                        moves.reset();
                    } else {
                        //清理元素
                        moves.destroy();
                    }
                    //从list里移除
                    this.list[i] = null;
                } else if(moves.reachTime && !this.transformEnable && this.reachEvent && this.reachEvent(moves, time)) {
                    //到达边缘暂停，仅限位移模式
                } else {
                    //正常流程
                    switch(this.direction) {
                        case 1: {
                            if(this.transformEnable) {
                                if(moves.status === 0) {
                                    moves.status = 1;
                                    moves.element.style.transition = 'transform '+moves.duration/1000+'s linear';
                                    moves.element.style.transform = 'translateY(-' + moves.distance + 'px)';
                                } else if(i < 2 && !moves.reachTime && moves.usedTime >= this.duration){
                                    //到达边缘
                                    moves.reachTime = time;
                                    if(this.reachEvent)
                                        this.reachEvent(moves, time)
                                }
                                moves.usedTime += interval;
                            } else {
                                position = moves.top-(moves.distance * (moves.usedTime+interval)/moves.duration);
                                if(i > 0  && this.list[i-1] && (this.list[i-1].y+this.list[i-1].height)>position) {
                                    //和前一个元素重叠，暂停
                                } else {
                                    if(i < 2 && !moves.reachTime && position<=0) {
                                        //到达边缘
                                        moves.reachTime = time;
                                        position = 0;
                                    }
                                    moves.y = position;
                                    moves.element.style.top = position+'px';
                                    moves.usedTime += interval;
                                    if(position<=-moves.height)
                                        moves.status = 2;
                                }
                            }
                        }
                            break;
                        case 3: {
                            if(this.transformEnable) {
                                if(moves.status === 0) {
                                    moves.status = 1;
                                    moves.element.style.transition = 'transform '+moves.duration/1000+'s linear';
                                    moves.element.style.transform = 'translateY(' + moves.distance + 'px)';
                                } else if(i < 2 && !moves.reachTime && moves.usedTime >= this.duration){
                                    //到达边缘
                                    moves.reachTime = time;
                                    if(this.reachEvent)
                                        this.reachEvent(moves, time)
                                }
                                moves.usedTime += interval;
                            } else {
                                position = moves.top+(moves.distance * (moves.usedTime+interval)/moves.duration);
                                if(i > 0  && this.list[i-1] && (position+moves.height)>this.list[i-1].y) {
                                    //和前一个元素重叠，暂停
                                } else {
                                    if(i < 2 && !moves.reachTime && position>=(this.height-moves.height)) {
                                        //到达边缘
                                        moves.reachTime = time;
                                        position = this.height-moves.height;
                                    }
                                    moves.y = position;
                                    moves.element.style.top = position+'px';
                                    moves.usedTime += interval;
                                    if(position>=this.height)
                                        moves.status = 2;
                                }
                            }
                        }
                            break;
                        case 2: {
                            if(this.transformEnable) {
                                if(moves.status === 0) {
                                    moves.status = 1;
                                    moves.element.style.transition = 'transform '+moves.duration/1000+'s linear';
                                    moves.element.style.transform = 'translateX(' + moves.distance + 'px)';
                                } else if(i < 2 && !moves.reachTime && moves.usedTime >= this.duration){
                                    //到达边缘
                                    moves.reachTime = time;
                                    if(this.reachEvent)
                                        this.reachEvent(moves, time)
                                }
                                moves.usedTime += interval;
                            } else {
                                position = moves.left+(moves.distance * (moves.usedTime+interval)/moves.duration);
                                if(i > 0  && this.list[i-1] && (position+moves.width)>this.list[i-1].x) {
                                    //和前一个元素重叠，暂停
                                } else {
                                    if(i < 2 && !moves.reachTime && position>=(this.width-moves.width)) {
                                        //到达边缘
                                        moves.reachTime = time;
                                        position = this.width-moves.width;
                                    }
                                    moves.x = position;
                                    moves.element.style.left = position+'px';
                                    moves.usedTime += interval;
                                    if(position>=this.width)
                                        moves.status = 2;
                                }
                            }
                        }
                            break;
                        default: {
                            if(this.transformEnable) {
                                if(moves.status === 0) {
                                    moves.status = 1;
                                    moves.element.style.transition = 'transform '+moves.duration/1000+'s linear';
                                    moves.element.style.transform = 'translateX(-' + moves.distance + 'px)';
                                } else if(i < 2 && !moves.reachTime && moves.usedTime >= this.duration){
                                    //到达边缘
                                    moves.reachTime = time;
                                    if(this.reachEvent)
                                        this.reachEvent(moves, time)
                                }
                                moves.usedTime += interval;
                            } else {
                                position = moves.left-(moves.distance * (moves.usedTime+interval)/moves.duration);
                                if(i > 0  && this.list[i-1] && (this.list[i-1].x+this.list[i-1].width)>position) {
                                    //和前一个元素重叠，暂停
                                } else {
                                    if(i < 2 && !moves.reachTime && position<=0) {
                                        //到达边缘
                                        moves.reachTime = time;
                                        position = 0;
                                    }
                                    moves.x = position;
                                    moves.element.style.left = position+'px';
                                    moves.usedTime += interval;
                                    if(position<=-moves.width)
                                        moves.status = 2;
                                }
                            }
                        }
                    }
                }
            }
            //清理无效元素
            while(this.list.length && !this.list[0]) {
                this.list.shift();
            }
            if(this.list.length){
                //继续下个动画
                animationFrame(function(){_this.animate();});
            } else if(this.loop === 0 || this.loopCounter++<this.loop) {
                //重新启动
                moves = this.fistMoves;
                this.list.push(moves);
                animationFrame(function(){_this.animate();});
            } else {
                //todo: 空队列，动画结束，执行回调函数
                this.prevMoves = null;
                this.fistMoves = null;
            }
            moves = null;
        } else {
            //空队列，动画结束，执行回调函数
            this.prevMoves = null;
            this.fistMoves = null;
        }
    }
    window.marquee = function(element,option) {
        if(typeof element == 'string') {
            if(marqueeList[element])
                return marqueeList[element];

            element = window.document.getElementById(element);
            if(element) {
                marqueeList[element.id] = new Marquee(element,option);
                return marqueeList[element.id];
            }
        } else
            return new Marquee(element,option);}
})(window)