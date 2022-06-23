// 坐标
export interface Coordinate {
    x: number
    y: number
}

// 环的配置
export interface RingConf {
    // 开始角度
    sAngle: number
    // 结束角度
    eAngle: number
    // 环的宽度
    ringW: number
    // 圆心
    org: number
    // 半径, 环到圆心的距离
    r: number
    // 环的颜色
    ringColor: string
}

// 轴标的配置项
export interface AxisMark {
    fontSize: number
    fontColor: string
}

// 拖拽的 按钮样式
export interface DragBtn {
    // 半径
    r: number
    // 背景颜色
    bgc: number
}

// 配置项
export interface CircleSliderConf {
    sAngle: number
    eAngle: number
    ringW: number
}

class CircleSlider {
    constructor() {}
    // get spanAngle () {
    //     return Math.abs(this.eAngle - this.sAngle)
    // }
}
