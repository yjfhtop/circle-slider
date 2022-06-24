// 坐标
import { mergeData } from '@/utils/dataHandle'

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
    bgc: string
    // 选中后的颜色
    activeBgc: string
}

// 数据的配置
export interface DataConf {
    min: number
    max: number
    // 滑块小的那一端的最大值
    dragBtnSmallMax: number
    // 滑块大的那一端的最小值
    dragBtnBigMin: number
}

// 配置项
export interface CircleSliderConf {
    ringConf: RingConf
    axisMark: AxisMark
    dragBtn: DragBtn
    dataConf: DataConf
}

// 用户传入
export type CircleSliderConfUser = Partial<CircleSliderConf>

const defConf = {
    ringConf: {},
}

class CircleSlider {
    private conf: CircleSliderConf
    constructor(conf: CircleSliderConfUser) {
        // this.conf = mergeData()
    }
    // get spanAngle () {
    //     return Math.abs(this.eAngle - this.sAngle)
    // }
}
