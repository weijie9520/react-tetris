import React, { Component } from 'react';
import './index.css';
import {nextMap} from "../select/index"
import Tetris from "../page/display/index"
import Control from "../page/control/index"
import {connect} from 'react-redux';
import dispatchAction from "util/dispatchAction"
class App extends Component {
    state = {
        isMask:true
    }
    redArr = [2,2,2,2,2,2,2,2,2,2]
    completeArr = [1,1,1,1,1,1,1,1,1,1]
    plainArr = [0,0,0,0,0,0,0,0,0,0]
    // 碰撞函数
    collideHandle = (map)=>{
        let {currentMap,controlNextAction,setAction} = this.props;
        this.speed = 100;
        currentMap.autoDown = false ;
        if(this.isDied()){
            this.stop()
            this.diedAnimate()
            return 
        }
        let arr = this.isComplete(map);
        if(arr){
            this.stop()
            this.completeAnimate(map,arr)
            .then(()=>{
                this.complete(map,arr)
            })
        }else {
            setAction(map)
            controlNextAction()
        }
    }
    // 检测是否有已完成的
    isComplete = (map)=>{
        let arr = []
        for(let i = 0;i<map.length;i++){
            if(!map[i].includes(0)) {
                arr.push(i)
            }
        }
        if(arr.length) return arr
    }
    // 是否死亡
    isDied = ()=>{
        let {currentMap} = this.props;
        let {index,seat,site} = currentMap;
        let {info} = site[index];
        let bottom = seat[1];
        let {t=0,b=0,len} = info
        return (len - t - b >= bottom)
    }
    // 死亡动画
    diedAnimate = ()=>{
        let {map,setAction} = this.props;
        let i = 19;
        let timerId,newmap = map;
        return new Promise((resolve)=>{
            timerId = setInterval(()=>{
                newmap = [...newmap];
                newmap[i] = this.completeArr
                setAction(newmap)
                i--;
                if(i<0){
                    clearInterval(timerId)
                    i = 0;
                    timerId = setInterval(()=>{
                        newmap = [...newmap];
                        newmap[i] = this.plainArr
                        setAction(newmap)
                        i++;
                        if(i>19){
                            clearInterval(timerId)
                            resolve()
                        }
                    },50)
                }
            },50)
        })
    }
    // 已完成动画
    completeAnimate = (map,arr)=>{
        return new Promise((resolve)=>{
                this.changeRed(map,arr)
                setTimeout(()=>{
                    resolve()
                },900)
        })
    }
    // 完成事件
    complete = (map,arr)=>{
        let {setAction,controlNextAction} = this.props;
        arr = arr.sort((a,b)=>{
            return b - a
        })
        arr.forEach(v=>{
            map.splice(v,1)
        })
        arr.forEach(v=>{
            map.unshift(this.plainArr)
        })
        // this.start()
        setAction(map)
        controlNextAction()
    }
    changeRed = (map,arr)=>{
        let {setAction} = this.props;
        arr.forEach(v=>{
            map[v] = this.redArr
        })
        setAction(map)
    }
    // 是否已经启动 && 用于控制 requestAnimationFrame
    isStart = false 
    // 开始
    start = (...args)=>{
        if(this.isStart) return
        this.isStart = true
        let {autoDown} = this
        let callback = ()=>{
            if(this.isStart){
                autoDown(...args)
                requestAnimationFrame(callback)
            }else {
                callback = null;
            }
        }
        requestAnimationFrame(callback)
    }
    decoratorHandle = (fn)=>{
        return (...arg)=>{
            if(!this.isStart){
                if(this.state.isMask){
                    this.setState({isMask:false},()=>{
                        this.start()
                    })
                }else {
                    this.start()
                }
            }else {
                fn(...arg)
            }
        }
    }
    // 暂停
    stop = ()=>{
        this.isStart = false ;
        // this.requestAnimationFrameFlag = false ;
    }
    // 变换
    transform = ()=>{
        var { isTransform} = this.props.nextMap
        if(!isTransform) return
        let {currentMap,controlChangeAction} = this.props;
        let {index,site,seat} = currentMap;
        let [left,bottom] = seat;
        let info = site[index].info;
        if(left < 0 || left + info.len > 10) return
        if(bottom > 19 ) return
        if(index + 1 >= site.length){
            index = 0 
        }else {
            index += 1
        }
        controlChangeAction({
            index
        })
    }
    // 平移 flag  1 左； -1 右
    translation = (flag)=>{
        let {currentMap,controlChangeAction} = this.props;
        let {index,site,seat} = currentMap;
        let {info} = site[index];
        let [left] = seat;
        let newLeft;
        if(flag === 1){
            if(left > 0 || -info.l < left ){
                newLeft = left-1
            }
        }else {
            if(left < 10-info.len || 10>left + info.len - info.r){
                newLeft = left+1
            }
        }
        if(newLeft !== undefined){
            controlChangeAction({
                seat:[newLeft,seat[1]]
            })
        }
    }
    // 控制下落速度
    speed = 100
    time = 0
    autoDown = ()=>{
        this.time ++ ;
        if(this.time < this.speed) return ;
        this.down()
    }
    down = ()=>{
        this.time = 0 ;
        let {currentMap,controlChangeAction,nextMap} = this.props;
        let {index,site,seat,autoDown} = currentMap;
        if(!autoDown) return;
        let {info} = site[index];
        let top = seat[1];
        let bottom = info.b || 0;
        if(top - Number(bottom) < 19){
            controlChangeAction({
                seat:[seat[0],top+1]
            })
        }else {
            this.collideHandle(nextMap.map)
        }
    }
    componentDidMount(){
        window.addEventListener("keydown",this.decoratorHandle(this.keydownHandle))
        window.addEventListener("keyup",this.keyupHandle)
        var {controlStartAction} =this.props
        controlStartAction()
    }
    componentDidUpdate(){
        var {collide,map} = this.props.nextMap;
        if(collide){
            this.collideHandle(map)
        }
    }
    // 控制键盘事件
    keyFlag = true ;
    keydownHandle = (e)=>{
        if(!this.keyFlag) return ;
        this.keyFlag = false
        switch(e.keyCode){
            case 32:
                this.speed = 2;
                return ;
            case 37:
                return this.translation(1)
            case 39:
                return this.translation(-1)
            case 38:
                return this.transform()
            case 40:
                this.speed = 2;
                return ;
            default:
                return
            
        }
    }
    keyupHandle = (e)=>{
        this.keyFlag = true
        switch(e.keyCode){
            case 32 :
                this.speed = 100;
                return ;
            case 40 :
                this.speed = 100;
                return ;
            default:
                return
            
        }

    }
    render() {
        let {stop,translation,down,transform,decoratorHandle} = this;
        let {map,currentMap,nextMap} = this.props;
        let {isMask} = this.state
        // let newMap = this.blendHandle(map,currentMap);
        // transform: scale(0.988542);
        return (
        <div data-reactroot="" className="wrap" style={{transform: "scale(1)", paddingTop: "101px", paddingBottom: "59px", marginTop: "-569px"}}>
            <Tetris isMask={isMask} currentMap={currentMap} map={nextMap.map}/>
            <Control 
            down={decoratorHandle(down)}
            stop={stop}
            transform={decoratorHandle(transform)}
            translation={decoratorHandle(translation)}/>
        </div>
        );
    }
}

const mapStateToProps = (store,ownProps)=>{
	return {
        nextMap:nextMap(store),
        map:store.map,
        currentMap:store.currentMap,
        ...ownProps
	}
}

export default connect(mapStateToProps,dispatchAction)(App)
