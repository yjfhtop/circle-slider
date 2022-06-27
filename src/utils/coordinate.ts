/**
 * 处理坐标相关
 */
import { Coordinate } from '@/utils/canvasDraw'

/**
 * 两点获取 以dot为圆心，r为半径的 坐标（与dot2在同一射线上）
 * @param dot1
 * @param dot2
 * @param r
 */
export function dotAndDitRGetLineDot(
    dot1: Coordinate,
    dot2: Coordinate,
    r: number
) {
    const len = Math.sqrt((dot1.x - dot2.x) ** 2 + (dot1.y - dot2.y) ** 2)
    const sin = -(dot1.x - dot2.x) / len
    const cos = -(dot1.y - dot2.y) / len

    const x = r * sin
    const y = r * cos

    return {
        x: dot1.x + x,
        y: dot1.y + y,
    }
}

export interface GetAngleConf {
    sAngle: number
    eAngle: number
    sV: number
    eV: number
}

// 值转角度
export function value2Angle(v: number, conf: GetAngleConf) {
    const addDiffAngle = Math.abs(conf.eAngle - conf.sAngle)
    const allDiff = conf.eV - conf.sV
    const valueDiff = v - conf.sV
    return (valueDiff / allDiff) * addDiffAngle + conf.sAngle
}

// 角度得 原上的点
export function angle2Coordinate(
    angle: number,
    r: number,
    org = { x: 0, y: 0 }
) {
    const x1 = org.x + r * Math.cos((angle * Math.PI) / 180)

    const y1 = org.y + r * Math.sin((angle * Math.PI) / 180)
    return {
        x: x1,
        y: y1,
    }
}
