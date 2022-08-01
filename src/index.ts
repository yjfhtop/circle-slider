// 坐标
import { angle2Radian, mergeData } from '@/utils/dataHandle'
import {
    createContainerEl,
    createHDCanvas,
    getContainerEl,
    getEleHW,
    getPixelRatio,
} from '@/utils/element'
import {
    DefSectorConfig,
    drawArc,
    drawCircular,
    drawRect,
    drawSector,
    drawTxt,
    RectConfig,
} from '@/utils/canvasDraw'
import {
    angle2Coordinate,
    pointInsideCircle,
    twoDotGetXAngle,
    value2Angle,
} from './utils/coordinate'
import { logError } from '@/utils/log'
import { getNearInterval } from '@/utils/index'

export interface Coordinate {
    x: number
    y: number
}

export interface WH {
    w: number
    h: number
}
export interface CalcAxisMarkItem {
    // 绘制的文本
    txt: string
    // 角度
    angle: number
    // 开始角度 拖拽使用
    sAngle: number
    // 结束角度 拖拽使用
    eAngle: number
    // 文本的对齐放方式
    textAlign: CanvasTextAlign
    // 文本的坐标
    coordinate: Coordinate
    // 对应的值
    v: number
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
    // 与环的间隔距离
    distance?: number
    // 轴标的数目, 尽可能接近本值
    axisMarkNumber?: number
}

// 拖拽的 按钮样式
export interface DragBtn {
    // 半径
    r?: number
    // 背景颜色
    bgc?: string
    // 选中后的颜色
    activeBgc?: string
    // 当前选中的按钮
    activeBtn?: 's' | 'e'
    shadow?: {
        x: number
        y: number
        blur: number
        color: string
    }
    // 选中按钮的 小圆的半径
    activeSmallR?: number
    // 选中按钮的 小圆的背景颜色
    activeSmallBgc?: string
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
    // 步长, 暂时未使用
    step?: number
}

export interface Grid {
    left?: number
    top?: number
    right?: number
    bottom?: number
}

export type ValueInconformityType = 's>e' | 'e<s' | 'min' | 'max'

// 配置项
export interface CircleSliderConf {
    ringConf: Required<RingConf>
    axisMark: Required<AxisMark>
    dragBtn: Required<DragBtn>
    dataConf: Required<DataConf>
    // el: HTMLElement | string
    grid: Grid
    // 是否禁用
    disable: boolean
    // 当选中的按钮变化时触发
    activeBtnChange: (type: DragBtn['activeBtn']) => any
    // 值改变时触发
    valueChange: (nowV: number[], type: DragBtn['activeBtn']) => any
    // 值不符合 时触发, 比如最大是12, 现在以及是12了, 你调用了增加当前值的方法, 就会触发本函数
    // s>e: 开始值将要大于 结束值 触发, 'e<s: 结束值将要小于开始值
    // min: 将要小于最小值  max: 将要大于最大值
    valueInconformity: (type: ValueInconformityType) => any
    // 是否允许 2个按钮重合
    coincide: boolean
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
        fontColor: '#ccc',
        distance: 10,
        axisMarkNumber: 11,
    },
    dragBtn: {
        // r: 5,
        bgc: '#ccc',
        activeBgc: '#00FF00',
        // activeSmallR: ,
        activeBtn: 's',
        activeSmallBgc: '#fff',
    },
    dataConf: {
        min: 0,
        max: 10,
        step: 1,
        // dragBtnBigMin: 5,
        // dragBtnSmallMax: 5,
    },
    // el: '#circleSlider',
    disable: false,
    grid: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 0,
    },
    coincide: false,
}

export default class CircleSlider {
    private conf: CircleSliderConf
    private userConf: CircleSliderConfUser
    // 用户提供的容器
    private userContainerEl: HTMLElement
    // canvas 的容器
    private containerEl: HTMLDivElement
    // 容器的宽高
    private containerWH: WH
    // canvas
    private canvasEl: HTMLCanvasElement
    // canvas 的上下文
    private ctx: CanvasRenderingContext2D
    // 当前的值的范围
    private nowValue: number[]
    // 轴标需要的数据 缓存(其中包含了 不需要作为轴标显示的 数据)
    private calcAxisMarkDataArrCache: CalcAxisMarkItem[]
    private pixelRatio = getPixelRatio()
    private eventObj: Record<string, any> = {}
    // 容器元素的位置
    private containerElDOMRectObj: DOMRect & { isDirty: boolean }

