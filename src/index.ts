// 坐标
import { angle2Radian, mergeData, value2Angle } from '@/utils/dataHandle'
import {
    createContainerEl,
    createHDCanvas,
    getContainerEl,
    getEleHW,
} from '@/utils/element'
import {
    DefSectorConfig,
    drawArc,
    drawCircular,
    drawRect,
    drawSector,
    RectConfig,
} from '@/utils/canvasDraw'

export interface Coordinate {
    x: number
    y: number
}

export interface WH {
    w: number
    h: number
}

// 环的配置
export interface RingConf {
    // 开始角度
    sAngle?: number
    // 结束角度
    eAngle?: number
    // 环的宽度
    ringW?: number
    // 圆心, 默认中心点(需要计算)
    org?: Coordinate
    // 半径, 环到圆心的距离 (需要计算)
    r?: number
    // 环的颜色
    bgc?: string
    activeBgc?: string
}
// Partial

// 轴标的配置项
export interface AxisMark {
    fontSize?: number
    fontColor?: string
    // 步长
    step?: number
}

// 拖拽的 按钮样式
export interface DragBtn {
    // 半径
    r?: number
    // 背景颜色
    bgc?: string
    // 选中后的颜色
    activeBgc?: string
}

// 数据的配置
export interface DataConf {
    min?: number
    max?: number
    // 滑块小的那一端的最大值
    dragBtnSmallMax?: number
    // 滑块大的那一端的最小值
    dragBtnBigMin?: number
    // 当前的值
    value: number[]
}

// 配置项
export interface CircleSliderConf {
    ringConf: Required<RingConf>
    axisMark: Required<AxisMark>
    dragBtn: Required<DragBtn>
    dataConf: Required<DataConf>
    el: HTMLElement | string
}

// 用户传入
export type CircleSliderConfUser<T = CircleSliderConf> = {
    [P in keyof T]?: Partial<T[P]>
}

const defConf: CircleSliderConfUser = {
    ringConf: {
        sAngle: 135,
        eAngle: 405,
        ringW: 10,
        // org: { x: 0, y: 0 },
        // r: 20,
        bgc: '#ccc',
        activeBgc: '#0eb0c9',
    },
    axisMark: {
        fontSize: 14,
        fontColor: '#000',
        step: 1,
    },
    dragBtn: {
        // r: 5,
        bgc: '#ccc',
        activeBgc: '#0eb0c9',
    },
    dataConf: {
        min: 0,
        max: 10,
        // dragBtnBigMin: 5,
        // dragBtnSmallMax: 5,
    },
    el: '#circleSlider',
}

export default class CircleSlider {
    private conf: CircleSliderConf
    private userConf: CircleSliderConfUser
    // 用户提供的容器
    private userContainerEl: HTMLElement
    // canvas 的容器
    private containerEl: HTMLDivElement
    // 日期的宽高
    private containerWH: WH
    // canvas
    private canvasEl: HTMLCanvasElement
    // canvas 的上下文
    private ctx: CanvasRenderingContext2D
    // 当前的值的范围
    private nowValue: number[]

    constructor(conf: CircleSliderConfUser = {}) {
        this.conf = mergeData<CircleSliderConf>(
            defConf as CircleSliderConf,
            conf as CircleSliderConf
        )
        this.userConf = conf
        this.initConf()
        this.drawAll()
    }
    // 初始化元素相关
    initEl() {
        this.userContainerEl = getContainerEl(this.conf.el)
        this.containerEl = createContainerEl()
        this.userContainerEl.appendChild(this.containerEl)
        this.containerWH = getEleHW(this.containerEl)
        const { canvas, ctx } = createHDCanvas(
            this.containerWH.w,
            this.containerWH.h
        )
        this.canvasEl = canvas
        this.ctx = ctx
        this.containerEl.appendChild(this.canvasEl)
    }
    // 初始化默认值
    initConfDef() {
        const c = this.conf
        const uC = this.userConf
        // 环的中心 s
        if (uC?.ringConf?.org === undefined) {
            // 默认为容器中心
            c.ringConf.org = {
                x: Math.floor(this.containerWH.w / 2),
                y: Math.floor(this.containerWH.h / 2),
            }
        }
        // 环的中心 e

        // 环的半径 s
        if (uC?.ringConf?.r === undefined) {
            const yR = Math.floor(
                c.ringConf.org.y - c.axisMark.fontSize - c.ringConf.ringW / 2
            )
            const xR = Math.floor(
                c.ringConf.org.x - c.axisMark.fontSize - c.ringConf.ringW / 2
            )
            c.ringConf.r = Math.min(yR, xR)
        }

        // 环的半径 e

        // 按钮的半径 s
        if (uC?.dragBtn?.r === undefined) {
            c.dragBtn.r = Math.floor(c.ringConf.ringW / 2)
        }
        // 按钮的半径 e

        // 限制值 s
        if (uC?.dataConf?.dragBtnBigMin === undefined) {
            c.dataConf.dragBtnBigMin = c.dataConf.min
        }

        if (uC?.dataConf?.dragBtnSmallMax === undefined) {
            c.dataConf.dragBtnSmallMax = c.dataConf.max
        }
        // 限制值 e

        // 当前值 s
        if (uC.dataConf.value === undefined) {
            c.dataConf.value = [c.dataConf.min, c.dataConf.max]
        }
        this.nowValue = [...c.dataConf.value]
        // 当前值 e
    }
    // 初始化配置
    initConf() {
        this.initEl()
        this.initConfDef()
    }

    // 当前 值的角度
    get nowValueAngle() {
        const c = this.conf
        const value2AngleConf = {
            sAngle: c.ringConf.sAngle,
            eAngle: c.ringConf.eAngle,
            sV: c.dataConf.min,
            eV: c.dataConf.max,
        }
        const target = {
            sAngle: value2Angle(this.nowValue[0], value2AngleConf),
            eAngle: value2Angle(this.nowValue[1], value2AngleConf),
        }
        return target
    }

    // 绘制环
    drawRing() {
        const c = this.conf
        const ctx = this.ctx

        // 底层
        drawArc(ctx, {
            center: {
                x: c.ringConf.org.x,
                y: c.ringConf.org.y,
            },
            r: c.ringConf.r,
            startAngle: c.ringConf.sAngle,
            endAngle: c.ringConf.eAngle,
            drawStyle: {
                w: c.ringConf.ringW,
                style: c.ringConf.bgc,
                lineCap: 'round',
            },
        })
        // active 的环
        drawArc(ctx, {
            center: {
                x: c.ringConf.org.x,
                y: c.ringConf.org.y,
            },
            r: c.ringConf.r,
            startAngle: this.nowValueAngle.sAngle,
            endAngle: this.nowValueAngle.eAngle,
            drawStyle: {
                w: c.ringConf.ringW,
                style: c.ringConf.activeBgc,
                lineCap: 'round',
            },
        })
    }

    // 绘制
    drawAll() {
        this.drawRing()
    }
}
