/*
 * 文本滚动组件/marquee
 * http://xhyo.com/
 * version: 1.0
 * Copyright (c) 2015 Bill Chen(chenguibiao@yy.com/48838096@qq.com)
 * Released under the MIT license - http://opensource.org/licenses/MIT
 */
(function(window){
    var document = window.document;
    var animationFrame = null;
    //定义动画执行函数
    if(window.requestAnimationFrame){
        animationFrame = function(callback) {window.requestAnimationFrame(callback);}
    } else {
        var prefix = ['webkit','moz','ms','o'];
        for(var i = 0; i < prefix.length;i++)
            if(window[prefix[i]+'RequestAnimationFrame']) {
                animationFrame = function(callback) {window[prefix[i]+'RequestAnimationFrame'](callback);}
                break;
            }
        if(!this.animationFrame)
            animationFrame = function(callback) {window.setTimeout(callback,1000/60)}
    }
    //移动对象
    function Scroller(config) {
        if(!config)
            return;

        this.nextSibling = null; //下一个移动对象
        this.element = config.element; //当前dom元素
        this.width = config.width;
        this.height = config.height;
        this.left = config.left; //初始水平位置
        this.top = config.top; //初始垂直位置
        this.distance = config.distance;
        this.duration = config.duration;

        this.element.style.width = config.width +'px';
        this.element.style.height = config.height +'px';
        this.reset();
    }
    //重置元素
    Scroller.prototype.reset = function() {
        //恢复初始位置
        this.element.style.left = this.left +'px';
        this.element.style.top = this.top +'px';
        this.x = this.left; //水平坐标
        this.y = this.top; //垂直坐标
        //重置时间
        this.startTime = 0; //开始时间
        this.endTime = 0; //到达边缘时间
        this.usedTime = 0; //移动时间
    }
    //销毁元素
    Scroller.prototype.destroy = function(){
        this.element.parentNode.removeChild(this.element);
        this.element = null;
        this.nextSibling = null;
    }
    //移动容器对象
    function Marquee(element, config) {
        var nodes, i,length;
        this.list = []; //移动对象列表
        this.container = element; //移动容器
        this.width = element.clientWidth;
        this.height = element.clientHeight;
        this.loop = 0; //循环次数
        this.duration = 10; //移动持续时间
        this.direction = 0; //0:从右往左；1:从下往上；2:从左往右；3:从上往下
        this.prevScroller = null; //上一个移动对象
        this.startEvent = null; //移动元素开始事件
        this.endEvent = null; //移动元素到达终点事件,return true的时候到达终点后暂停
        this.hoverEvent = null; //移动元素鼠标悬停事件
        this.isAsync = false; //移动元素异步执行动画
        this.lastTime = 0; //队列上一次执行时间
        //参数配置
        if(config) {
            this.loop = config.loop || this.loop;
            this.direction = config.direction || this.direction;
            this.duration = config.duration || this.duration;
            this.startEvent = config.startEvent || this.startEvent;
            this.endEvent = config.endEvent || this.endEvent;
            this.hoverEvent = config.hoverEvent || this.hoverEvent;
        }

        this.container.style.overflow = 'hidden';
        nodes = this.container.childNodes;
        length = nodes.length;
        for(i = 0; length && i<length; i++)
            this.push(nodes[i]);
    }
    //添加移动对象
    Marquee.prototype.push = function(element) {
        if(typeof element != 'object' || element.nodeType != 1)
            return null;

        var scroller,time,config={};

        //添加元素
        element.style.position = 'absolute';
        if(element.parentNode !== this.container) {
            this.container.appendChild(element);
        }
        config.element = element;
        //记录初始信息
        config.width = element.offsetWidth;
        config.height = element.offsetHeight;
        config.left = element.offsetLeft;
        config.top = element.offsetTop;
        //确定初始位置
        switch(this.direction) {
            case 1: {
                config.top = this.height;
                config.distance = this.height+config.height;
                config.duration = this.duration/this.height*config.distance;
            }
                break;
            case 2: {
                config.left = -config.width;
                config.distance = this.width+config.width;
                config.duration = this.duration/this.width*config.distance;
            }
                break;
            case 3: {
                config.top = -config.height;
                config.distance = this.height+config.height;
                config.duration = this.duration/this.height*config.distance;
            }
                break;
            default: {
                config.left = this.width;
                config.distance = this.width+config.width;
                config.duration = this.duration/this.width*config.distance;
            }
        }
        //生成一个移动对象
        scroller = new Scroller(config);
        if(!this.prevScroller) {
            this.lastTime = time = new Date().getTime();
            this.prevScroller = scroller;
            //启动第一个移动对象
            scroller.startTime = time;
            this.list.push(scroller);
            if(this.startEvent)
                this.startEvent(scroller, time);
            this.animate();
        } else {
            this.prevScroller.nextSibling = scroller;
            this.prevScroller = scroller;
        }
        this.prevScroller = scroller;

        scroller = null;
        element = null;
    }
    //执行动画
    Marquee.prototype.animate = function() {
        var _this = this, //保存执行环境
            time = new Date().getTime(), //当前执行时间,
            scroller = null,
            position = 0, //移动位置
            isNextStart = false,
            interval = time-this.lastTime, //和上一次的执行间隔
            i = 0,
            length = this.list.length;

        if(length) {
            //启动下一个对象
            scroller = this.list[length-1];
            switch(this.direction) {
                case 1: {
                    if((scroller.y+scroller.height) <= this.height)
                        isNextStart = true;
                    }
                    break;
                case 2: {
                    if(scroller.x >= 0)
                        isNextStart = true;
                }
                    break;
                case 3: {
                    if(scroller.y >= 0)
                        isNextStart = true;
                }
                    break;
                default: {
                    if((scroller.x+scroller.width) <= this.width)
                        isNextStart = true;
                }
            }
            if(isNextStart && scroller.nextSibling && !scroller.nextSibling.startTime) {
                scroller.nextSibling.startTime = time;
                this.list.push(scroller.nextSibling);
                   //执行开始事件
                if(this.startEvent)
                    this.startEvent(scroller.nextSibling, time);
                length +=1;
            }
            for(i=0; i < length; i++){
                scroller = this.list[i];
                if(scroller.usedTime > scroller.duration) {
                    //到达终点，清理元素
                    scroller.destroy();
                    this.list[i] = null;
                } else if(scroller.endTime && this.endEvent && this.endEvent(scroller, time)) {
                    //到达边缘暂停
                } else {
                    //正常流程
                    switch(this.direction) {
                        case 1: {
                            position = scroller.top-(scroller.distance * (scroller.usedTime+interval)/scroller.duration);
                            if(i > 0  && this.list[i-1] && (this.list[i-1].y+this.list[i-1].height)>position) {
                                //和前一个元素重叠，暂停
                            } else {
                                if(i < 2 && !scroller.endTime && position<=0) {
                                    //到达边缘
                                    scroller.endTime = time;
                                    position = 0;
                                }
                                scroller.y = position;
                                scroller.element.style.top = position+'px';
                                scroller.usedTime += interval;
                            }
                        }
                            break;
                        case 2: {
                            position = scroller.left+(scroller.distance * (scroller.usedTime+interval)/scroller.duration);
                            if(i > 0  && this.list[i-1] && (position+scroller.width)>this.list[i-1].x) {
                                //和前一个元素重叠，暂停
                            } else {
                                if(i < 2 && !scroller.endTime && position>=(this.width-scroller.width)) {
                                    //到达边缘
                                    scroller.endTime = time;
                                    position = this.width-scroller.width;
                                }
                                scroller.x = position;
                                scroller.element.style.left = position+'px';
                                scroller.usedTime += interval;
                            }
                        }
                            break;
                        case 3: {
                            position = scroller.top+(scroller.distance * (scroller.usedTime+interval)/scroller.duration);
                            if(i > 0  && this.list[i-1] && (position+scroller.height)>this.list[i-1].y) {
                                //和前一个元素重叠，暂停
                            } else {
                                if(i < 2 && !scroller.endTime && position>=(this.height-scroller.height)) {
                                    //到达边缘
                                    scroller.endTime = time;
                                    position = this.height-scroller.height;
                                }
                                scroller.y = position;
                                scroller.element.style.top = position+'px';
                                scroller.usedTime += interval;
                            }
                        }
                            break;
                        default: {
                            position = scroller.left-(scroller.distance * (scroller.usedTime+interval)/scroller.duration);
                            if(i > 0  && this.list[i-1] && (this.list[i-1].x+this.list[i-1].width)>position) {
                                //和前一个元素重叠，暂停
                            } else {
                                if(i < 2 && !scroller.endTime && position<=0) {
                                    //到达边缘
                                    scroller.endTime = time;
                                    position = 0;
                                }
                                scroller.x = position;
                                scroller.element.style.left = position+'px';
                                scroller.usedTime += interval;
                            }
                        }
                    }
                }
            }
            scroller = null;
            //清理无效元素
            while(this.list.length && !this.list[0]) {
                this.list.shift();
            }
            if(this.list.length){
                animationFrame(function(){_this.animate();});
            } else {
                //todo: 空队列，动画结束，执行回调函数
                this.prevScroller = null;
            }
        } else {
            //空队列，动画结束，执行回调函数
            this.prevScroller = null;
        }
        this.lastTime = time;
    }
    window.marquee = function(element,config) { return new Marquee(element,config);}
})(window)