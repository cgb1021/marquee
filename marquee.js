/*
 * 文本滚动组件/marquee
 * http://xhyo.com/
 * version: 1.1
 * Copyright (c) 2015 Bill Chen(chenguibiao@yy.com/48838096@qq.com)
 * Released under the MIT license - http://opensource.org/licenses/MIT
 */
(function(window){
    var animationFrame = null;
    var supportHtml5 = false;
    var marqueeList = {};
    //定义动画执行函数
    if(window.requestAnimationFrame){
        supportHtml5 = true; //只支持标准模式
        animationFrame = function(callback) {window.requestAnimationFrame(callback);}
    } else {
        var prefix = ['webkit','moz','ms','o'];
        for(var i = 0; i < prefix.length;i++)
            if(window[prefix[i]+'RequestAnimationFrame']) {
                animationFrame = function(callback) {window[prefix[i]+'RequestAnimationFrame'](callback);}
                break;
            }
        if(!this.animationFrame) {
            animationFrame = function(callback) {window.setTimeout(callback,1000/60)}
        }
    }
    //移动对象
    function Scroller(option) {
        if(!option)
            return;

        this.nextSibling = null; //下一个移动对象
        this.element = option.element; //当前dom元素
        this.width = option.width;
        this.height = option.height;
        this.left = option.left; //初始水平位置
        this.top = option.top; //初始垂直位置
        this.distance = option.distance; //移动距离
        this.duration = option.duration; //移动时间
        this.direction = option.direction; //移动方向
        this.useHtml5 = option.useHtml5; //使用html5

        this.element.style.width = option.width +'px';
        this.element.style.height = option.height +'px';
        this.reset();
    }
    //重置元素
    Scroller.prototype.reset = function() {
        //恢复初始位置
        this.element.style.left = this.left +'px';
        this.element.style.top = this.top +'px';
        if(this.useHtml5) {
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

        //重置时间
        this.startTime = 0; //开始时间
        this.reachTime = 0; //到达边缘时间
        this.usedTime = 0; //移动时间
    }
    //销毁元素
    Scroller.prototype.destroy = function(){
        this.element.parentNode.removeChild(this.element);
        this.element = null;
        this.nextSibling = null;
    }
    //移动容器对象
    function Marquee(element, option) {
        var nodes, i,length;
        this.list = []; //移动对象列表
        this.container = element; //移动容器
        this.width = element.clientWidth;
        this.height = element.clientHeight;
        this.loop = 1; //循环次数,0:无限循环;>0:按次数循环
        this.duration = element.clientWidth*10; //移动持续时间
        this.direction = 0; //0:从右往左；1:从下往上；2:从左往右；3:从上往下
        this.prevScroller = null; //上一个移动对象
        this.fistScroller = null; //第一个对象
        this.startEvent = null; //移动元素开始事件
        this.endEvent = null; //移动结束事件
        this.reachEvent = null; //移动元素到达边缘事件,return true的时候到达边缘后暂停
        this.hoverEvent = null; //移动元素鼠标悬停事件
        this.lastTime = 0; //队列上一次执行时间
        this.useHtml5 = false; //使用html5
        this.loopCounter = 0; //执行次数
        //参数配置
        if(option) {
            this.useHtml5 = !!(supportHtml5 && option.useHtml5);
            this.loop = typeof option.loop != 'undefined'?parseInt(option.loop,10):1;
            this.direction = parseInt(option.direction,10) || this.direction;
            this.duration = parseInt(option.duration,10) || this.duration;
            this.startEvent = option.startEvent || this.startEvent;
            this.endEvent = option.endEvent || this.endEvent;
            this.reachEvent = option.reachEvent || this.reachEvent;
            this.hoverEvent = option.hoverEvent || this.hoverEvent;
        }

        this.container.style.overflow = 'hidden';
        nodes = this.container.childNodes;
        for(i = 0,length = nodes.length; length && i<length; i++)
            this.push(nodes[i]);
    }
    //添加移动对象
    Marquee.prototype.push = function(element) {
        if(typeof element != 'object' || element.nodeType != 1)
            return null;

        var scroller,time,option={direction : this.direction,useHtml5:this.useHtml5};

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
        scroller = new Scroller(option);
        if(!this.prevScroller) {
            this.lastTime = time = new Date().getTime();
            this.fistScroller = this.prevScroller = scroller;
            this.loopCounter = 1;
            //启动第一个移动对象
            this.list.push(scroller);
            if(!this.useHtml5)
                scroller.startTime = time;
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

            if(scroller.nextSibling && !scroller.nextSibling.startTime) {
                switch(this.direction) {
                    case 1: {
                        if(this.useHtml5) {
                            if((time -scroller.startTime) >= scroller.duration*scroller.height/scroller.distance){
                                isNextStart = true;
                            }
                        } else {
                            if((scroller.y+scroller.height) <= this.height)
                                isNextStart = true;
                        }
                    }
                        break;
                    case 3: {
                        if(this.useHtml5) {
                            if((time -scroller.startTime) >= scroller.duration*scroller.height/scroller.distance){
                                isNextStart = true;
                            }
                        } else {
                            if(scroller.y >= 0)
                                isNextStart = true;
                        }
                    }
                        break;
                    case 2: {
                        if(this.useHtml5) {
                            if((time -scroller.startTime) >= scroller.duration*scroller.width/scroller.distance){
                                isNextStart = true;
                            }
                        } else {
                            if(scroller.x >= 0)
                                isNextStart = true;
                        }
                    }
                        break;
                    default: {
                        if(this.useHtml5) {
                            if((time -scroller.startTime) >= scroller.duration*scroller.width/scroller.distance){
                                isNextStart = true;
                            }
                        } else {
                            if((scroller.x+scroller.width) <= this.width)
                                isNextStart = true;
                        }
                    }
                }
                if(isNextStart) {
                    scroller = scroller.nextSibling;
                    this.list.push(scroller);
                    if(!this.useHtml5)
                        scroller.startTime = time;
                    //执行开始事件
                    if(this.startEvent)
                        this.startEvent(scroller, time);
                    length +=1;
                }
            }

            for(i=0; i < length; i++){
                scroller = this.list[i];
                if(scroller.usedTime > scroller.duration) {
                    //到达终点，清理元素
                    if(this.endEvent) {
                        this.endEvent(scroller, time);
                    }
                    if(this.loop === 0 || this.loopCounter<this.loop) {
                        //重置元素
                        scroller.reset();
                    } else {
                        //清理元素
                        scroller.destroy();
                    }

                    this.list[i] = null;
                } else if(scroller.reachTime && !this.useHtml5 && this.reachEvent && this.reachEvent(scroller, time)) {
                    //到达边缘暂停
                } else {
                    //正常流程
                    switch(this.direction) {
                        case 1: {
                            if(this.useHtml5) {
                                if(!scroller.startTime) {
                                    scroller.element.style.transition = 'transform '+this.duration/1000+'s linear';
                                    scroller.element.style.transform = 'translateY(-' + scroller.distance + 'px)';
                                    scroller.startTime = time;
                                }
                                if(i < 2 && !scroller.reachTime && scroller.usedTime >= this.duration){
                                    scroller.reachTime = time;
                                }
                                scroller.usedTime += interval;
                            } else {
                                position = scroller.top-(scroller.distance * (scroller.usedTime+interval)/scroller.duration);
                                if(i > 0  && this.list[i-1] && (this.list[i-1].y+this.list[i-1].height)>position) {
                                    //和前一个元素重叠，暂停
                                } else {
                                    if(i < 2 && !scroller.reachTime && position<=0) {
                                        //到达边缘
                                        scroller.reachTime = time;
                                        position = 0;
                                    }
                                    scroller.y = position;
                                    scroller.element.style.top = position+'px';
                                    scroller.usedTime += interval;
                                }
                            }
                        }
                            break;
                        case 3: {
                            if(this.useHtml5) {
                                if(!scroller.startTime) {
                                    scroller.element.style.transition = 'transform '+this.duration/1000+'s linear';
                                    scroller.element.style.transform = 'translateY(' + scroller.distance + 'px)';
                                    scroller.startTime = time;
                                }
                                if(i < 2 && !scroller.reachTime && scroller.usedTime >= this.duration){
                                    scroller.reachTime = time;
                                }
                                scroller.usedTime += interval;
                            } else {
                                position = scroller.top+(scroller.distance * (scroller.usedTime+interval)/scroller.duration);
                                if(i > 0  && this.list[i-1] && (position+scroller.height)>this.list[i-1].y) {
                                    //和前一个元素重叠，暂停
                                } else {
                                    if(i < 2 && !scroller.reachTime && position>=(this.height-scroller.height)) {
                                        //到达边缘
                                        scroller.reachTime = time;
                                        position = this.height-scroller.height;
                                    }
                                    scroller.y = position;
                                    scroller.element.style.top = position+'px';
                                    scroller.usedTime += interval;
                                }
                            }

                        }
                            break;
                        case 2: {
                            if(this.useHtml5) {
                                if(!scroller.startTime) {
                                    scroller.element.style.transition = 'transform '+this.duration/1000+'s linear';
                                    scroller.element.style.transform = 'translateX(' + scroller.distance + 'px)';
                                    scroller.startTime = time;
                                }
                                if(i < 2 && !scroller.reachTime && scroller.usedTime >= this.duration){
                                    scroller.reachTime = time;
                                }
                                scroller.usedTime += interval;
                            } else {
                                position = scroller.left+(scroller.distance * (scroller.usedTime+interval)/scroller.duration);
                                if(i > 0  && this.list[i-1] && (position+scroller.width)>this.list[i-1].x) {
                                    //和前一个元素重叠，暂停
                                } else {
                                    if(i < 2 && !scroller.reachTime && position>=(this.width-scroller.width)) {
                                        //到达边缘
                                        scroller.reachTime = time;
                                        position = this.width-scroller.width;
                                    }
                                    scroller.x = position;
                                    scroller.element.style.left = position+'px';
                                    scroller.usedTime += interval;
                                }
                            }
                        }
                            break;
                        default: {
                            if(this.useHtml5) {
                                if(!scroller.startTime) {
                                    scroller.element.style.transition = 'transform '+this.duration/1000+'s linear';
                                    scroller.element.style.transform = 'translateX(-' + scroller.distance + 'px)';
                                    scroller.startTime = time;
                                }
                                if(i < 2 && !scroller.reachTime && scroller.usedTime >= this.duration){
                                    scroller.reachTime = time;
                                }
                                scroller.usedTime += interval;
                            } else {
                                position = scroller.left-(scroller.distance * (scroller.usedTime+interval)/scroller.duration);
                                if(i > 0  && this.list[i-1] && (this.list[i-1].x+this.list[i-1].width)>position) {
                                    //和前一个元素重叠，暂停
                                } else {
                                    if(i < 2 && !scroller.reachTime && position<=0) {
                                        //到达边缘
                                        scroller.reachTime = time;
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
            }
            scroller = null;
            //清理无效元素
            while(this.list.length && !this.list[0]) {
                this.list.shift();
            }
            if(this.list.length){
                animationFrame(function(){_this.animate();});
            } else if(this.loop === 0 || this.loopCounter++<this.loop) {
                //重新启动
                scroller = this.fistScroller;
                this.list.push(scroller);
                if(!this.useHtml5)
                    scroller.startTime = time;
                if(this.startEvent)
                    this.startEvent(scroller, time);
                animationFrame(function(){_this.animate();});
            } else {
                //todo: 空队列，动画结束，执行回调函数
                this.prevScroller = null;
                this.fistScroller = null;
            }
        } else {
            //空队列，动画结束，执行回调函数
            this.prevScroller = null;
        }
        this.lastTime = time;
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