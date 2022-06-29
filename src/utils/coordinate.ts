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
    const target = (valueDiff / allDiff) * addDiffAngle + conf.sAngle
    if (target < 0) {
        return 360 + target
    } else {
        return target % 360
    }
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

// 判断点是否在圆上
export function pointInsideCircle(
    point: Coordinate,
    circle: Coordinate,
    r: number
) {
    if (r === 0) return false
    const dx = circle.x - point.x
    const dy = circle.y - point.y
    return dx * dx + dy * dy <= r * r
}

// 2 点 获取与x轴的角度(与x轴顺时针的角度 org: {0, 0 }, dot: { 1, -1 } 返回 45)
export function twoDotGetXAngle(org: Coordinate, dot: Coordinate) {
    const dx = dot.x - org.x
    const dy = dot.y - org.y
    const dis = Math.sqrt(dx * dx + dy * dy)
    let rota = dis > 0 ? Math.round((Math.asin(dy / dis) / Math.PI) * 180) : 0
    // rota范围（-90，90）当b点在a点左边时，必要另处理
    if (dot.x < org.x) {
        rota = 180 - rota
    }
    // if (rota < 0) {
    //     return Math.abs(rota)
    // } else {
    //     return 360 - rota
    // }
    // return rota
    if (rota < 0) {
        return 360 + rota
    }
    return rota
}