    constructor(
        public el: HTMLElement | string = '#circleSlider',
        conf: CircleSliderConfUser = {}
    ) {
        this.conf = mergeData<CircleSliderConf>(
            defConf as CircleSliderConf,
            conf as CircleSliderConf
        )
        this.userConf = conf
        this.initConf()
        if (this.checkConf()) {
            this.drawAll()
            this.initEvent()
        }
    }
    // 初始化元素相关
    initEl(resize = false) {
        if (!resize) {
            this.userContainerEl = getContainerEl(this.el)
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
        } else {
            this.containerEl.removeChild(this.canvasEl)
            this.containerWH = getEleHW(this.containerEl)
            const { canvas, ctx } = createHDCanvas(
                this.containerWH.w,
                this.containerWH.h
            )
            this.canvasEl = canvas
            this.ctx = ctx
            this.containerEl.appendChild(this.canvasEl)
        }
    }
    // 初始化默认值
    initConfDef() {
        const c = this.conf
        const uC = this.userConf
        // 环的中心 s
        if (uC?.ringConf?.org === undefined) {
            // 默认为容器中心
            c.ringConf.org = {
                x: Math.floor(
                    c.grid.left +
                        (this.containerWH.w - c.grid.left - c.grid.right) / 2
                ),
                y: Math.floor(
                    c.grid.top +
                        (this.containerWH.h - c.grid.top - c.grid.bottom) / 2
                ),
            }
        }
        // 环的中心 e

        // 环的半径 s
        if (uC?.ringConf?.r === undefined) {
            const yR = Math.floor(
                c.ringConf.org.y -
                    c.axisMark.fontSize -
                    c.ringConf.ringW / 2 -
                    c.grid.top
            )
            const xR = Math.floor(
                c.ringConf.org.x -
                    c.axisMark.fontSize -
                    c.ringConf.ringW / 2 -
                    c.grid.left
            )
            c.ringConf.r = Math.min(yR, xR)
        }

        // 环的半径 e

        // 按钮的半径 s
        if (uC?.dragBtn?.r === undefined) {
            // 1.8倍大小
            const baseR = Math.floor((c.ringConf.ringW / 2) * 1.8)
            c.dragBtn.r = baseR
        }
        if (uC?.dragBtn?.activeSmallR === undefined) {
            c.dragBtn.activeSmallR = c.dragBtn.r / 2
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
        if (uC?.dataConf?.value === undefined) {
            c.dataConf.value = [c.dataConf.min, c.dataConf.max]
        }
        this.nowValue = [...c.dataConf.value]
        // 当前值 e

        // 轴标的数目(这个是约值) axisMarkNumber s
        if (uC?.axisMark?.axisMarkNumber === undefined) {
            c.axisMark.axisMarkNumber = Math.min(
                Math.floor((c.dataConf.max - c.dataConf.min) / c.dataConf.step),
                Math.floor(this.seAngleDiff / 30)
            )
        }
        // 轴标的数目 axisMarkNumber e
    }
    // 校验
    checkConf() {
        // step s
        const c = this.conf
        const remainder = (c.dataConf.max - c.dataConf.min) % c.dataConf.step
        if (remainder !== 0) {
            logError(
                `checkConf`,
                `step: 无法被 max 和 min 的值整除, 请重新设置`
            )
            return false
        }
        // step e

        // 最大最小值的校验 s
        if (
            c.dataConf.value[0] < c.dataConf.min ||
            c.dataConf.value[1] > c.dataConf.max
        ) {
            logError(
                `checkConf`,
                `c.dataConf.value: 当前的值不在最大和最小值的范围内`
            )
            return false
        }
        // 最大最小值的校验 e

        return true
    }
    // 初始化配置
    initConf() {
        this.initEl()
        this.initConfDef()
    }

    get conRect() {
        if (!this.containerElDOMRectObj || this.containerElDOMRectObj.isDirty) {
            this.containerElDOMRectObj =
                this.containerEl.getBoundingClientRect() as any
        }
        return this.containerElDOMRectObj
    }

    // 获取当前激活按钮值
    get nowActiveV() {
        const activeType = this.conf.dragBtn.activeBtn
        if (activeType === 's') {
            return this.nowValue[0]
        }
        return this.nowValue[1]
    }

    // 角度差
    get seAngleDiff() {
        const c = this.conf
        return Math.abs(c.ringConf.eAngle - c.ringConf.sAngle)
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

    // 当前值的坐标
    get nowValueCoordinate() {
        const c = this.conf
        // 小值 按钮
        const minCoordinate = angle2Coordinate(
            this.nowValueAngle.sAngle,
            c.ringConf.r,
            c.ringConf.org
        )
        // 大值按钮
        const maxCoordinate = angle2Coordinate(
            this.nowValueAngle.eAngle,
            c.ringConf.r,
            c.ringConf.org
        )
        return {
            minCoordinate,
            maxCoordinate,
        }
    }

    // 轴标到圆心的距离
    get axisMarkR() {
        const c = this.conf
        return c.ringConf.r + c.ringConf.ringW / 2 + c.axisMark.distance
    }

    // 轴标的个数
    get markNumber() {
        const c = this.conf
        const number = (c.dataConf.max - c.dataConf.min) / c.dataConf.step
        return number + 1
    }

    // 每个 轴标的 间隔角度
    get markItemAngle() {
        const c = this.conf
        return Math.abs(c.ringConf.eAngle - c.ringConf.sAngle) / this.markNumber
    }

    // 获取轴标使用的数据
    get axisMarkDataArr() {
        if (this.calcAxisMarkDataArrCache) {
            return this.calcAxisMarkDataArrCache
        }
        this.calcAxisMark()
        return this.calcAxisMarkDataArrCache
    }

    // 每个要绘制的轴标间隔几个
    get markIntervalNumber() {
        return getNearInterval(
            this.axisMarkDataArr.length,
            this.conf.axisMark.axisMarkNumber
        )
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

    // 绘制拖动的按钮
    drawDragBtn() {
        const c = this.conf
        // 小值 按钮
        const nowValueCoordinate = this.nowValueCoordinate

        function setShadow(ctx: CanvasRenderingContext2D) {
            // box-shadow: 0px 2px 7.9px 0.1px rgba(0, 0, 0, 0.24);
            if (c.dragBtn.shadow) {
                const shadow = c.dragBtn.shadow
                ctx.shadowOffsetX = shadow.x || 0
                ctx.shadowOffsetY = shadow.y || 0
                ctx.shadowBlur = shadow.blur || 0
                ctx.shadowColor = shadow.color || 'rgba(255, 0, 0, 0.5)'
            }
        }

        const drawMinBtn = () => {
            // 小值按钮
            drawCircular(
                this.ctx,
                {
                    center: nowValueCoordinate.minCoordinate,
                    r: c.dragBtn.r,
                    drawStyle: {
                        style:
                            c.dragBtn.activeBtn === 's'
                                ? c.dragBtn.activeBgc
                                : c.dragBtn.bgc,
                    },
                    drawType: 'full',
                },
                setShadow
            )
        }

        const drawMaxBtn = () => {
            // 大值按钮
            drawCircular(
                this.ctx,
                {
                    center: nowValueCoordinate.maxCoordinate,
                    r: c.dragBtn.r,
                    drawStyle: {
                        style:
                            c.dragBtn.activeBtn === 'e'
                                ? c.dragBtn.activeBgc
                                : c.dragBtn.bgc,
                    },
                    drawType: 'full',
                },
                setShadow
            )
        }

        // 保证active 滑块在上
        if (this.conf.dragBtn.activeBtn === 's') {
            drawMaxBtn()
            drawMinBtn()
        } else {
            drawMinBtn()
            drawMaxBtn()
        }

        // 选中的 环绘制
        let activeC: Coordinate
        if (this.conf.dragBtn.activeBtn === 's') {
            activeC = nowValueCoordinate.minCoordinate
        } else {
            activeC = nowValueCoordinate.maxCoordinate
        }

        drawCircular(this.ctx, {
            center: activeC,
            r: c.dragBtn.activeSmallR,
            drawStyle: {
                style: c.dragBtn.activeSmallBgc,
            },
            drawType: 'full',
        })
    }

    // 获取轴标文字的对齐方式
    angleGetAlign(angle: number): CanvasTextAlign {
        const useAngle = angle % 360
        // 误差值
        const errorNumber = 2
        // center
        if (
            (useAngle >= 90 - errorNumber && useAngle <= 90 + errorNumber) ||
            (useAngle >= 270 - errorNumber && useAngle <= 270 + errorNumber)
        ) {
            return 'center'
        }

        if (useAngle > 90 && useAngle < 270) {
            return 'right'
        }
        return 'left'
    }

    // 计算 可能作为轴标 需要的数据
    calcAxisMark() {
        // this.calcAxisMarkDataArr
        const c = this.conf
        const min = c.dataConf.min
        const max = c.dataConf.max
        const dataArr: CalcAxisMarkItem[] = []
        const value2AngleConf = {
            sAngle: c.ringConf.sAngle,
            eAngle: c.ringConf.eAngle,
            sV: c.dataConf.min,
            eV: c.dataConf.max,
        }
        const axisMarkR = this.axisMarkR
        const itemAngle = this.markItemAngle
        const markNumber = this.markNumber
        for (let i = min; i <= max; i += c.dataConf.step) {
            // const itemV =
            const v = i
            const txt = String(v)
            const angle = value2Angle(i, value2AngleConf)
            // 文本的绘制坐标
            const coordinate = angle2Coordinate(
                angle,
                axisMarkR,
                c.ringConf.org
            )
            const sAngle = i === 0 ? angle : angle - itemAngle / 2
            const eAngle = i === markNumber - 1 ? angle : angle + itemAngle / 2
            const textAlign = this.angleGetAlign(angle)
            const item: CalcAxisMarkItem = {
                txt,
                angle,
                sAngle,
                eAngle,
                coordinate,
                textAlign,
                v,
            }
            dataArr.push(item)
        }
        this.calcAxisMarkDataArrCache = dataArr
    }
    // 绘制轴标
    drawAxisMark() {
        const c = this.conf
        const axisMarkDataArr = this.axisMarkDataArr
        const markIntervalNumber = this.markIntervalNumber
        for (let i = 0; i < axisMarkDataArr.length; i += markIntervalNumber) {
            const item = axisMarkDataArr[i]
            drawTxt(this.ctx, {
                coordinate: item.coordinate,
                txt: item.txt,
                fontSize: c.axisMark.fontSize,
                drawType: 'full',
                drawStyle: {
                    style: c.axisMark.fontColor,
                },
                textBaseline: 'middle',
                textAlign: item.textAlign,
                // textAlign: 'center',
            })
        }
    }

    // 判断 dot 是否在 按钮上,  multiple 的按钮的半径倍数, 越大, 按钮的可点击范围越大
    dotInDragBtn(dot: Coordinate, multiple = 1.5) {
        const c = this.conf
        const r = c.dragBtn.r
        const useR = r * multiple
        const nowValueCoordinate = this.nowValueCoordinate
        const inMin = pointInsideCircle(
            dot,
            nowValueCoordinate.minCoordinate,
            useR
        )
        const inMax = pointInsideCircle(
            dot,
            nowValueCoordinate.maxCoordinate,
            useR
        )
        return {
            inMin,
            inMax,
        }
    }

    // 判断点是否在环上
    dotInRing(dot: Coordinate, multiple = 1.5) {
        const c = this.conf
        const ctx = this.ctx
        let inRing = false
        ctx.save()
        ctx.beginPath()
        ctx.lineWidth = c.ringConf.ringW * multiple
        ctx.strokeStyle = '#000'
        ctx.arc(
            c.ringConf.org.x,
            c.ringConf.org.y,
            c.ringConf.r,
            c.ringConf.sAngle,
            c.ringConf.eAngle
        )
        inRing = ctx.isPointInStroke(
            dot.x * this.pixelRatio,
            dot.y * this.pixelRatio
        )
        ctx.restore()
        return inRing
    }

    // 设置 当前选中的 按钮
    setDragBtnActiveBtn(v: DragBtn['activeBtn']) {
        // 如果被禁用, 不变化
        if (this.conf.disable) {
            return
        }
        if (v !== this.conf.dragBtn.activeBtn) {
            this.conf.dragBtn.activeBtn = v
            this.conf.activeBtnChange && this.conf.activeBtnChange(v)
        }
    }

    // 判断当前是那种类型导致的不能够修改值
    getValueInconformityType(newV: number): ValueInconformityType {
        const c = this.conf
        const activeBtn = c.dragBtn.activeBtn
        if (activeBtn === 's') {
            if (newV > this.nowValue[1]) {
                return 's>e'
            }
        } else {
            if (newV < this.nowValue[0]) {
                return 'e<s'
            }
        }

        if (newV < c.dataConf.min) {
            return 'min'
        } else if (newV > c.dataConf.max) {
            return 'max'
        }
        return null
    }

    // 设置当前选中的值
    setNowActiveV(newV: number) {
        const c = this.conf
        const activeBtn = c.dragBtn.activeBtn
        const nowV = this.nowValue
        const dragBtnSmallMax = c.dataConf.dragBtnSmallMax
        const dragBtnBigMin = c.dataConf.dragBtnBigMin
        const type = this.getValueInconformityType(newV)
        if (newV < c.dataConf.min || newV > c.dataConf.max) {
            c.valueInconformity && c.valueInconformity(type)
            return false
        }
        // 判断是否符合
        if (activeBtn === 's') {
            if (this.nowValue[0] === newV) return
            if (
                (c.coincide ? newV <= nowV[1] : newV < nowV[1]) &&
                (typeof dragBtnSmallMax === 'number'
                    ? newV <= dragBtnSmallMax
                    : true)
            ) {
                // 符合
                this.nowValue[0] = newV
                c.valueChange && c.valueChange([...this.nowValue], 's')
                return true
            } else {
                c.valueInconformity && c.valueInconformity(type)
            }
        } else {
            if (this.nowValue[1] === newV) return
            if (
                (c.coincide ? newV >= nowV[0] : newV > nowV[0]) &&
                (typeof dragBtnBigMin === 'number'
                    ? newV >= dragBtnBigMin
                    : true)
            ) {
                // 符合
                this.nowValue[1] = newV
                c.valueChange && c.valueChange([...this.nowValue], 'e')
                return true
            } else {
                c.valueInconformity && c.valueInconformity(type)
            }
        }
    }
    // 画布上的点设置当前激活按钮的值
    dotSetActiveValue(dot: Coordinate) {
        const c = this.conf

        if (c.disable) {
            return
        }

        const axisMarkDataArr = this.axisMarkDataArr
        // 点在环上, 获取角度, 然后设置值
        const angle = twoDotGetXAngle(c.ringConf.org, { ...dot })
        // 判断角度在那个区间
        const targetItem = axisMarkDataArr.find((item) => {
            return angle >= item.sAngle && angle < item.eAngle
        })
        if (targetItem) {
            this.setNowActiveV(targetItem.v)
            this.drawAll()
        }
    }
    // 递增 或者 递减 当前激活按钮的值
    incOrDecActiveNow(type: '+' | '-' = '+') {
        if (this.conf.disable) return
        const c = this.conf
        const nowV = this.nowActiveV
        const nextV =
            type === '+' ? nowV + c.dataConf.step : nowV - c.dataConf.step
        this.setNowActiveV(nextV)
        this.drawAll()
    }
    // 初始化事件
    initEvent() {
        // 点击是否选中了按钮
        let clickActiveBtn = false
        // this.eventObj
        this.eventObj.touchstart = (e: TouchEvent) => {
            if (this.conf.disable) {
                return
            }
            e.stopPropagation()
            e.preventDefault()
            const conRect = this.conRect
            const x = e.touches[0].clientX - conRect.left
            const y = e.touches[0].clientY - conRect.top

            const nowValueCoordinate = this.nowValueCoordinate
            const axisMarkDataArr = this.axisMarkDataArr

            const dotInDragBtnObj = this.dotInDragBtn({ x, y }, 2)
            // 处理active的按钮
            if (dotInDragBtnObj.inMin && dotInDragBtnObj.inMax) {
                // 如果2点重合, 优先选中之前被选中的点
                const activeBtn = this.conf.dragBtn.activeBtn
                this.setDragBtnActiveBtn(activeBtn)
                clickActiveBtn = true
                this.drawAll()
            } else if (dotInDragBtnObj.inMin) {
                this.setDragBtnActiveBtn('s')
                clickActiveBtn = true
                this.drawAll()
            } else if (dotInDragBtnObj.inMax) {
                this.setDragBtnActiveBtn('e')
                clickActiveBtn = true
                this.drawAll()
            } else {
                clickActiveBtn = false
                // 没有在按钮上, 那么就尝试应用点击处理逻辑
                // 判断当前选中的按钮 和 角度, 进行变化
                const isInRing = this.dotInRing({ x, y }, 2)
                if (isInRing) {
                    this.dotSetActiveValue({ x, y })
                }
            }
        }
        this.eventObj.touchmove = (e: TouchEvent) => {
            if (this.conf.disable) {
                return
            }
            e.stopPropagation()
            e.preventDefault()
            const conRect = this.conRect
            const x = e.touches[0].clientX - conRect.left
            const y = e.touches[0].clientY - conRect.top
            if (clickActiveBtn) {
                // const angle = twoDotGetXAngle(c.ringConf.org, { x, y })
                this.dotSetActiveValue({ x, y })
            }
        }
        this.eventObj.touchend = (e: TouchEvent) => {
            if (this.conf.disable) {
                return
            }
            clickActiveBtn = false
        }

        this.eventObj.scroll = () => {
            this.containerElDOMRectObj &&
                (this.containerElDOMRectObj.isDirty = true)
        }

        this.containerEl.addEventListener(
            'touchstart',
            this.eventObj.touchstart
        )
        this.containerEl.addEventListener('touchmove', this.eventObj.touchmove)

        window.addEventListener('touchend', this.eventObj.touchend)
        window.addEventListener('scroll', this.eventObj.scroll)
    }

    unEvent() {
        this.containerEl.removeEventListener(
            'touchstart',
            this.eventObj.touchstart
        )
        this.containerEl.removeEventListener(
            'touchmove',
            this.eventObj.touchmove
        )
        window.removeEventListener('touchend', this.eventObj.touchend)
        window.removeEventListener('scroll', this.eventObj.scroll)
    }

    // 绘制
    drawAll() {
        this.ctx.clearRect(0, 0, this.containerWH.w, this.containerWH.h)
        this.drawRing()
        this.drawDragBtn()
        this.drawAxisMark()
    }
    // 处理窗口大小变化
    reSize() {
        this.pixelRatio = getPixelRatio()
        // dom 处理
        this.initEl(true)
        // 圆心 半径的变化
        this.initConfDef()
        // 处理轴标位置
        this.calcAxisMark()
        this.drawAll()
    }
    // 改变配置
    setOption(conf: CircleSliderConfUser = {}) {
        // this.userConf = conf
        // this.conf = mergeData<CircleSliderConf>(
        //     defConf as CircleSliderConf,
        //     conf as CircleSliderConf
        // )
        // this.initConfDef()
        // if (this.checkConf()) {
        //     console.log(this)
        //     this.drawAll()
        // }
    }
    destruction() {
        this.unEvent()
        this.userContainerEl.removeChild(this.containerEl)
    }
    // 启用和禁用
    disable(disable: boolean = false) {
        this.conf.disable = disable
    }
}
