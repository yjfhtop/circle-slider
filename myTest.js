// 角度转弧度
function angle2Radian(angle) {
    return angle * (Math.PI / 180)
}

// 弧度转角度
function radian2Angle(radian) {
    return (180 / Math.PI) * radian
}

const xie = Math.sqrt(2)

// 两点之间与x轴的夹角
function angle(org, b) {
    var dx = b.x - org.x
    var dy = b.y - org.y
    var dis = Math.sqrt(dx * dx + dy * dy)
    var rota = dis > 0 ? Math.round((Math.asin(dy / dis) / Math.PI) * 180) : 0
    // rota范围（-90，90）当b点在a点左边时，必要另处理
    if (b.x < org.x) {
        rota = 180 - rota
    }
    if (rota < 0) {
        return Math.abs(rota)
    } else {
        return 360 - rota
    }
}
const org = { x: 1, y: 1 }
console.log(angle(org, { x: 2, y: 2 }))

// 角度得 原上的点
function jdyx(angle, r, org = { x: 0, y: 0 }) {
    const x1 = org.x + r * Math.cos((angle * Math.PI) / 180)

    const y1 = org.y + r * Math.sin((angle * Math.PI) / 180)
    return {
        x: x1,
        y: y1,
    }
}

// console.log(jdyx(135, Math.sqrt(2)))
