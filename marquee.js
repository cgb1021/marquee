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
        animationFrame = window.requestAnimationFrame;
    } else {
        var prefix = ['webkit','moz','ms','o'];
        for(var i = 0; i < prefix.length;i++) {
            if(window[prefix[i]+'RequestAnimationFrame']) {
                animationFrame = window[prefix[i]+'RequestAnimationFrame'];
                break;
            }
        }
        if(!animationFrame) {
            animationFrame = function(callback) {window.setTimeout(callback,1000/60)}
        }
    }
    //移动对象
    function Moves(option) {
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
    Moves.prototype.reset = function() {
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
    Moves.prototype.destroy = function(){
        this.element.parentNode.removeChild(this.element);
        this.element = null;
        this.nextSibling = null;
    }
    //移动容器对象
    function Marquee(element, option) {
        var nodes, i,length;
        this.list = []; //移动对象列表
        this.container = element; //移动容器
        this.width = element.clientWidth; //容器宽度
        this.height = element.clientHeight; //容器高度
        this.prevMoves = null; //上一个移动对象
        this.fistMoves = null; //第一个移动对象
        this.lastTime = 0; //队列上一次执行时间
        this.loopCounter = 0; //执行次数
        //参数配置
        this.useHtml5 = !!(supportHtml5 && option.useHtml5); //使用html5
        this.loop = typeof option.loop != 'undefined' ? Math.abs(parseInt(option.loop,10)) : 1; //循环次数,0:无限循环;>0:按次数循环
        this.duration = typeof option.duration != 'undefined' ? Math.abs(parseInt(option.duration,10)) : element.clientWidth*10; //移动持续时间
        this.direction = parseInt(option.direction,10) || 0; //0:从右往左；1:从下往上；2:从左往右；3:从上往下
        this.startEvent = option.startEvent || null; //移动元素开始事件
        this.endEvent = option.endEvent || null; //移动结束事件
        this.reachEvent = option.reachEvent || null; //移动元素到达边缘事件,return true的时候到达边缘后暂停
        this.hoverEvent = option.hoverEvent || null; //移动元素鼠标悬停事件

        this.container.style.overflow = 'hidden';
        nodes = this.container.childNodes;
        for(i = 0,length = nodes.length; length && i<length; i++)
            this.push(nodes[i]);
    }
    //添加移动对象
    Marquee.prototype.push = function(element) {
        if(typeof element != 'object' || element.nodeType != 1)
            return null;

        var moves,time,option={direction : this.direction,useHtml5:this.useHtml5};

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
            if(!this.useHtml5)
                moves.startTime = time;
            if(this.startEvent)
                this.startEvent(moves, time);
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

        if(length) {
            //启动下一个对象
            moves = this.list[length-1];

            if(moves.nextSibling && !moves.nextSibling.startTime) {
                switch(this.direction) {
                    case 1: {
                        if(this.useHtml5) {
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
                        if(this.useHtml5) {
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
                        if(this.useHtml5) {
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
                        if(this.useHtml5) {
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
                    if(!this.useHtml5)
                        moves.startTime = time;
                    //执行开始事件
                    if(this.startEvent)
                        this.startEvent(moves, time);
                    length +=1;
                }
            }

            for(i=0; i < length; i++){
                moves = this.list[i];
                if(moves.usedTime > moves.duration) {
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

                    this.list[i] = null;
                } else if(moves.reachTime && !this.useHtml5 && this.reachEvent && this.reachEvent(moves, time)) {
                    //到达边缘暂停
                } else {
                    //正常流程
                    switch(this.direction) {
                        case 1: {
                            if(this.useHtml5) {
                                if(!moves.startTime) {
                                    moves.element.style.transition = 'transform '+moves.duration/1000+'s linear';
                                    moves.element.style.transform = 'translateY(-' + moves.distance + 'px)';
                                    moves.startTime = time;
                                }
                                if(i < 2 && !moves.reachTime && moves.usedTime >= this.duration){
                                    moves.reachTime = time;
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
                                }
                            }
                        }
                            break;
                        case 3: {
                            if(this.useHtml5) {
                                if(!moves.startTime) {
                                    moves.element.style.transition = 'transform '+moves.duration/1000+'s linear';
                                    moves.element.style.transform = 'translateY(' + moves.distance + 'px)';
                                    moves.startTime = time;
                                }
                                if(i < 2 && !moves.reachTime && moves.usedTime >= this.duration){
                                    moves.reachTime = time;
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
                                }
                            }
                        }
                            break;
                        case 2: {
                            if(this.useHtml5) {
                                if(!moves.startTime) {
                                    moves.element.style.transition = 'transform '+moves.duration/1000+'s linear';
                                    moves.element.style.transform = 'translateX(' + moves.distance + 'px)';
                                    moves.startTime = time;
                                }
                                if(i < 2 && !moves.reachTime && moves.usedTime >= this.duration){
                                    moves.reachTime = time;
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
                                }
                            }
                        }
                            break;
                        default: {
                            if(this.useHtml5) {
                                if(!moves.startTime) {
                                    moves.element.style.transition = 'transform '+moves.duration/1000+'s linear';
                                    moves.element.style.transform = 'translateX(-' + moves.distance + 'px)';
                                    moves.startTime = time;
                                }
                                if(i < 2 && !moves.reachTime && moves.usedTime >= this.duration){
                                    moves.reachTime = time;
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
                animationFrame(function(){_this.animate();});
            } else if(this.loop === 0 || this.loopCounter++<this.loop) {
                //重新启动
                moves = this.fistMoves;
                this.list.push(moves);
                if(!this.useHtml5)
                    moves.startTime = time;
                if(this.startEvent)
                    this.startEvent(moves, time);
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